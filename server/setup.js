const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando Prisma...');

try {
  // Verificar se o schema existe
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Arquivo schema.prisma não encontrado em:', schemaPath);
    process.exit(1);
  }

  console.log('✅ Schema encontrado:', schemaPath);

  // Gerar cliente Prisma
  console.log('📦 Gerando cliente Prisma...');
  execSync('npx prisma generate --schema=../prisma/schema.prisma', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('✅ Cliente Prisma gerado com sucesso!');

  // Executar migrações se necessário
  console.log('🗄️ Executando migrações...');
  execSync('npx prisma db push --schema=../prisma/schema.prisma', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('✅ Banco de dados configurado!');

} catch (error) {
  console.error('❌ Erro na configuração:', error.message);
  process.exit(1);
}
