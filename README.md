# PloutosLedger - Sistema de Gestão Financeira

## 📋 Descrição
PloutosLedger é um sistema completo de gestão financeira desenvolvido em React + TypeScript, com interface responsiva e funcionalidades avançadas para controle de fluxo de caixa e notas fiscais. O sistema foi projetado para automatizar e otimizar processos financeiros de pequenos e médios negócios.

## ✨ Funcionalidades Principais

### 🏦 Gestão de Entradas
- **Dinheiro**: Registro de entradas em dinheiro físico
- **Fundo de Caixa**: Valor fixo de R$ 400,00 (não editável)
- **Cartão**: Registro de vendas por cartão de crédito/débito
- **Cartão Link**: Vendas por link de pagamento com informações do cliente e parcelas
- **PIX Maquininha**: Pagamentos PIX via maquininha
- **PIX Conta**: Pagamentos PIX direto na conta

### 💳 Sistema PIX Real
- **QR Codes Válidos**: Geração automática de QR codes PIX no formato EMV oficial
- **Múltiplas Chaves**: Suporte a CPF, CNPJ, email, telefone e chave aleatória
- **Validação Automática**: Verificação de chaves PIX antes da geração
- **Cobrança Real**: Sistema preparado para receber pagamentos reais
- **Download QR Code**: Possibilidade de baixar o QR code como imagem
- **Histórico de Cobranças**: Armazenamento local de todas as transações

### 🏢 Painel do Proprietário
- **Configuração da Empresa**: CNPJ, razão social, endereço completo
- **Dados de Contato**: Telefone, email, site da empresa
- **Configuração PIX**: Chave PIX, banco, agência, conta
- **Personalização Visual**: Cores primárias, secundárias, logo, favicon
- **Configurações do Sistema**: Moeda, fuso horário, formatos de data/hora
- **Validação Automática**: Verificação de dados antes do salvamento

### 👥 Gestão de Clientes
- **Aparece quando**: Há valor em "PIX Conta"
- **Campos**: Nome do cliente e valor da transação
- **Limite**: Até 3 clientes simultâneos
- **Status**: Apenas para registro (não afeta movimento)

### 📋 Caderno de Notas Fiscais
- **Data da Entrada**: Controle de quando a nota foi recebida
- **Fabricação**: Nome da empresa/fabricação
- **N° de NFE**: Número da Nota Fiscal Eletrônica
- **Vencimento**: Data de vencimento da nota
- **Total**: Valor total da nota fiscal
- **Status**: Controle de status (Ativa, Vencida, Quitada)
- **Observações**: Campo para observações adicionais
- **Relatórios**: Impressão e exportação de relatórios completos
- **Filtros**: Busca por fabricação ou número da NFE
- **Estatísticas**: Dashboard com totais e resumos

### 💸 Gestão de Saídas (Apenas para Registro)
- **Descontos**: Registro de descontos aplicados
- **Saída (Retirada)**: Registro de retiradas com justificativa
- **Crédito/Devolução**: Registro de créditos e devoluções com CPF da pessoa
- **Correios/Frete**: Registro de gastos com envios
- **Outros**: Registro de outros gastos com justificativa
- **Total de Saídas**: Soma de todos os campos para registro contábil

### 📊 Cálculo do Movimento
- **Total de Entradas**: Soma de todos os campos de entrada
- **Total de Saídas**: R$ 0,00 (nenhum campo afeta o movimento)
- **Saldo**: Entradas - Saídas (apenas entradas são consideradas)

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- Navegador moderno

### Instalação Local
```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]
cd movimento

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Configuração XAMPP

#### 1. Instalação do XAMPP
1. Baixe o XAMPP em: https://www.apachefriends.org/
2. Instale seguindo o assistente padrão
3. Inicie o painel de controle do XAMPP

#### 2. Configuração do Apache
1. No painel do XAMPP, clique em "Config" → "httpd.conf"
2. Localize a linha `DocumentRoot` e configure:
```apache
DocumentRoot "C:/xampp/htdocs/movimento"
<Directory "C:/xampp/htdocs/movimento">
    Options Indexes FollowSymLinks MultiViews
    AllowOverride All
    Require all granted
</Directory>
```

#### 3. Deploy da Aplicação
```bash
# Build da aplicação
npm run build

