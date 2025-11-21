const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Simple login endpoint for testing (offline mode)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Credenciais válidas para teste offline
    const validCredentials = {
      'Webyte': { password: 'Webyte', role: 'user' },
      'admin': { password: 'admin123', role: 'superadmin' },
      'demo': { password: 'demo123', role: 'user' },
      'caderno': { password: 'caderno2025', role: 'user' }
    };

    const userCreds = validCredentials[username];
    
    if (userCreds && userCreds.password === password) {
      // Simular token JWT
      const token = Buffer.from(JSON.stringify({ 
        username, 
        role: userCreds.role, 
        timestamp: Date.now() 
      })).toString('base64');
      
      console.log(`Login successful for user: ${username}`);
      res.json({ token, role: userCreds.role, username });
    } else {
      console.log(`Invalid credentials for user: ${username}`);
      res.status(401).json({ error: 'invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Seed users endpoint
app.post('/api/seed/users', async (_req, res) => {
  try {
    console.log('Users already configured for offline mode');
    res.json({ 
      message: 'Usuários configurados para modo offline',
      users: [
        { username: 'Webyte', role: 'user' },
        { username: 'admin', role: 'superadmin' },
        { username: 'demo', role: 'user' },
        { username: 'caderno', role: 'user' },
      ]
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to create users', details: error.message });
  }
});

// List users endpoint
app.get('/api/users', async (_req, res) => {
  try {
    res.json([
      { username: 'Webyte', role: 'user', id: '1' },
      { username: 'admin', role: 'superadmin', id: '2' },
      { username: 'demo', role: 'user', id: '3' },
      { username: 'caderno', role: 'user', id: '4' },
    ]);
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
  console.log(`\n📋 Credenciais disponíveis:`);
  console.log(`┌─────────────────┬──────────────┬─────────────┐`);
  console.log(`│ Usuário         │ Senha        │ Tipo        │`);
  console.log(`├─────────────────┼──────────────┼─────────────┤`);
  console.log(`│ Webyte          │ Webyte       │ Cliente     │`);
  console.log(`│ admin           │ admin123     │ Super Admin │`);
  console.log(`│ demo            │ demo123      │ Demo        │`);
  console.log(`│ caderno         │ caderno2025  │ Caderno     │`);
  console.log(`└─────────────────┴──────────────┴─────────────┘`);
});