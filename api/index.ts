// Vercel Serverless Function - API Backend
// Este arquivo adapta o servidor Express para funcionar como serverless function no Vercel
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Importar o servidor Express configurado
// Nota: Vamos adaptar o server/index.ts para funcionar aqui também

const app = express();

// Middleware básico
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), platform: 'vercel' });
});

// Exportar como handler do Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Converter Vercel request/response para Express
  return app(req as any, res as any);
}

// Nota: Para usar o servidor completo no Vercel, você precisaria adaptar todas as rotas
// do server/index.ts para este formato serverless. Alternativamente, você pode:
// 1. Deploy do backend separadamente em um VPS ou Railway/Render
// 2. Usar Vercel serverless functions para cada rota específica
// 3. Usar a abordagem acima para as rotas mais críticas

