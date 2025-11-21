import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Iniciando seed de usuários...');

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

    console.log('✅ Usuário Webyte criado:', webyteUser.username);

    // Criar usuário admin (superadmin)
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'superadmin',
      },
    });

    console.log('✅ Usuário admin criado:', adminUser.username);

    // Criar usuário demo
    const demoUser = await prisma.user.upsert({
      where: { username: 'demo' },
      update: {},
      create: {
        username: 'demo',
        password: await bcrypt.hash('demo123', 10),
        role: 'user',
      },
    });

    console.log('✅ Usuário demo criado:', demoUser.username);

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

    console.log('✅ Usuário caderno criado:', cadernoUser.username);

    console.log('🎉 Seed de usuários concluído com sucesso!');
    console.log('\n📋 Credenciais disponíveis:');
    console.log('┌─────────────────┬──────────────┬─────────────┐');
    console.log('│ Usuário         │ Senha        │ Tipo        │');
    console.log('├─────────────────┼──────────────┼─────────────┤');
    console.log('│ Webyte          │ Webyte       │ Cliente     │');
    console.log('│ admin           │ admin123     │ Super Admin │');
    console.log('│ demo            │ demo123      │ Demo        │');
    console.log('│ caderno         │ caderno2025  │ Caderno     │');
    console.log('└─────────────────┴──────────────┴─────────────┘');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedUsers();
}

export default seedUsers;
