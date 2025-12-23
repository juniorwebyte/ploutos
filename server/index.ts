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

// ============================================
// CONTROLE DE PONTO - APIs
// ============================================

// Helper para criar log de auditoria
async function createTimeClockAuditLog(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string | undefined,
  oldValue: any,
  newValue: any,
  details: any,
  req: express.Request
) {
  try {
    await prisma.timeClockAuditLog.create({
      data: {
        userId: userId || undefined,
        action,
        entityType,
        entityId: entityId || undefined,
        oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
        newValue: newValue ? JSON.stringify(newValue) : undefined,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
      },
    });
  } catch (e) {
    console.warn('Erro ao criar log de auditoria:', e);
  }
}

// ============================================
// EMPRESAS
// ============================================

app.get('/api/timeclock/companies', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(companies);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/timeclock/companies/:id', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        employees: true,
        schedules: true,
        holidays: true,
        settings: true,
      },
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/companies', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    console.log('POST /api/timeclock/companies - Body recebido:', JSON.stringify(req.body, null, 2));
    console.log('POST /api/timeclock/companies - Headers:', req.headers);
    
    const body = z.object({
      name: z.string().min(2),
      cnpj: z.string().optional().nullable(),
      email: z.union([z.string().email(), z.literal(''), z.null()]).optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      zipCode: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }).safeParse(req.body);
    if (!body.success) {
      console.error('Erro de validação:', body.error.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    // Preparar dados - incluir todos os campos, mesmo null
    const data: any = {
      name: body.data.name,
      cnpj: body.data.cnpj || null,
      email: body.data.email || null,
      phone: body.data.phone || null,
      address: body.data.address || null,
      city: body.data.city || null,
      state: body.data.state || null,
      zipCode: body.data.zipCode || null,
      isActive: body.data.isActive !== undefined ? body.data.isActive : true,
    };

    console.log('Dados preparados para criação:', JSON.stringify(data, null, 2));
    
    const company = await prisma.company.create({
      data,
    });

    console.log('Empresa criada com sucesso:', company.id);

    // Criar configurações padrão
    await prisma.companySettings.create({
      data: {
        companyId: company.id,
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'company.created',
      'company',
      company.id,
      null,
      company,
      { name: company.name },
      req
    );

    res.json(company);
  } catch (e: any) {
    console.error('Erro ao criar empresa:', e);
    res.status(500).json({ error: e?.message || 'failed', stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined });
  }
});

app.patch('/api/timeclock/companies/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = z.object({
      name: z.string().min(2).optional(),
      cnpj: z.string().optional(),
      email: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      isActive: z.boolean().optional(),
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const oldCompany = await prisma.company.findUnique({ where: { id } });
    if (!oldCompany) return res.status(404).json({ error: 'Company not found' });

    // Preparar dados - converter campos vazios para null
    const updateData: any = {};
    if (body.data.name !== undefined) updateData.name = body.data.name;
    if (body.data.cnpj !== undefined) updateData.cnpj = body.data.cnpj || null;
    if (body.data.email !== undefined) updateData.email = body.data.email || null;
    if (body.data.phone !== undefined) updateData.phone = body.data.phone || null;
    if (body.data.address !== undefined) updateData.address = body.data.address || null;
    if (body.data.city !== undefined) updateData.city = body.data.city || null;
    if (body.data.state !== undefined) updateData.state = body.data.state || null;
    if (body.data.zipCode !== undefined) updateData.zipCode = body.data.zipCode || null;
    if (body.data.isActive !== undefined) updateData.isActive = body.data.isActive;

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'company.updated',
      'company',
      company.id,
      oldCompany,
      company,
      {},
      req
    );

    res.json(company);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.delete('/api/timeclock/companies/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    await prisma.company.delete({ where: { id } });

    await createTimeClockAuditLog(
      req.user?.id,
      'company.deleted',
      'company',
      id,
      company,
      null,
      {},
      req
    );

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// FILIAIS
// ============================================

app.get('/api/timeclock/branches', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { companyId } = req.query;
    const where: any = {};
    if (companyId) where.companyId = companyId as string;

    const branches = await prisma.branch.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(branches);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/timeclock/branches/:id', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { company: true, employees: true },
    });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/branches', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      companyId: z.string(),
      name: z.string().min(2),
      code: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      radius: z.number().optional(),
      authorizedIPs: z.string().optional(), // JSON string
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    // Preparar dados - processar authorizedIPs e converter campos vazios para null
    const data: any = {
      companyId: body.data.companyId,
      name: body.data.name,
      code: body.data.code || null,
      address: body.data.address || null,
      city: body.data.city || null,
      state: body.data.state || null,
      zipCode: body.data.zipCode || null,
      latitude: body.data.latitude || null,
      longitude: body.data.longitude || null,
      radius: body.data.radius || 100,
      isActive: true,
    };
    
    // Processar authorizedIPs se fornecido - salvar como JSON string
    if (body.data.authorizedIPs) {
      try {
        let ips: string[];
        if (typeof body.data.authorizedIPs === 'string') {
          // Tentar parsear como JSON primeiro
          try {
            ips = JSON.parse(body.data.authorizedIPs);
          } catch {
            // Se não for JSON, tratar como string separada por vírgula
            ips = body.data.authorizedIPs.split(',').map((ip: string) => ip.trim()).filter((ip: string) => ip.length > 0);
          }
        } else if (Array.isArray(body.data.authorizedIPs)) {
          ips = body.data.authorizedIPs;
        } else {
          ips = [];
        }
        if (ips.length > 0) {
          data.authorizedIPs = JSON.stringify(ips);
        }
      } catch (e) {
        console.error('Erro ao processar authorizedIPs:', e);
      }
    }

    const branch = await prisma.branch.create({
      data,
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'branch.created',
      'branch',
      branch.id,
      null,
      branch,
      { name: branch.name, companyId: branch.companyId },
      req
    );

    res.json(branch);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.patch('/api/timeclock/branches/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = z.object({
      name: z.string().min(2).optional(),
      code: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      radius: z.number().optional(),
      authorizedIPs: z.string().optional(),
      isActive: z.boolean().optional(),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    const oldBranch = await prisma.branch.findUnique({ where: { id } });
    if (!oldBranch) return res.status(404).json({ error: 'Branch not found' });

    // Preparar dados - processar authorizedIPs e converter campos vazios para null
    const updateData: any = {};
    if (body.data.name !== undefined) updateData.name = body.data.name;
    if (body.data.code !== undefined) updateData.code = body.data.code || null;
    if (body.data.address !== undefined) updateData.address = body.data.address || null;
    if (body.data.city !== undefined) updateData.city = body.data.city || null;
    if (body.data.state !== undefined) updateData.state = body.data.state || null;
    if (body.data.zipCode !== undefined) updateData.zipCode = body.data.zipCode || null;
    if (body.data.latitude !== undefined) updateData.latitude = body.data.latitude || null;
    if (body.data.longitude !== undefined) updateData.longitude = body.data.longitude || null;
    if (body.data.radius !== undefined) updateData.radius = body.data.radius || 100;
    if (body.data.isActive !== undefined) updateData.isActive = body.data.isActive;
    
    // Processar authorizedIPs se fornecido
    if (body.data.authorizedIPs !== undefined) {
      if (body.data.authorizedIPs) {
        try {
          let ips: string[];
          if (typeof body.data.authorizedIPs === 'string') {
            try {
              ips = JSON.parse(body.data.authorizedIPs);
            } catch {
              ips = body.data.authorizedIPs.split(',').map((ip: string) => ip.trim()).filter((ip: string) => ip.length > 0);
            }
          } else if (Array.isArray(body.data.authorizedIPs)) {
            ips = body.data.authorizedIPs;
          } else {
            ips = [];
          }
          if (ips.length > 0) {
            updateData.authorizedIPs = JSON.stringify(ips);
          } else {
            updateData.authorizedIPs = null;
          }
        } catch (e) {
          console.error('Erro ao processar authorizedIPs:', e);
        }
      } else {
        updateData.authorizedIPs = null;
      }
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: updateData,
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'branch.updated',
      'branch',
      branch.id,
      oldBranch,
      branch,
      {},
      req
    );

    res.json(branch);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.delete('/api/timeclock/branches/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    await prisma.branch.delete({ where: { id } });

    await createTimeClockAuditLog(
      req.user?.id,
      'branch.deleted',
      'branch',
      id,
      branch,
      null,
      {},
      req
    );

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// DEPARTAMENTOS
// ============================================

app.get('/api/timeclock/departments', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(departments);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/timeclock/departments/:id', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
    });
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/departments', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      code: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    // Preparar dados
    const data: any = {
      name: body.data.name,
      code: body.data.code || null,
      description: body.data.description || null,
      isActive: body.data.isActive !== undefined ? body.data.isActive : true,
    };

    const department = await prisma.department.create({
      data,
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'department.created',
      'department',
      department.id,
      null,
      department,
      { name: department.name },
      req
    );

    res.json(department);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.patch('/api/timeclock/departments/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = z.object({
      name: z.string().min(2).optional(),
      code: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    const oldDept = await prisma.department.findUnique({ where: { id } });
    if (!oldDept) return res.status(404).json({ error: 'Department not found' });

    const department = await prisma.department.update({
      where: { id },
      data: body.data,
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'department.updated',
      'department',
      department.id,
      oldDept,
      department,
      {},
      req
    );

    res.json(department);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.delete('/api/timeclock/departments/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// FUNCIONÁRIOS
// ============================================

app.get('/api/timeclock/employees', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { companyId, branchId, departmentId, status, isActive } = req.query;
    const where: any = {};
    if (companyId) where.companyId = companyId as string;
    if (branchId) where.branchId = branchId as string;
    if (departmentId) where.departmentId = departmentId as string;
    if (status) where.status = status as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const employees = await prisma.employee.findMany({
      where,
      include: {
        workSchedule: true,
        branch: true,
        department: true,
        user: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(employees);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/timeclock/employees/:id', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        workSchedule: true,
        branch: { include: { company: true } },
        department: true,
        user: true,
      },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/employees', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      companyId: z.string(),
      branchId: z.string().optional(),
      departmentId: z.string().optional(),
      userId: z.string().optional(),
      name: z.string().min(2),
      cpf: z.string().optional(),
      rg: z.string().optional(),
      email: z.union([z.string().email(), z.literal('')]).optional(),
      phone: z.string().optional(),
      birthDate: z.string().optional(),
      address: z.string().optional(),
      employeeCode: z.string().optional(),
      position: z.string().optional(),
      function: z.string().optional(),
      contractType: z.string().optional(),
      hireDate: z.string().optional(),
      salary: z.number().optional(),
      workScheduleId: z.string().optional(),
      workHours: z.number().optional(),
      workDays: z.string().optional(), // JSON string
      accessLevel: z.enum(['employee', 'manager', 'admin']).optional(),
      canRegisterPoint: z.boolean().optional(),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    // Preparar dados - converter campos vazios para null
    const data: any = {
      companyId: body.data.companyId,
      name: body.data.name,
      branchId: body.data.branchId || null,
      departmentId: body.data.departmentId || null,
      userId: body.data.userId || null,
      cpf: body.data.cpf || null,
      rg: body.data.rg || null,
      email: body.data.email || null,
      phone: body.data.phone || null,
      birthDate: body.data.birthDate ? new Date(body.data.birthDate) : null,
      address: body.data.address || null,
      employeeCode: body.data.employeeCode || null,
      position: body.data.position || null,
      function: body.data.function || null,
      contractType: body.data.contractType || null,
      hireDate: body.data.hireDate ? new Date(body.data.hireDate) : null,
      salary: body.data.salary || null,
      workScheduleId: body.data.workScheduleId || null,
      workHours: body.data.workHours || null,
      accessLevel: body.data.accessLevel || 'employee',
      canRegisterPoint: body.data.canRegisterPoint !== undefined ? body.data.canRegisterPoint : true,
      status: 'active',
      isActive: true,
    };
    if (body.data.workDays) {
      try {
        const days = typeof body.data.workDays === 'string' ? JSON.parse(body.data.workDays) : body.data.workDays;
        if (Array.isArray(days)) {
          data.workDays = JSON.stringify(days);
        }
      } catch {
        // Ignorar erro
      }
    }

    const employee = await prisma.employee.create({
      data,
      include: {
        workSchedule: true,
        branch: true,
        department: true,
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'employee.created',
      'employee',
      employee.id,
      null,
      employee,
      { name: employee.name, companyId: employee.companyId },
      req
    );

    res.json(employee);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.patch('/api/timeclock/employees/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = z.object({
      name: z.string().min(2).optional(),
      branchId: z.string().optional(),
      departmentId: z.string().optional(),
      position: z.string().optional(),
      function: z.string().optional(),
      contractType: z.string().optional(),
      workScheduleId: z.string().optional(),
      workHours: z.number().optional(),
      accessLevel: z.enum(['employee', 'manager', 'admin']).optional(),
      canRegisterPoint: z.boolean().optional(),
      isActive: z.boolean().optional(),
      status: z.enum(['active', 'inactive', 'suspended', 'dismissed']).optional(),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    const oldEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!oldEmployee) return res.status(404).json({ error: 'Employee not found' });

    const employee = await prisma.employee.update({
      where: { id },
      data: body.data,
      include: {
        workSchedule: true,
        branch: true,
        department: true,
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'employee.updated',
      'employee',
      employee.id,
      oldEmployee,
      employee,
      {},
      req
    );

    res.json(employee);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.delete('/api/timeclock/employees/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    await prisma.employee.delete({ where: { id } });

    await createTimeClockAuditLog(
      req.user?.id,
      'employee.deleted',
      'employee',
      id,
      employee,
      null,
      {},
      req
    );

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Gerar QR Code para funcionário
app.post('/api/timeclock/employees/:id/qrcode', authMiddleware(), requireRole('admin', 'superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const code = `QR${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    const qrCode = await prisma.qRCode.create({
      data: {
        employeeId: id,
        code,
        token,
        expiresAt,
      },
    });

    await prisma.employee.update({
      where: { id },
      data: {
        qrCode: code,
        qrCodeExpiresAt: expiresAt,
      },
    });

    res.json(qrCode);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// JORNADAS DE TRABALHO
// ============================================

app.get('/api/timeclock/schedules', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { companyId } = req.query;
    const where: any = {};
    if (companyId) where.companyId = companyId as string;

    const schedules = await prisma.workSchedule.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(schedules);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/schedules', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      companyId: z.string(),
      name: z.string().min(2),
      description: z.string().optional(),
      type: z.enum(['fixed', 'flexible', 'shift_12x36', 'custom']),
      workDays: z.string().optional(), // JSON string
      workHours: z.number().default(8),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
      breakDuration: z.number().optional(),
      minHours: z.number().optional(),
      maxHours: z.number().optional(),
      shiftDays: z.number().optional(),
      restDays: z.number().optional(),
      allowOvertime: z.boolean().optional(),
      maxOvertime: z.number().optional(),
      tolerance: z.number().optional(),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    // Preparar dados - processar workDays e converter campos vazios para null
    const data: any = {
      companyId: body.data.companyId,
      name: body.data.name,
      type: body.data.type,
      workHours: body.data.workHours || 8,
      description: body.data.description || null,
      startTime: body.data.startTime || null,
      endTime: body.data.endTime || null,
      breakStart: body.data.breakStart || null,
      breakEnd: body.data.breakEnd || null,
      breakDuration: body.data.breakDuration || null,
      minHours: body.data.minHours || null,
      maxHours: body.data.maxHours || null,
      shiftDays: body.data.shiftDays || null,
      restDays: body.data.restDays || null,
      allowOvertime: body.data.allowOvertime !== undefined ? body.data.allowOvertime : true,
      maxOvertime: body.data.maxOvertime || null,
      tolerance: body.data.tolerance || 5,
    };
    
    // Processar workDays - salvar como JSON string
    if (body.data.workDays) {
      try {
        let days: string[];
        if (typeof body.data.workDays === 'string') {
          try {
            days = JSON.parse(body.data.workDays);
          } catch {
            // Se não for JSON, tratar como string separada por vírgula
            days = body.data.workDays.split(',').map((d: string) => d.trim().toLowerCase()).filter((d: string) => d.length > 0);
          }
        } else if (Array.isArray(body.data.workDays)) {
          days = body.data.workDays;
        } else {
          days = [];
        }
        if (days.length > 0) {
          data.workDays = JSON.stringify(days);
        } else {
          data.workDays = JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        }
      } catch (e) {
        console.error('Erro ao processar workDays:', e);
        data.workDays = JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      }
    } else {
      data.workDays = JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    }

    const schedule = await prisma.workSchedule.create({
      data,
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'schedule.created',
      'schedule',
      schedule.id,
      null,
      schedule,
      { name: schedule.name, companyId: schedule.companyId },
      req
    );

    res.json(schedule);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.patch('/api/timeclock/schedules/:id', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = z.object({
      companyId: z.string().optional(),
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      type: z.enum(['fixed', 'flexible', 'shift_12x36', 'custom']).optional(),
      workDays: z.string().optional(),
      workHours: z.number().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
      breakDuration: z.number().optional(),
      minHours: z.number().optional(),
      maxHours: z.number().optional(),
      shiftDays: z.number().optional(),
      restDays: z.number().optional(),
      allowOvertime: z.boolean().optional(),
      maxOvertime: z.number().optional(),
      tolerance: z.number().optional(),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: body.error.errors });
    }

    const oldSchedule = await prisma.workSchedule.findUnique({ where: { id } });
    if (!oldSchedule) return res.status(404).json({ error: 'Schedule not found' });

    // Preparar dados de atualização
    const updateData: any = {};
    if (body.data.companyId !== undefined) updateData.companyId = body.data.companyId;
    if (body.data.name !== undefined) updateData.name = body.data.name;
    if (body.data.description !== undefined) updateData.description = body.data.description || null;
    if (body.data.type !== undefined) updateData.type = body.data.type;
    if (body.data.workHours !== undefined) updateData.workHours = body.data.workHours;
    if (body.data.startTime !== undefined) updateData.startTime = body.data.startTime || null;
    if (body.data.endTime !== undefined) updateData.endTime = body.data.endTime || null;
    if (body.data.breakStart !== undefined) updateData.breakStart = body.data.breakStart || null;
    if (body.data.breakEnd !== undefined) updateData.breakEnd = body.data.breakEnd || null;
    if (body.data.breakDuration !== undefined) updateData.breakDuration = body.data.breakDuration || null;
    if (body.data.minHours !== undefined) updateData.minHours = body.data.minHours || null;
    if (body.data.maxHours !== undefined) updateData.maxHours = body.data.maxHours || null;
    if (body.data.shiftDays !== undefined) updateData.shiftDays = body.data.shiftDays || null;
    if (body.data.restDays !== undefined) updateData.restDays = body.data.restDays || null;
    if (body.data.allowOvertime !== undefined) updateData.allowOvertime = body.data.allowOvertime;
    if (body.data.maxOvertime !== undefined) updateData.maxOvertime = body.data.maxOvertime || null;
    if (body.data.tolerance !== undefined) updateData.tolerance = body.data.tolerance || 5;

    // Processar workDays se fornecido
    if (body.data.workDays !== undefined) {
      try {
        let days: string[];
        if (typeof body.data.workDays === 'string') {
          try {
            days = JSON.parse(body.data.workDays);
          } catch {
            days = body.data.workDays.split(',').map((d: string) => d.trim().toLowerCase()).filter((d: string) => d.length > 0);
          }
        } else if (Array.isArray(body.data.workDays)) {
          days = body.data.workDays;
        } else {
          days = [];
        }
        if (days.length > 0) {
          updateData.workDays = JSON.stringify(days);
        }
      } catch (e) {
        console.error('Erro ao processar workDays:', e);
      }
    }

    const schedule = await prisma.workSchedule.update({
      where: { id },
      data: updateData,
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'schedule.updated',
      'schedule',
      schedule.id,
      oldSchedule,
      schedule,
      {},
      req
    );

    res.json(schedule);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// REGISTRO DE PONTO
// ============================================

app.post('/api/timeclock/register', authMiddleware(), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      employeeId: z.string(),
      type: z.enum(['entry', 'exit', 'break_start', 'break_end', 'overtime_start', 'overtime_end']),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      method: z.enum(['manual', 'qrcode', 'geolocation', 'ip', 'biometric']),
      qrCodeId: z.string().optional(),
      notes: z.string().optional(),
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const employee = await prisma.employee.findUnique({
      where: { id: body.data.employeeId },
      include: { branch: true },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    if (!employee.isActive || employee.status !== 'active') {
      return res.status(403).json({ error: 'Employee is not active' });
    }

    // Validações
    let isValid = true;
    let validationMessage = '';
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;

    // Validar geolocalização se necessário
    if (body.data.latitude && body.data.longitude && employee.branch) {
      const branch = employee.branch;
      if (branch.latitude && branch.longitude && branch.radius) {
        const distance = calculateDistance(
          body.data.latitude,
          body.data.longitude,
          branch.latitude,
          branch.longitude
        );
        if (distance > branch.radius) {
          isValid = false;
          validationMessage = `Registro fora do raio permitido (${distance.toFixed(0)}m > ${branch.radius}m)`;
        }
      }
    }

    // Validar IP se necessário
    if (ipAddress && employee.branch?.authorizedIPs) {
      try {
        const authorizedIPs = JSON.parse(employee.branch.authorizedIPs);
        if (Array.isArray(authorizedIPs) && !authorizedIPs.includes(ipAddress)) {
          isValid = false;
          validationMessage = 'IP não autorizado para esta filial';
        }
      } catch {}
    }

    // Verificar duplicatas (mesmo tipo no mesmo dia)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingRecord = await prisma.timeClock.findFirst({
      where: {
        employeeId: body.data.employeeId,
        type: body.data.type,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const isDuplicate = !!existingRecord;

    // Criar registro
    const timeClock = await prisma.timeClock.create({
      data: {
        employeeId: body.data.employeeId,
        branchId: employee.branchId || undefined,
        type: body.data.type,
        timestamp: new Date(),
        latitude: body.data.latitude,
        longitude: body.data.longitude,
        ipAddress,
        method: body.data.method,
        qrCodeId: body.data.qrCodeId,
        isValid,
        validationMessage: validationMessage || undefined,
        isDuplicate,
        notes: body.data.notes,
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    await createTimeClockAuditLog(
      req.user?.id || employee.userId || undefined,
      'timeclock.created',
      'timeclock',
      timeClock.id,
      null,
      timeClock,
      { employeeId: body.data.employeeId, type: body.data.type },
      req
    );

    res.json(timeClock);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// Função auxiliar para calcular distância entre coordenadas
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

app.get('/api/timeclock/records', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { employeeId, branchId, startDate, endDate, type } = req.query;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId as string;
    if (branchId) where.branchId = branchId as string;
    if (type) where.type = type as string;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const records = await prisma.timeClock.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limitar resultados
    });
    res.json(records);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// QR CODES
// ============================================

app.post('/api/timeclock/qrcode/generate', authMiddleware(), requireRole('admin', 'superadmin'), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      employeeId: z.string().optional(),
      branchId: z.string().optional(),
      expiresInMinutes: z.number().optional().default(30),
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const crypto = require('crypto');
    const code = `QR${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (body.data.expiresInMinutes || 30) * 60 * 1000);

    const qrCode = await prisma.qRCode.create({
      data: {
        employeeId: body.data.employeeId || undefined,
        branchId: body.data.branchId || undefined,
        code,
        token,
        expiresAt,
      },
    });

    res.json(qrCode);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/qrcode/validate', authMiddleware(), async (req, res) => {
  try {
    const body = z.object({
      code: z.string(),
      token: z.string(),
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: body.data.code,
        token: body.data.token,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!qrCode) {
      return res.json({ valid: false });
    }

    res.json({ valid: true, qrCode });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/qrcode/use', authMiddleware(), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      code: z.string(),
      token: z.string(),
      employeeId: z.string(),
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: body.data.code,
        token: body.data.token,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code inválido ou expirado' });
    }

    const updated = await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: body.data.employeeId,
      },
    });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// JUSTIFICATIVAS
// ============================================

app.get('/api/timeclock/justifications', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { employeeId, status, type } = req.query;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId as string;
    if (status) where.status = status as string;
    if (type) where.type = type as string;

    const justifications = await prisma.justification.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(justifications);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/justifications', authMiddleware(), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      employeeId: z.string(),
      type: z.enum(['absence', 'delay', 'early_exit', 'adjustment', 'overtime', 'other']),
      reason: z.string().min(3),
      description: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      attachments: z.string().optional(), // JSON string
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const data: any = {
      ...body.data,
      startDate: new Date(body.data.startDate),
      requestedBy: req.user?.id,
    };
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.attachments) {
      try {
        data.attachments = JSON.parse(data.attachments);
      } catch {
        data.attachments = [];
      }
    }

    const justification = await prisma.justification.create({
      data,
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'justification.created',
      'justification',
      justification.id,
      null,
      justification,
      { employeeId: body.data.employeeId, type: body.data.type },
      req
    );

    res.json(justification);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/justifications/:id/approve', authMiddleware(), requireRole('admin', 'superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const justification = await prisma.justification.findUnique({ where: { id } });
    if (!justification) return res.status(404).json({ error: 'Justification not found' });

    const updated = await prisma.justification.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: req.user?.id,
        approvedAt: new Date(),
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'justification.approved',
      'justification',
      id,
      justification,
      updated,
      {},
      req
    );

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/justifications/:id/reject', authMiddleware(), requireRole('admin', 'superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = z.object({ reason: z.string().min(3) }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const justification = await prisma.justification.findUnique({ where: { id } });
    if (!justification) return res.status(404).json({ error: 'Justification not found' });

    const updated = await prisma.justification.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: req.user?.id,
        rejectedAt: new Date(),
        rejectionReason: body.data.reason,
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'justification.rejected',
      'justification',
      id,
      justification,
      updated,
      { reason: body.data.reason },
      req
    );

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// AJUSTES DE HORAS
// ============================================

app.get('/api/timeclock/hour-adjustments', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { employeeId, status, type } = req.query;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId as string;
    if (status) where.status = status as string;
    if (type) where.type = type as string;

    const adjustments = await prisma.hourAdjustment.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(adjustments);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/hour-adjustments', authMiddleware(), requireRole('admin', 'superadmin'), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      employeeId: z.string(),
      type: z.enum(['credit', 'debit', 'compensation']),
      hours: z.number(),
      reason: z.string().min(3),
      description: z.string().optional(),
      periodStart: z.string().optional(),
      periodEnd: z.string().optional(),
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const data: any = { ...body.data };
    if (data.periodStart) data.periodStart = new Date(data.periodStart);
    if (data.periodEnd) data.periodEnd = new Date(data.periodEnd);

    const adjustment = await prisma.hourAdjustment.create({
      data,
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'hour_adjustment.created',
      'hour_adjustment',
      adjustment.id,
      null,
      adjustment,
      { employeeId: body.data.employeeId, type: body.data.type, hours: body.data.hours },
      req
    );

    res.json(adjustment);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/hour-adjustments/:id/approve', authMiddleware(), requireRole('admin', 'superadmin'), async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const adjustment = await prisma.hourAdjustment.findUnique({ where: { id } });
    if (!adjustment) return res.status(404).json({ error: 'Adjustment not found' });

    const updated = await prisma.hourAdjustment.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: req.user?.id,
        approvedAt: new Date(),
      },
    });

    // Atualizar saldo de horas do funcionário
    const employee = await prisma.employee.findUnique({ where: { id: adjustment.employeeId } });
    if (employee) {
      let newBalance = employee.hourBalance;
      if (adjustment.type === 'credit') {
        newBalance += adjustment.hours;
      } else if (adjustment.type === 'debit') {
        newBalance -= adjustment.hours;
      }

      await prisma.employee.update({
        where: { id: adjustment.employeeId },
        data: { hourBalance: newBalance },
      });
    }

    await createTimeClockAuditLog(
      req.user?.id,
      'hour_adjustment.approved',
      'hour_adjustment',
      id,
      adjustment,
      updated,
      {},
      req
    );

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// FERIADOS
// ============================================

app.get('/api/timeclock/holidays', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { companyId } = req.query;
    const where: any = {};
    if (companyId) where.companyId = companyId as string;

    const holidays = await prisma.holiday.findMany({
      where,
      include: { company: true },
      orderBy: { date: 'asc' },
    });
    res.json(holidays);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/api/timeclock/holidays', authMiddleware(), requireRole('superadmin'), async (req: AuthedRequest, res) => {
  try {
    const body = z.object({
      companyId: z.string(),
      name: z.string().min(2),
      date: z.string(),
      type: z.enum(['national', 'state', 'municipal', 'company']).default('national'),
      state: z.string().optional(),
      city: z.string().optional(),
      isRecurring: z.boolean().optional().default(false),
      isPaid: z.boolean().optional().default(true),
    }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);

    const holiday = await prisma.holiday.create({
      data: {
        ...body.data,
        date: new Date(body.data.date),
      },
    });

    await createTimeClockAuditLog(
      req.user?.id,
      'holiday.created',
      'holiday',
      holiday.id,
      null,
      holiday,
      { name: holiday.name, companyId: holiday.companyId },
      req
    );

    res.json(holiday);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// RELATÓRIOS
// ============================================

app.get('/api/timeclock/reports', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { employeeId, branchId, departmentId, startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const where: any = {
      timestamp: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
    };
    if (employeeId) where.employeeId = employeeId as string;
    if (branchId) where.branchId = branchId as string;

    // Buscar funcionários
    const employeeWhere: any = {};
    if (departmentId) employeeWhere.departmentId = departmentId as string;
    if (branchId) employeeWhere.branchId = branchId as string;

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        timeClocks: {
          where,
          orderBy: { timestamp: 'asc' },
        },
        workSchedule: true,
      },
    });

    const reports = employees.map((employee) => {
      const records = employee.timeClocks;
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let delays = 0;
      let absences = 0;

      // Processar registros para calcular horas
      // (lógica simplificada - em produção, considerar jornada de trabalho)
      for (let i = 0; i < records.length; i += 2) {
        if (records[i] && records[i + 1]) {
          const entry = records[i];
          const exit = records[i + 1];
          if (entry.type === 'entry' && exit.type === 'exit') {
            const hours = (new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);
            totalHours += hours;
            if (hours <= (employee.workHours || 8)) {
              regularHours += hours;
            } else {
              regularHours += employee.workHours || 8;
              overtimeHours += hours - (employee.workHours || 8);
            }
          }
        }
      }

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        period: {
          start: startDate,
          end: endDate,
        },
        totalHours,
        regularHours,
        overtimeHours,
        delays,
        absences,
        records,
      };
    });

    res.json(reports);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

// ============================================
// EXPORTAÇÃO
// ============================================

app.get('/api/timeclock/export/pdf', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    // Em produção, usar biblioteca como pdfkit ou puppeteer
    // Por enquanto, retornar JSON
    const { employeeId, branchId, departmentId, startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Buscar dados diretamente do Prisma (mesma lógica do endpoint de reports)
    const where: any = {
      timestamp: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
    };
    if (employeeId) where.employeeId = employeeId as string;
    if (branchId) where.branchId = branchId as string;

    const employeeWhere: any = {};
    if (departmentId) employeeWhere.departmentId = departmentId as string;
    if (branchId) employeeWhere.branchId = branchId as string;

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        timeClocks: {
          where,
          orderBy: { timestamp: 'asc' },
        },
        workSchedule: true,
      },
    });

    const reports = employees.map((employee) => {
      const records = employee.timeClocks;
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let delays = 0;
      let absences = 0;

      for (let i = 0; i < records.length; i += 2) {
        if (records[i] && records[i + 1]) {
          const entry = records[i];
          const exit = records[i + 1];
          if (entry.type === 'entry' && exit.type === 'exit') {
            const hours = (new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);
            totalHours += hours;
            if (hours <= (employee.workHours || 8)) {
              regularHours += hours;
            } else {
              regularHours += employee.workHours || 8;
              overtimeHours += hours - (employee.workHours || 8);
            }
          }
        }
      }

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        period: { start: startDate, end: endDate },
        totalHours,
        regularHours,
        overtimeHours,
        delays,
        absences,
        records,
      };
    });

    // Por enquanto, retornar JSON (em produção, gerar PDF real)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-ponto-${Date.now()}.json"`);
    res.json(reports);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/timeclock/export/excel', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { employeeId, branchId, departmentId, startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Em produção, usar biblioteca como exceljs
    // Por enquanto, retornar CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-ponto-${Date.now()}.csv"`);
    res.send('Funcionário,Data,Entrada,Saída,Horas\n'); // Placeholder
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.get('/api/timeclock/export/csv', authMiddleware(), requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { employeeId, branchId, departmentId, startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Buscar dados diretamente do Prisma
    const where: any = {
      timestamp: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
    };
    if (employeeId) where.employeeId = employeeId as string;
    if (branchId) where.branchId = branchId as string;

    const employeeWhere: any = {};
    if (departmentId) employeeWhere.departmentId = departmentId as string;
    if (branchId) employeeWhere.branchId = branchId as string;

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        timeClocks: {
          where,
          orderBy: { timestamp: 'asc' },
        },
        workSchedule: true,
      },
    });

    const reports = employees.map((employee) => {
      const records = employee.timeClocks;
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let delays = 0;
      let absences = 0;

      for (let i = 0; i < records.length; i += 2) {
        if (records[i] && records[i + 1]) {
          const entry = records[i];
          const exit = records[i + 1];
          if (entry.type === 'entry' && exit.type === 'exit') {
            const hours = (new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);
            totalHours += hours;
            if (hours <= (employee.workHours || 8)) {
              regularHours += hours;
            } else {
              regularHours += employee.workHours || 8;
              overtimeHours += hours - (employee.workHours || 8);
            }
          }
        }
      }

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        period: { start: startDate, end: endDate },
        totalHours,
        regularHours,
        overtimeHours,
        delays,
        absences,
        records,
      };
    });

    // Gerar CSV
    let csv = 'Funcionário,Data,Entrada,Saída,Horas Trabalhadas,Horas Extras,Atrasos\n';
    for (const report of reports) {
      csv += `${report.employeeName},${report.period.start} a ${report.period.end},,,${report.totalHours},${report.overtimeHours},${report.delays}\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-ponto-${Date.now()}.csv"`);
    res.send(csv);
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


