import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const app = express();

// Rate limiting simples (em memória)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    return next(); // Desabilitar em desenvolvimento
  }

  const identifier = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const key = `${identifier}_${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  
  const current = rateLimitMap.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    });
  }
  
  current.count++;
  rateLimitMap.set(key, current);
  
  // Limpar entradas antigas periodicamente
  if (Math.random() < 0.01) { // 1% de chance de limpar
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }
  }
  
  next();
}

// Configuração de CORS (DEVE SER O PRIMEIRO MIDDLEWARE)
const corsOptions = {
  origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

if (process.env.NODE_ENV === 'production') {
  app.use(cors(corsOptions));
} else {
  app.use(cors());
}

// Rate limiting (aplicar após CORS)
app.use(rateLimitMiddleware);

// Configuração de body parser com limite
const maxBodySize = process.env.MAX_BODY_SIZE ? parseInt(process.env.MAX_BODY_SIZE) : 10485760; // 10MB padrão
app.use(express.json({ limit: `${maxBodySize}b` }));
app.use(express.urlencoded({ extended: true, limit: `${maxBodySize}b` }));

// Middleware de segurança para produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

// JWT_SECRET é obrigatório em produção
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'dev-secret-change-me' || JWT_SECRET === 'CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_IN_PRODUCTION') {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERRO CRÍTICO: JWT_SECRET não configurado! Configure a variável JWT_SECRET no arquivo .env');
    process.exit(1);
  }
  console.warn('⚠️  AVISO: Usando JWT_SECRET padrão inseguro. Configure JWT_SECRET para produção!');
}

const FINAL_JWT_SECRET = JWT_SECRET || 'dev-secret-change-me';

type AuthedRequest = express.Request & { user?: { id: string; role: string; username: string } };

function authMiddleware(required: boolean = true) {
  return (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      if (required) return res.status(401).json({ error: 'missing token' });
      return next();
    }
    const token = header.replace('Bearer ', '');
    try {
      const payload = jwt.verify(token, FINAL_JWT_SECRET) as any;
      req.user = { id: payload.id, role: payload.role, username: payload.username };
      next();
    } catch {
      return res.status(401).json({ error: 'invalid token' });
    }
  };
}

function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});
// Webhook PIX (demo): confirmação de pagamento
app.post('/webhooks/pix', async (req, res) => {
  try {
    const body = req.body as any;
    const txid = body?.txid || body?.endToEndId || body?.pix?.[0]?.txid;
    if (!txid) return res.status(400).json({ error: 'missing txid' });
    // Em produção, localizar fatura/assinatura pelo txid e marcar como paga
    console.log('PIX webhook recebido (demo):', txid);
    try {
      // encontrar assinatura pelo txid e marcar como ativa
      const sub = await prisma.subscription.findFirst({ where: { txid } as any });
      if (sub) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'active' } });
      }
    } catch (e) {
      console.warn('Erro ao processar webhook PIX:', e);
    }
    // Responder 200 imediatamente
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'webhook error' });
  }
});

// Persistência simples de comunicações em arquivo (fallback quando banco indisponível)
const COMM_LOG_FILE = path.join(process.cwd(), 'comm_logs.json');
function readCommLogs() {
  try { return JSON.parse(fs.readFileSync(COMM_LOG_FILE, 'utf-8')); } catch { return []; }
}
function writeCommLogs(logs: any[]) {
  try { fs.writeFileSync(COMM_LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8'); } catch {}
}

app.get('/api/comms/logs', authMiddleware(false), async (_req, res) => {
  try {
    const logs = readCommLogs();
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/comms/logs', authMiddleware(false), async (req, res) => {
  try {
    const body = req.body as any;
    const logs = readCommLogs();
    logs.push({ ...body, at: new Date().toISOString() });
    writeCommLogs(logs);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Criação pública de assinatura após pagamento (simplificado)
app.post('/api/public/subscriptions', async (req, res) => {
  try {
    const body = z.object({ username: z.string(), planName: z.string(), txid: z.string() }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);
    const { username, planName, txid } = body.data;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: 'user not found' });
    let plan = await prisma.plan.findFirst({ where: { name: planName } });
    if (!plan) plan = await prisma.plan.create({ data: { name: planName, priceCents: 0, interval: 'monthly' } as any });
    // criar tenant para o usuário se não houver
    let tenant = await prisma.tenant.findFirst({ where: { users: { some: { userId: user.id } } } });
    if (!tenant) tenant = await prisma.tenant.create({ data: { name: `${username}-tenant`, users: { create: { userId: user.id, role: 'owner' } } } });
    const sub = await prisma.subscription.create({ data: { tenantId: tenant.id, planId: plan.id, status: 'active', txid } as any });
    // ativar licença do usuário
    const lic = await prisma.license.upsert({ where: { userId: user.id }, update: { status: 'active', activatedAt: new Date() }, create: { userId: user.id, status: 'active', activatedAt: new Date() } });
    res.json({ ok: true, subscription: sub, license: lic });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Leads (captação de clientes da demo)
const LEADS_FILE = path.join(process.cwd(), 'leads.json');
function readLeads() {
  try { return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8')); } catch { return []; }
}
function writeLeads(leads: any[]) {
  try { fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8'); } catch {}
}

// Criar lead (público)
app.post('/api/public/leads', async (req, res) => {
  try {
    const body = z.object({ name: z.string(), email: z.string(), phone: z.string(), company: z.string().optional(), username: z.string().optional() }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);
    const leads = readLeads();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const lead = { id, status: 'pending', createdAt: new Date().toISOString(), ...body.data };
    leads.push(lead);
    writeLeads(leads);
    res.json({ ok: true, lead });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Listar leads (admin)
app.get('/api/leads', authMiddleware(), requireRole('admin','superadmin'), async (_req, res) => {
  res.json(readLeads());
});

// Pending Users (cadastros pendentes de aprovação)
const PENDING_USERS_FILE = path.join(process.cwd(), 'pending_users.json');
function readPendingUsers() {
  try { return JSON.parse(fs.readFileSync(PENDING_USERS_FILE, 'utf-8')); } catch { return []; }
}
function writePendingUsers(users: any[]) {
  try { fs.writeFileSync(PENDING_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8'); } catch {}
}

// Registro público de usuários
app.post('/api/public/register', async (req, res) => {
  try {
    const body = z.object({ 
      name: z.string(), 
      email: z.string().email(), 
      phone: z.string(), 
      password: z.string().min(6),
      userType: z.enum(['pessoa-fisica', 'pessoa-juridica']),
      company: z.string().optional(),
      cnpj: z.string().optional(),
      cpf: z.string().optional()
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);
    
    const { name, email, phone, password, userType, company, cnpj, cpf } = body.data;
    
    // Verificar se já existe
    const exists = await prisma.user.findFirst({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email já cadastrado' });
    
    // Verificar se já está pendente
    const pendingUsers = readPendingUsers();
    const alreadyPending = pendingUsers.find((u: any) => u.email === email);
    if (alreadyPending) return res.status(400).json({ error: 'Cadastro já está pendente de aprovação' });
    
    // Salvar como pendente com ID único
    const id = `pending_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    pendingUsers.push({ 
      id,
      name, 
      email, 
      phone, 
      password, // Será usado na criação do usuário
      userType, 
      company, 
      cnpj, 
      cpf, 
      status: 'pending',
      createdAt: new Date().toISOString() 
    });
    writePendingUsers(pendingUsers);
    
    res.json({ ok: true, message: 'Cadastro enviado para aprovação', id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Listar usuários pendentes (admin)
app.get('/api/pending-users', authMiddleware(), requireRole('admin','superadmin'), async (_req, res) => {
  try {
    const pendingUsers = readPendingUsers();
    res.json(pendingUsers);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Aprovar usuário pendente -> cria usuário
app.post('/api/pending-users/:id/approve', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const pendingUsers = readPendingUsers();
    const pendingUser = pendingUsers.find((u: any) => u.id === id);
    if (!pendingUser) return res.status(404).json({ error: 'Usuário pendente não encontrado' });
    
    // Gerar username único
    const baseUsername = (pendingUser.name || 'cliente').toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || `cli_${Date.now()}`;
    
    let username = baseUsername;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    // Validar senha
    if (!pendingUser.password || pendingUser.password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    
    // Criar usuário no banco de dados
    const hashedPassword = await bcrypt.hash(pendingUser.password, 10);
    const user = await prisma.user.create({ 
      data: { 
        username, 
        password: hashedPassword, 
        role: 'user', 
        email: pendingUser.email,
        phone: pendingUser.phone
      } as any 
    });
    
    // Criar licença trial
    await prisma.license.create({ 
      data: { 
        userId: user.id, 
        status: 'trial', 
        trialStart: new Date(), 
        trialDays: 30 
      } 
    });
    
    // Remover da lista de pendentes
    const rest = pendingUsers.filter((u: any) => u.id !== id);
    writePendingUsers(rest);
    
    // Notificações via WhatsApp (CallMeBot)
    try {
      const apikey = process.env.CALLMEBOT_API_KEY || '1782254';
      const normalizePhone = (p: string) => {
        const d = (p || '').replace(/\D/g, '');
        if (!d) return '';
        return d.startsWith('55') ? `+${d}` : `+55${d}`;
      };
      const clientPhone = normalizePhone(pendingUser.phone || '');
      if (clientPhone) {
        const appDomain = process.env.VITE_APP_DOMAIN || 'localhost:5173';
        const appProtocol = process.env.VITE_APP_PROTOCOL || 'http';
        const appUrl = `${appProtocol}://${appDomain}`;
        const text = encodeURIComponent(`✅ Aprovado!\nSeu acesso foi criado.\nUsuário: ${username}\nSenha: ${pendingUser.password}\nLink: ${appUrl}`);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(clientPhone)}&text=${text}&apikey=${encodeURIComponent(apikey)}`;
        await fetch(url);
      }
      const adminPhone = process.env.ADMIN_PHONE || '+5511984801839';
      const adminText = encodeURIComponent(`🆕 Usuário aprovado e criado: ${username}\nNome: ${pendingUser.name}\nEmail: ${pendingUser.email}\nFone: ${pendingUser.phone}`);
      const adminUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(adminPhone)}&text=${adminText}&apikey=${encodeURIComponent(apikey)}`;
      await fetch(adminUrl);
    } catch (e) {
      console.warn('Erro ao enviar notificação WhatsApp:', e);
    }
    
    res.json({ ok: true, approved: username, user: { id: user.id, username, email: user.email } });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Recuperação de senha
app.post('/api/public/reset-password', async (req, res) => {
  try {
    const { email, code } = z.object({ email: z.string().email(), code: z.string() }).parse(req.body);
    // Salvar solicitação
    const resets = JSON.parse(fs.readFileSync('reset_requests.json', 'utf-8').catch(()=>'[]'));
    resets.push({ email, code, createdAt: new Date().toISOString() });
    fs.writeFileSync('reset_requests.json', JSON.stringify(resets, null, 2));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Recuperação de usuário
app.post('/api/public/reset-username', async (req, res) => {
  try {
    const { email, phone, code } = z.object({ email: z.string().email(), phone: z.string(), code: z.string() }).parse(req.body);
    // Salvar solicitação
    const resets = JSON.parse(fs.readFileSync('username_reset_requests.json', 'utf-8').catch(()=>'[]'));
    resets.push({ email, phone, code, createdAt: new Date().toISOString() });
    fs.writeFileSync('username_reset_requests.json', JSON.stringify(resets, null, 2));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Aprovar lead -> cria usuário
app.post('/api/leads/:id/approve', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const leads = readLeads();
    const lead = leads.find((l:any)=> l.id === id);
    if (!lead) return res.status(404).json({ error: 'lead not found' });
    
    // Gerar username único
    const baseUsername = (lead.username || lead.name || 'cliente').toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || `cli_${Date.now()}`;
    
    let username = baseUsername;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) {
      // Gerar senha temporária segura
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!1';
      const hashed = await bcrypt.hash(tempPassword, 10);
      const user = await prisma.user.create({ 
        data: { 
          username, 
          password: hashed, 
          role: 'user', 
          email: (lead.email||undefined),
          phone: (lead.phone||undefined)
        } as any 
      });
      await prisma.license.create({ 
        data: { 
          userId: user.id, 
          status: 'trial', 
          trialStart: new Date(), 
          trialDays: 30 
        } 
      });
    }
    const rest = leads.filter((l:any)=> l.id !== id);
    writeLeads(rest);
    // Notificações via WhatsApp (CallMeBot)
    try {
      const apikey = process.env.CALLMEBOT_API_KEY || '1782254';
      const normalizePhone = (p:string)=>{
        const d = (p||'').replace(/\D/g,'');
        if (!d) return '';
        return d.startsWith('55') ? `+${d}` : `+55${d}`;
      };
      const clientPhone = normalizePhone(lead.phone || '');
      if (clientPhone) {
        const appDomain = process.env.VITE_APP_DOMAIN || 'localhost:5173';
        const appProtocol = process.env.VITE_APP_PROTOCOL || 'http';
        const appUrl = `${appProtocol}://${appDomain}`;
        const text = encodeURIComponent(`✅ Aprovado!\nSeu acesso foi criado.\nUsuário: ${username}\nSenha: ${tempPassword}\nLink: ${appUrl}`);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(clientPhone)}&text=${text}&apikey=${encodeURIComponent(apikey)}`;
        await fetch(url);
      }
      const adminPhone = process.env.ADMIN_PHONE || '+5511984801839';
      const adminText = encodeURIComponent(`🆕 Lead aprovado e usuário criado: ${username}\nNome: ${lead.name}\nEmail: ${lead.email}\nFone: ${lead.phone}`);
      const adminUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(adminPhone)}&text=${adminText}&apikey=${encodeURIComponent(apikey)}`;
      await fetch(adminUrl);
    } catch (e) {
      console.warn('Erro ao enviar notificação WhatsApp:', e);
    }
    res.json({ ok: true, approved: username });
  } catch (e:any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Excluir lead
app.delete('/api/leads/:id', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Tentando excluir lead com ID: ${id}`);
    const leads = readLeads();
    console.log(`📋 Total de leads antes: ${leads.length}`);
    
    const leadToDelete = leads.find((l: any) => l.id === id);
    if (!leadToDelete) {
      console.log(`❌ Lead não encontrado: ${id}`);
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    const rest = leads.filter((l:any)=> l.id !== id);
    writeLeads(rest);
    console.log(`✅ Lead excluído: ${leadToDelete.name} (${leadToDelete.email})`);
    console.log(`📋 Total de leads depois: ${rest.length}`);
    
    res.json({ ok: true, message: 'Lead excluído com sucesso', deleted: leadToDelete });
  } catch (e: any) {
    console.error('❌ Erro ao excluir lead:', e);
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Excluir usuário pendente
app.delete('/api/pending-users/:id', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Tentando excluir usuário pendente com ID: ${id}`);
    const pendingUsers = readPendingUsers();
    console.log(`📋 Total de usuários pendentes antes: ${pendingUsers.length}`);
    
    const userToDelete = pendingUsers.find((u: any) => u.id === id);
    if (!userToDelete) {
      console.log(`❌ Usuário pendente não encontrado: ${id}`);
      return res.status(404).json({ error: 'Usuário pendente não encontrado' });
    }
    
    const rest = pendingUsers.filter((u: any) => u.id !== id);
    writePendingUsers(rest);
    console.log(`✅ Usuário pendente excluído: ${userToDelete.name} (${userToDelete.email})`);
    console.log(`📋 Total de usuários pendentes depois: ${rest.length}`);
    
    res.json({ ok: true, message: 'Cadastro pendente excluído com sucesso', deleted: userToDelete });
  } catch (e: any) {
    console.error('❌ Erro ao excluir usuário pendente:', e);
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Criar usuário de demo (público) – usado após verificação do WhatsApp
app.post('/api/public/demo-user', async (req, res) => {
  try {
    const body = z.object({ username: z.string().min(3), password: z.string().min(6), email: z.string().optional() }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);
    const { username, password, email } = body.data;
    
    // Validar senha
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return res.json({ ok: true, user: { id: exists.id, username: exists.username } });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashed, role: 'user', email: email || undefined } as any });
    await prisma.license.create({ data: { userId: user.id, status: 'trial', trialStart: new Date(), trialDays: 30 } });
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Seed superadmin (dev-only) - DESABILITAR EM PRODUÇÃO
app.post('/api/seed/superadmin', async (_req, res) => {
  // Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Esta rota está desabilitada em produção' });
  }
  
  try {
    const exists = await prisma.user.findUnique({ where: { username: 'Admin' } });
    if (exists) return res.json({ ok: true, user: exists });
    // Gerar senha segura para dev
    const devPassword = process.env.DEV_ADMIN_PASSWORD || 'Admin123!@#';
    const hashed = await bcrypt.hash(devPassword, 10);
    const user = await prisma.user.create({ data: { username: 'Admin', password: hashed, role: 'superadmin' } });
    await prisma.license.create({ data: { userId: user.id, status: 'trial', trialStart: new Date(), trialDays: 7 } });
    res.json({ ok: true, user, message: '⚠️ Usar apenas em desenvolvimento!' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'seed failed' });
  }
});

// Seed all users (dev-only) - DESABILITAR EM PRODUÇÃO
app.post('/api/seed/users', async (_req, res) => {
  // Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Esta rota está desabilitada em produção' });
  }
  
  try {
    // Criar usuário Webyte (cliente)
    const webyteUser = await prisma.user.upsert({
      where: { username: 'Webyte' },
      update: {},
      create: {
        username: 'Webyte',
        password: await bcrypt.hash('Webyte', 10),
        role: 'user',
      },
    });

    // Criar usuário admin (superadmin)
    const adminPassword = process.env.DEV_ADMIN_PASSWORD || 'Admin123!@#';
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: await bcrypt.hash(adminPassword, 10),
        role: 'superadmin',
      },
    });

    // Criar usuário demo
    const demoPassword = process.env.DEV_DEMO_PASSWORD || 'Demo123!@#';
    const demoUser = await prisma.user.upsert({
      where: { username: 'demo' },
      update: {},
      create: {
        username: 'demo',
        password: await bcrypt.hash(demoPassword, 10),
        role: 'user',
      },
    });

    // Criar usuário para caderno de notas
    const cadernoUser = await prisma.user.upsert({
      where: { username: 'caderno' },
      update: {},
      create: {
        username: 'caderno',
        password: await bcrypt.hash('caderno2025', 10),
        role: 'user',
      },
    });

    res.json({ 
      message: 'Usuários criados com sucesso',
      users: [
        { username: webyteUser.username, role: webyteUser.role },
        { username: adminUser.username, role: adminUser.role },
        { username: demoUser.username, role: demoUser.role },
        { username: cadernoUser.username, role: cadernoUser.role },
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create users' });
  }
});

// Users
app.post('/api/users', authMiddleware(), requireRole('superadmin'), async (req, res) => {
  const body = z.object({ username: z.string().min(3), password: z.string().min(3), role: z.string().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const { username, password, role } = body.data;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashed, role: role ?? 'user' } });
    // Create trial license
    await prisma.license.create({ data: { userId: user.id, status: 'trial', trialStart: new Date(), trialDays: 7 } });
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/users', authMiddleware(), requireRole('admin','superadmin'), async (_req, res) => {
  const users = await prisma.user.findMany({ include: { license: true } });
  res.json(users);
});

app.patch('/api/users/:id/role', authMiddleware(), requireRole('superadmin'), async (req, res) => {
  const { id } = req.params;
  const body = z.object({ role: z.enum(['user','admin','superadmin']) }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  try {
    const updated = await prisma.user.update({ where: { id }, data: { role: body.data.role } });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

// Licenses
app.get('/api/licenses/:username', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({ where: { username }, include: { license: true } });
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json(user.license);
});

app.post('/api/licenses/:username/activate', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  const { username } = req.params;
  const body = z.object({ key: z.string().min(6), validityDays: z.number().int().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const { key, validityDays } = body.data;

  const user = await prisma.user.findUnique({ where: { username }, include: { license: true } });
  if (!user || !user.license) return res.status(404).json({ error: 'user/license not found' });

  if (!user.license.activationKey || user.license.activationKey.toUpperCase() !== key.toUpperCase()) {
    return res.status(403).json({ error: 'invalid key' });
  }

  const validUntil = validityDays && validityDays > 0 ? new Date(Date.now() + validityDays * 86400000) : null;
  const updated = await prisma.license.update({ where: { userId: user.id }, data: { status: 'active', activatedAt: new Date(), validUntil } });
  res.json(updated);
});

app.post('/api/licenses/:username/block', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({ where: { username }, include: { license: true } });
  if (!user || !user.license) return res.status(404).json({ error: 'user/license not found' });
  const activationKey = Math.random().toString(36).slice(2, 12).toUpperCase();
  const updated = await prisma.license.update({ where: { userId: user.id }, data: { status: 'blocked', activationKey } });
  res.json(updated);
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const body = z.object({ username: z.string(), password: z.string() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const { username, password } = body.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, FINAL_JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role, username: user.username });
});

app.get('/api/auth/me', authMiddleware(), async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  res.json(req.user);
});

// Self license ensure/activate for logged user
app.post('/api/self/license/ensure', authMiddleware(), async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  let user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { license: true } });
  if (!user) return res.status(404).json({ error: 'user not found' });
  if (!user.license) {
    user = await prisma.user.update({ where: { id: req.user.id }, data: { license: { create: { status: 'trial', trialStart: new Date(), trialDays: 7 } } }, include: { license: true } });
  }
  const lic = user.license!;
  const expired = new Date().getTime() > new Date(lic.trialStart).getTime() + lic.trialDays * 86400000;
  if (expired && lic.status !== 'blocked' && lic.status !== 'active') {
    const activationKey = Math.random().toString(36).slice(2, 12).toUpperCase();
    const updated = await prisma.license.update({ where: { userId: user.id }, data: { status: 'blocked', activationKey } });
    try {
      const phone = process.env.ADMIN_PHONE || '+5511984801839';
      const apikey = process.env.CALLMEBOT_API_KEY || '1782254';
      const text = encodeURIComponent(`O teste de um usuário expirou. Chave de ativação gerada: ${activationKey}`);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${text}&apikey=${encodeURIComponent(apikey)}`;
      await fetch(url);
    } catch (e) {
      console.warn('Erro ao enviar notificação WhatsApp:', e);
    }
    return res.json(updated);
  }
  res.json(lic);
});

app.post('/api/self/license/activate', authMiddleware(), async (req: AuthedRequest, res) => {
  const body = z.object({ key: z.string().min(6), validityDays: z.number().int().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { license: true } });
  if (!user || !user.license) return res.status(404).json({ error: 'user/license not found' });
  if (!user.license.activationKey || user.license.activationKey.toUpperCase() !== body.data.key.toUpperCase()) {
    return res.status(403).json({ error: 'invalid key' });
  }
  const validUntil = body.data.validityDays && body.data.validityDays > 0 ? new Date(Date.now() + body.data.validityDays * 86400000) : null;
  const updated = await prisma.license.update({ where: { userId: user.id }, data: { status: 'active', activatedAt: new Date(), validUntil } });
  res.json(updated);
});

// Tenants (superadmin only)
app.post('/api/tenants', authMiddleware(), requireRole('superadmin'), async (req, res) => {
  const body = z.object({ name: z.string().min(2) }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  try {
    const tenant = await prisma.tenant.create({ data: { name: body.data.name } });
    res.json(tenant);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/tenants', authMiddleware(), requireRole('superadmin'), async (_req, res) => {
  const tenants = await prisma.tenant.findMany({ include: { subscriptions: true, users: true } });
  res.json(tenants);
});

app.post('/api/tenants/:tenantId/users', authMiddleware(), requireRole('superadmin'), async (req, res) => {
  const { tenantId } = req.params;
  const body = z.object({ userId: z.string(), role: z.string().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  try {
    const ut = await prisma.userTenant.create({ data: { tenantId, userId: body.data.userId, role: body.data.role ?? 'member' } });
    res.json(ut);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/plans', authMiddleware(), requireRole('superadmin'), async (req, res) => {
  const body = z.object({ name: z.string(), priceCents: z.number().int(), interval: z.enum(['monthly','yearly']), features: z.any().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  try {
    const plan = await prisma.plan.create({ data: { ...body.data } });
    res.json(plan);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/tenants/:tenantId/subscriptions', authMiddleware(), requireRole('superadmin'), async (req, res) => {
  const { tenantId } = req.params;
  const body = z.object({ planId: z.string(), status: z.string().default('active'), validUntil: z.string().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  try {
    const sub = await prisma.subscription.create({ data: { tenantId, planId: body.data.planId, status: body.data.status, validUntil: body.data.validUntil ? new Date(body.data.validUntil) : null } });
    res.json(sub);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

// Password reset (admin/superadmin only)
app.post('/api/users/:id/reset-password', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  const { id } = req.params;
  const body = z.object({ newPassword: z.string().min(6) }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  try {
    const hashed = await bcrypt.hash(body.data.newPassword, 10);
    const updated = await prisma.user.update({ where: { id }, data: { password: hashed } });
    res.json({ ok: true, id: updated.id });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

// Update user (admin/superadmin only)
app.patch('/api/users/:id', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  const { id } = req.params;
  const body = z.object({ 
    username: z.string().min(3).optional(),
    role: z.enum(['user','admin','superadmin']).optional(),
    password: z.string().min(6).optional()
  }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  try {
    const updateData: any = {};
    if (body.data.username) updateData.username = body.data.username;
    if (body.data.role) updateData.role = body.data.role;
    if (body.data.password) updateData.password = await bcrypt.hash(body.data.password, 10);
    
    const updated = await prisma.user.update({ where: { id }, data: updateData });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

// Delete user (superadmin only)
app.delete('/api/users/:id', authMiddleware(), requireRole('superadmin'), async (req, res) => {
  const { id } = req.params;
  try {
    // Não permitir deletar o próprio usuário
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'failed' });
  }
});

// CMS Configuration APIs
const CMS_CONFIG_FILE = path.join(process.cwd(), 'cms-config.json');

// Get CMS configuration
app.get('/api/cms/config', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CMS_CONFIG_FILE, 'utf-8').catch(() => '{}'));
    res.json(config);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Update CMS configuration
app.post('/api/cms/config', authMiddleware(), requireRole('admin','superadmin'), async (req, res) => {
  const body = z.object({
    landingPage: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      primaryColor: z.string().optional(),
      theme: z.string().optional(),
      logo: z.string().optional(),
      favicon: z.string().optional()
    }).optional(),
    sections: z.object({
      hero: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        ctaText: z.string().optional()
      }).optional(),
      plans: z.object({
        title: z.string().optional(),
        description: z.string().optional()
      }).optional(),
      testimonials: z.object({
        title: z.string().optional(),
        description: z.string().optional()
      }).optional(),
      features: z.object({
        title: z.string().optional(),
        description: z.string().optional()
      }).optional(),
      faq: z.object({
        title: z.string().optional(),
        description: z.string().optional()
      }).optional(),
      footer: z.object({
        title: z.string().optional(),
        description: z.string().optional()
      }).optional()
    }).optional()
  }).safeParse(req.body);
  
  if (!body.success) return res.status(400).json(body.error);
  
  try {
    const currentConfig = JSON.parse(fs.readFileSync(CMS_CONFIG_FILE, 'utf-8').catch(() => '{}'));
    const updatedConfig = { ...currentConfig, ...body.data };
    fs.writeFileSync(CMS_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    res.json(updatedConfig);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// APIs de Assinaturas Avançadas
app.get('/api/subscriptions/user/:userId', authMiddleware(), async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;
    const userSubs = await prisma.userSubscription.findMany({
      where: { userId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
    res.json(
      userSubs.map((us) => ({
        id: us.subscription.id,
        userId: us.userId,
        planId: us.subscription.planId,
        planName: us.subscription.plan.name,
        status: us.status,
        startedAt: us.startedAt,
        expiresAt: us.expiresAt,
        validUntil: us.subscription.validUntil,
        autoRenew: us.subscription.autoRenew,
        lastNotificationAt: us.lastNotificationAt,
        txid: us.subscription.txid,
      }))
    );
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/subscriptions', authMiddleware(), async (req: AuthedRequest, res) => {
  try {
    const body = z
      .object({
        userId: z.string(),
        planId: z.string(),
        planName: z.string(),
        interval: z.enum(['monthly', 'yearly']),
      })
      .safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const { userId, planId, planName, interval } = body.data;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'user not found' });

    let tenant = await prisma.tenant.findFirst({
      where: { users: { some: { userId } } },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: `${user.username}-tenant`,
          users: { create: { userId, role: 'owner' } },
        },
      });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'plan not found' });

    const days = interval === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        status: 'active',
        expiresAt,
        validUntil: expiresAt,
        autoRenew: true,
      },
    });

    const userSubscription = await prisma.userSubscription.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        status: 'active',
        expiresAt,
      },
    });

    // Atualizar licença do usuário
    await prisma.license.updateMany({
      where: { userId },
      data: {
        status: 'active',
        validUntil: expiresAt,
        expiresAt,
      },
    });

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'subscription.created',
        entityType: 'subscription',
        entityId: subscription.id,
        details: JSON.stringify({ planId, planName, interval }),
      },
    });

    res.json({
      id: subscription.id,
      userId,
      planId,
      planName,
      status: 'active',
      startedAt: subscription.startedAt,
      expiresAt,
      validUntil: expiresAt,
      autoRenew: true,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/subscriptions/:id/renew', authMiddleware(), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = z.object({ licenseKey: z.string() }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, userSubscriptions: true },
    });
    if (!subscription) return res.status(404).json({ error: 'subscription not found' });

    // Validar chave de licença
    const userSub = subscription.userSubscriptions[0];
    if (!userSub) return res.status(404).json({ error: 'user subscription not found' });

    const user = await prisma.user.findUnique({
      where: { id: userSub.userId },
      include: { license: true },
    });
    if (!user || !user.license) return res.status(404).json({ error: 'license not found' });

    if (
      !user.license.renewalKey ||
      user.license.renewalKey.toUpperCase() !== body.data.licenseKey.toUpperCase()
    ) {
      return res.status(403).json({ error: 'invalid license key' });
    }

    // Renovar assinatura
    const days = subscription.plan.interval === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { id },
      data: {
        status: 'active',
        expiresAt,
        validUntil: expiresAt,
        lastNotificationAt: null,
      },
    });

    await prisma.userSubscription.updateMany({
      where: { subscriptionId: id },
      data: {
        status: 'active',
        expiresAt,
        lastNotificationAt: null,
      },
    });

    await prisma.license.update({
      where: { userId: user.id },
      data: {
        status: 'active',
        validUntil: expiresAt,
        expiresAt,
        renewalKey: null,
      },
    });

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'subscription.renewed',
        entityType: 'subscription',
        entityId: id,
        details: JSON.stringify({ licenseKey: body.data.licenseKey }),
      },
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/subscriptions/:id/cancel', authMiddleware(), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.subscription.update({
      where: { id },
      data: { status: 'canceled' },
    });
    await prisma.userSubscription.updateMany({
      where: { subscriptionId: id },
      data: { status: 'canceled' },
    });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Validação pública de licenças (para landing page)
app.post('/api/public/licenses/validate', async (req, res) => {
  try {
    const body = z.object({ key: z.string().min(6) }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const { key } = body.data;
    const license = await prisma.license.findFirst({
      where: {
        OR: [
          { activationKey: { equals: key, mode: 'insensitive' } },
          { renewalKey: { equals: key, mode: 'insensitive' } },
        ],
      },
      include: {
        user: {
          include: {
            subscriptions: {
              include: {
                subscription: {
                  include: { plan: true },
                },
              },
            },
          },
        },
      },
    });

    if (!license) {
      return res.json({ valid: false, message: 'Licença não encontrada' });
    }

    const now = new Date();
    const isExpired =
      license.expiresAt && new Date(license.expiresAt).getTime() < now.getTime();
    const isValidStatus = license.status === 'active' || license.status === 'trial';

    if (isExpired || !isValidStatus) {
      return res.json({
        valid: false,
        message: 'Licença expirada ou inválida',
      });
    }

    // Buscar assinatura ativa
    const activeSub = license.user.subscriptions.find(
      (us) => us.status === 'active' && (!us.expiresAt || new Date(us.expiresAt) > now)
    );

    if (activeSub) {
      return res.json({
        valid: true,
        subscription: {
          id: activeSub.subscription.id,
          planName: activeSub.subscription.plan.name,
          expiresAt: activeSub.expiresAt,
        },
        message: 'Licença válida',
      });
    }

    return res.json({ valid: true, message: 'Licença válida' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// APIs Admin para gerenciamento de assinaturas
app.get('/api/admin/subscriptions', authMiddleware(), requireRole('admin', 'superadmin'), async (_req, res) => {
  try {
    const userSubs = await prisma.userSubscription.findMany({
      include: {
        user: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      userSubs.map((us) => ({
        id: us.subscription.id,
        userId: us.userId,
        username: us.user.username,
        planId: us.subscription.planId,
        planName: us.subscription.plan.name,
        status: us.status,
        startedAt: us.startedAt,
        expiresAt: us.expiresAt,
        validUntil: us.subscription.validUntil,
        autoRenew: us.subscription.autoRenew,
        lastNotificationAt: us.lastNotificationAt,
        txid: us.subscription.txid,
      }))
    );
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/admin/payments', authMiddleware(), requireRole('admin', 'superadmin'), async (_req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      payments.map((p) => ({
        id: p.id,
        userId: p.userId,
        username: p.user.username,
        subscriptionId: p.subscriptionId,
        amountCents: p.amountCents,
        currency: p.currency,
        method: p.method,
        status: p.status,
        txid: p.txid,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      }))
    );
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/admin/subscriptions/:id/activate', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const body = z.object({ licenseKey: z.string() }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, userSubscriptions: true },
    });
    if (!subscription) return res.status(404).json({ error: 'subscription not found' });

    const days = subscription.plan.interval === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { id },
      data: {
        status: 'active',
        expiresAt,
        validUntil: expiresAt,
      },
    });

    await prisma.userSubscription.updateMany({
      where: { subscriptionId: id },
      data: {
        status: 'active',
        expiresAt,
      },
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/admin/subscriptions/:id/revoke', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { userSubscriptions: true },
    });
    if (!subscription) return res.status(404).json({ error: 'subscription not found' });

    await prisma.subscription.update({
      where: { id },
      data: { status: 'expired' },
    });

    await prisma.userSubscription.updateMany({
      where: { subscriptionId: id },
      data: { status: 'expired' },
    });

    const userIds = subscription.userSubscriptions.map((us) => us.userId);
    await prisma.license.updateMany({
      where: { userId: { in: userIds } },
      data: { status: 'expired' },
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/admin/payments/:id/update', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const body = z.object({ status: z.enum(['pending', 'paid', 'failed', 'refunded']) }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!payment) return res.status(404).json({ error: 'payment not found' });

    const updateData: any = { status: body.data.status };
    if (body.data.status === 'paid') {
      updateData.paidAt = new Date();
      // Ativar assinatura se houver
      if (payment.subscriptionId) {
        await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: 'active' },
        });
        await prisma.userSubscription.updateMany({
          where: { subscriptionId: payment.subscriptionId },
          data: { status: 'active' },
        });
      }
    }

    await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Webhook melhorado para pagamentos PIX
app.post('/webhooks/pix', async (req, res) => {
  try {
    const body = req.body as any;
    const txid = body?.txid || body?.endToEndId || body?.pix?.[0]?.txid;
    if (!txid) return res.status(400).json({ error: 'missing txid' });

    console.log('PIX webhook recebido:', txid);

    // Buscar pagamento pelo TXID
    const payment = await prisma.payment.findFirst({
      where: { txid },
      include: {
        subscription: {
          include: {
            plan: true,
            userSubscriptions: true,
          },
        },
        user: {
          include: { license: true },
        },
      },
    });

    if (payment && payment.status === 'pending') {
      // Marcar pagamento como pago
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      // Ativar assinatura se houver
      if (payment.subscriptionId) {
        const subscription = payment.subscription;
        const days = subscription.plan.interval === 'yearly' ? 365 : 30;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'active',
            expiresAt,
            validUntil: expiresAt,
          },
        });

        await prisma.userSubscription.updateMany({
          where: { subscriptionId: payment.subscriptionId },
          data: {
            status: 'active',
            expiresAt,
          },
        });

        // Atualizar licença do usuário
        if (payment.user.license) {
          await prisma.license.update({
            where: { userId: payment.userId },
            data: {
              status: 'active',
              validUntil: expiresAt,
              expiresAt,
            },
          });
        }
      }

      // Criar webhook log
      await prisma.webhook.create({
        data: {
          event: 'payment.confirmed',
          payload: JSON.stringify(body),
          source: 'pix',
          status: 'processed',
          processedAt: new Date(),
        },
      });

      // Criar log de auditoria
      await prisma.auditLog.create({
        data: {
          userId: payment.userId,
          action: 'payment.received',
          entityType: 'payment',
          entityId: payment.id,
          details: JSON.stringify({ txid, method: 'pix' }),
        },
      });
    }

    res.json({ ok: true });
  } catch (e: any) {
    console.error('Erro no webhook PIX:', e);
    res.status(500).json({ error: e?.message || 'webhook error' });
  }
});

// Job para verificar assinaturas expirando (deve ser executado periodicamente)
app.post('/api/admin/subscriptions/check-expiring', authMiddleware(), requireRole('admin', 'superadmin'), async (_req, res) => {
  try {
    const now = new Date();
    const daysUntilExpiry = 7;
    const expiryThreshold = new Date(now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);

    // Buscar assinaturas expirando
    const expiringSubs = await prisma.userSubscription.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lte: expiryThreshold,
          gte: now,
        },
        lastNotificationAt: {
          OR: [
            { equals: null },
            { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Notificar no máximo uma vez por dia
          ],
        },
      },
      include: {
        user: true,
        subscription: {
          include: { plan: true },
        },
      },
    });

    // Atualizar status para expiring_soon
    for (const sub of expiringSubs) {
      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: {
          status: 'expiring_soon',
          lastNotificationAt: now,
        },
      });

      await prisma.subscription.update({
        where: { id: sub.subscriptionId },
        data: {
          status: 'expiring_soon',
          lastNotificationAt: now,
        },
      });

      await prisma.license.updateMany({
        where: { userId: sub.userId },
        data: {
          status: 'expiring_soon',
          lastNotificationAt: now,
        },
      });
    }

    // Buscar assinaturas expiradas
    const expiredSubs = await prisma.userSubscription.findMany({
      where: {
        status: { in: ['active', 'expiring_soon'] },
        expiresAt: {
          lt: now,
        },
      },
      include: {
        user: true,
        subscription: true,
      },
    });

    // Marcar como expiradas
    for (const sub of expiredSubs) {
      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });

      await prisma.subscription.update({
        where: { id: sub.subscriptionId },
        data: { status: 'expired' },
      });

      await prisma.license.updateMany({
        where: { userId: sub.userId },
        data: { status: 'expired' },
      });
    }

    res.json({
      expiring: expiringSubs.length,
      expired: expiredSubs.length,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// CORS já foi configurado no início do arquivo

// Middleware de validação de entrada
function validateInput(input: any, type: 'string' | 'number' | 'email' | 'uuid'): boolean {
  if (input === null || input === undefined) return false;
  
  switch (type) {
    case 'string':
      return typeof input === 'string' && input.length > 0 && input.length <= 1000;
    case 'number':
      return typeof input === 'number' && !isNaN(input) && isFinite(input);
    case 'email':
      return typeof input === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    case 'uuid':
      return typeof input === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
    default:
      return true;
  }
}

// Sanitização de entrada
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Tratamento de erros global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Log de auditoria para erros críticos
  if (process.env.NODE_ENV === 'production') {
    // Em produção, registrar erros críticos
    prisma.auditLog.create({
      data: {
        action: 'error.server',
        entityType: 'system',
        details: JSON.stringify({
          message: err.message,
          url: req.url,
          method: req.method,
          ip: req.ip
        }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined
      }
    }).catch(() => {
      // Ignorar erros ao salvar log de auditoria
    });
  }
  
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message || 'Erro desconhecido',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    timestamp: new Date().toISOString()
  });
});

// Handler para rotas não encontradas
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Configuração de porta
const port = parseInt(process.env.PORT || '4000', 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// Inicializar servidor com tratamento de erros
const server = app.listen(port, host, () => {
  console.log(`🚀 API server running on http://${host}:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ CORS: Habilitado`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔒 Security: JWT_SECRET ${FINAL_JWT_SECRET === 'dev-secret-change-me' ? '⚠️  NOT CONFIGURED' : '✅ Configured'}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
  }
  console.log(`\n📌 Endpoints disponíveis:`);
  console.log(`   - Health: http://${host}:${port}/health`);
  console.log(`   - API: http://${host}:${port}/api`);
});

// Tratamento de erros do servidor
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ERRO: Porta ${port} já está em uso!`);
    console.error(`   Feche o processo usando a porta ${port} ou altere a porta no arquivo .env`);
    process.exit(1);
  } else {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    prisma.$disconnect();
    process.exit(0);
  });
});


