import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

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
      const payload = jwt.verify(token, JWT_SECRET) as any;
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

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Simple login endpoint for testing
app.post('/api/auth/login', async (req, res) => {
  try {
    const body = z.object({ username: z.string(), password: z.string() }).safeParse(req.body);
    if (!body.success) return res.status(400).json(body.error);
    
    const { username, password } = body.data;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    // Check password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    
    console.log(`Login successful for user: ${username}`);
    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Seed users endpoint
app.post('/api/seed/users', async (_req, res) => {
  try {
    console.log('Creating users...');
    
    // Create Webyte user
    const webyteUser = await prisma.user.upsert({
      where: { username: 'Webyte' },
      update: {},
      create: {
        username: 'Webyte',
        password: await bcrypt.hash('Webyte', 10),
        role: 'user',
      },
    });

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'superadmin',
      },
    });

    // Create demo user
    const demoUser = await prisma.user.upsert({
      where: { username: 'demo' },
      update: {},
      create: {
        username: 'demo',
        password: await bcrypt.hash('demo123', 10),
        role: 'user',
      },
    });

    // Create caderno user
    const cadernoUser = await prisma.user.upsert({
      where: { username: 'caderno' },
      update: {},
      create: {
        username: 'caderno',
        password: await bcrypt.hash('caderno2025', 10),
        role: 'user',
      },
    });

    console.log('Users created successfully');
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
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to create users', details: error.message });
  }
});

// List users endpoint for debugging
app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users.map(u => ({ username: u.username, role: u.role, id: u.id })));
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users', details: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`🌱 Seed endpoint: http://localhost:${PORT}/api/seed/users`);
  console.log(`👥 Users endpoint: http://localhost:${PORT}/api/users`);
});