# Copie a pasta dist para o htdocs do XAMPP
cp -r dist/* C:/xampp/htdocs/movimento/

# Ou manualmente:
# 1. Execute npm run build
# 2. Copie todo conteúdo da pasta dist
# 3. Cole na pasta C:/xampp/htdocs/movimento/
```

#### 4. Acesso
- URL local: `http://localhost/movimento/`
- Porta padrão: 80 (Apache)

### Configuração de Servidor Web

#### Apache (Produção)
1. **Configuração do Virtual Host**:
```apache
<VirtualHost *:80>
    ServerName seu-dominio.com
    DocumentRoot /var/www/movimento
    
    <Directory /var/www/movimento>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/movimento_error.log
    CustomLog ${APACHE_LOG_DIR}/movimento_access.log combined
</VirtualHost>
```

2. **Habilitar mod_rewrite**:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

3. **Arquivo .htaccess** (criar na raiz):
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache para arquivos estáticos
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

#### Nginx (Alternativa)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/movimento;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🏗️ Estrutura do Projeto

```
ploutos-ledger/
├── src/
│   ├── components/          # Componentes React
│   │   ├── CashFlow.tsx     # Componente principal
│   │   ├── PrintReport.tsx  # Relatórios de impressão
│   │   ├── ConfirmDialog.tsx # Diálogos de confirmação
│   │   ├── Notification.tsx  # Sistema de notificações
│   │   ├── Login.tsx        # Tela de login
│   │   ├── PaymentModal.tsx # Modal de pagamento PIX
│   │   ├── PaymentPage.tsx  # Página completa de pagamento
│   │   ├── OwnerPanel.tsx   # Painel do proprietário
│   │   └── CadernoNotas.tsx # Caderno de Notas Fiscais
│   ├── services/            # Serviços
│   │   └── pixService.ts    # Serviço PIX real
│   ├── hooks/               # Hooks customizados
│   │   ├── useCashFlow.ts   # Lógica de negócio
│   │   └── useCadernoNotas.ts # Hook do Caderno de Notas
│   ├── contexts/            # Contextos React
│   │   └── AuthContext.tsx  # Autenticação
│   ├── types/               # Definições de tipos
│   │   └── index.ts         # Interfaces TypeScript
│   ├── utils/               # Utilitários
│   │   └── currency.ts      # Formatação de moeda
│   ├── config/              # Configurações
│   │   ├── app.ts          # Configurações da aplicação
│   │   ├── system.ts       # Configurações do sistema
│   │   └── performance.ts  # Configurações de performance
│   ├── App.tsx              # Componente raiz
│   └── main.tsx             # Ponto de entrada
├── public/                  # Arquivos estáticos
├── dist/                    # Build de produção
├── package.json             # Dependências
├── tailwind.config.js       # Configuração Tailwind
└── vite.config.ts           # Configuração Vite
```

## 🔧 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Estado**: React Hooks + Context API
- **Formatação**: Utilitários de moeda customizados
- **Responsividade**: Design mobile-first com Tailwind
- **PIX**: Biblioteca qrcode + validação EMV
- **HTTP**: Axios para requisições
- **UUID**: Geração de identificadores únicos

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm - lg)
- **Desktop**: > 1024px (xl)

### Adaptações
- Layout em coluna única para mobile
- Grid responsivo para formulários
- Botões com texto oculto em telas pequenas
- Espaçamentos adaptativos

## 🎯 Funcionalidades Especiais

### Campo Cartão Link
- **Campos adicionais** aparecem automaticamente
- **Nome do cliente**: Obrigatório
- **Número de parcelas**: Padrão 1x

### Justificativas
- **Saída (Retirada)**: Campo obrigatório quando há valor
- **Outros**: Campo obrigatório quando há valor
- **Validação visual**: Bordas vermelhas para campos obrigatórios

### Relatórios
- **Cupom Completo**: Todas as informações
- **Cupom Reduzido**: Informações essenciais
- **Formatação**: Otimizado para impressoras térmicas

## 🔒 Segurança

### Autenticação
- Sistema de login simples
- Contexto de autenticação
- Logout automático

### Dados
- Armazenamento local (localStorage)
- Validação de entrada
- Sanitização de dados

## 📊 Persistência de Dados

### LocalStorage
- **Chave**: `caixa_flow_data`
- **Estrutura**: JSON com entries e exits
- **Backup**: Automático a cada alteração

### Funcionalidades
- **Salvar**: Persiste alterações
- **Carregar**: Restaura dados salvos
- **Limpar**: Remove todos os dados

## 🚨 Tratamento de Erros

### Validações
- Campos obrigatórios
- Formato de moeda
- Valores numéricos

### Notificações
- **Sucesso**: Verde
- **Aviso**: Amarelo
- **Erro**: Vermelho
- **Info**: Azul

## 🧪 Testes

### Execução
```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Cobertura de código
npm run test:coverage
```

## 📦 Deploy

### Build de Produção
```bash
npm run build
```

### Arquivos Gerados
- `dist/index.html`
- `dist/assets/` (CSS, JS, imagens)
- `dist/` (todos os arquivos necessários)

### Upload
1. Execute `npm run build`
2. Copie conteúdo da pasta `dist/`
3. Cole no diretório do servidor web
4. Configure o servidor (Apache/Nginx)

## 🔄 Atualizações

### Processo
1. Faça as alterações no código
2. Teste localmente
3. Execute `npm run build`
4. Faça backup dos dados existentes
5. Substitua os arquivos no servidor
6. Teste em produção

### Backup
- Sempre faça backup do localStorage
- Mantenha versões anteriores
- Teste em ambiente de desenvolvimento

## 📞 Suporte

### Contato
- **Desenvolvedor**: Júnior Alves
- **E-mail**: junior@webytebr.com
- **Documentação**: Este README

### Problemas Comuns
1. **Campo não funciona**: Verifique se não está readonly
2. **Dados não salvam**: Verifique localStorage do navegador
3. **Impressão não funciona**: Verifique permissões do navegador

## 📝 Changelog

### v2.1.0 (Atual)
- ✅ Sistema PIX real com QR codes válidos
- ✅ Painel do proprietário para personalização
- ✅ Configuração completa da empresa
- ✅ Validação automática de chaves PIX
- ✅ Download de QR codes
- ✅ Histórico de cobranças PIX
- ✅ Interface otimizada para pagamentos

### v2.0.0
- ✅ Campo "Outros" com justificativa
- ✅ Responsividade completa
- ✅ Documentação completa
- ✅ Auditoria e correções

### v1.0.0
- ✅ Funcionalidades básicas
- ✅ Sistema de caixa
- ✅ Relatórios de impressão

## 📄 Licença

Este projeto é de uso interno e proprietário.

---

**Desenvolvido com ❤️ para controle de caixa eficiente**