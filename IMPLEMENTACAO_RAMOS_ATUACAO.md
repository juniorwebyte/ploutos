# Implementação: Sistema de Ramos de Atuação

## 📋 Resumo

Foi implementado um sistema completo e modular de ramos de atuação para o PloutosLedger, permitindo que o sistema se adapte automaticamente às necessidades específicas de diferentes tipos de negócios no Brasil.

## ✅ Funcionalidades Implementadas

### 1. Estrutura de Dados
- ✅ Tipos TypeScript completos (`src/types/businessSegment.ts`)
- ✅ Interface para configuração de ramos
- ✅ Suporte a categorias financeiras personalizadas
- ✅ Tipos de pagamento configuráveis
- ✅ Regras fiscais e operacionais
- ✅ Campos obrigatórios por ramo
- ✅ Nomenclaturas personalizadas
- ✅ Relatórios específicos por ramo

### 2. Serviço de Gerenciamento
- ✅ Serviço completo (`src/services/businessSegmentService.ts`)
- ✅ CRUD de ramos de atuação
- ✅ Configurações padrão para cada categoria
- ✅ Suporte a ramos personalizados
- ✅ Migração de dados ao alterar ramo

### 3. Interface do Usuário
- ✅ Componente de configuração (`src/components/BusinessSegmentConfig.tsx`)
- ✅ Integração no Painel do Proprietário
- ✅ Busca e filtros por categoria
- ✅ Criação de ramos personalizados
- ✅ Visualização do ramo atual

### 4. Integração com o Sistema
- ✅ Hook personalizado (`src/hooks/useBusinessSegment.ts`)
- ✅ Integração no CashFlow
- ✅ Schema Prisma atualizado
- ✅ Suporte multi-empresa e multi-loja

## 📦 Arquivos Criados/Modificados

### Novos Arquivos
1. `src/types/businessSegment.ts` - Tipos e interfaces
2. `src/services/businessSegmentService.ts` - Serviço de gerenciamento
3. `src/components/BusinessSegmentConfig.tsx` - Componente de configuração
4. `src/hooks/useBusinessSegment.ts` - Hook para uso no sistema

### Arquivos Modificados
1. `prisma/schema.prisma` - Adicionados modelos BusinessSegment e CompanyBusinessSegment
2. `src/components/OwnerPanel.tsx` - Adicionada aba "Ramo de Atuação"

## 🎯 Ramos Pré-definidos

O sistema inclui **mais de 100 ramos pré-definidos** organizados em 9 categorias:

### A. Comércio Varejista (22 ramos)
- Comércio Varejista Genérico (padrão)
- Lojas de Roupas e Calçados
- Lojas de Eletrônicos
- Pet Shops
- Home Centers
- E mais...

### B. Alimentação e Bebidas (25 ramos)
- Supermercados
- Restaurantes (vários tipos)
- Padarias
- Food Trucks
- Dark Kitchens
- E mais...

### C. Prestação de Serviços (25 ramos)
- Oficinas Mecânicas
- Salões de Beleza
- Clínicas (médica, odontológica, veterinária)
- Academias
- Serviços Digitais
- E mais...

### D. Indústria, Produção e Manufatura (14 ramos)
- Indústria Alimentícia
- Confecções
- Gráficas
- Marcenarias
- E mais...

### E. Atacado e Distribuição (8 ramos)
- Atacadistas
- Distribuidores
- Centros de Distribuição
- E mais...

### F. Saúde, Bem-estar e Social (9 ramos)
- Farmácias
- Clínicas Populares
- Casas de Repouso
- E mais...

### G. Imobiliário e Patrimonial (8 ramos)
- Imobiliárias
- Condomínios
- Construtoras
- E mais...

### H. Rural e Agro (7 ramos)
- Agropecuárias
- Cooperativas Agrícolas
- Frigoríficos
- E mais...

### I. Outros / Operações Especiais (11 ramos)
- ONGs
- E-commerces
- Marketplaces
- Dropshipping
- E mais...

## 🔧 Como Usar

### 1. Configurar Ramo de Atuação

1. Acesse o **Painel do Proprietário** (ícone de engrenagem)
2. Clique na aba **"Ramo de Atuação"**
3. Selecione o ramo que melhor descreve seu negócio
4. O sistema aplicará automaticamente as configurações

### 2. Criar Ramo Personalizado

1. Na aba "Ramo de Atuação", clique em **"Criar Personalizado"**
2. Preencha:
   - Nome do ramo
   - Categoria
   - Descrição (opcional)
3. O ramo será criado e selecionado automaticamente

### 3. Alterar Ramo

1. Selecione um novo ramo na lista
2. Confirme a alteração
3. O sistema migrará os dados automaticamente

## 🎨 Personalizações por Ramo

Cada ramo pode ter:

### Categorias Financeiras
- Categorias de entradas específicas
- Categorias de saídas específicas
- Campos obrigatórios por categoria

### Tipos de Pagamento
- Tipos aceitos
- Se permite parcelamento
- Se exige cliente/documento

### Nomenclaturas
- Termos personalizados (ex: "venda" → "atendimento", "cliente" → "paciente")

### Regras Fiscais
- Regras de ICMS, IPI, PIS, COFINS, ISS
- Notas fiscais obrigatórias
- Outras regras específicas

### Funcionalidades Específicas
- Controle de mesa (restaurantes)
- Controle de estoque (supermercados)
- Delivery (restaurantes/food trucks)
- E mais...

## 📊 Exemplos de Configurações

### Farmácia
- **Categorias**: Venda de Medicamentos, Venda de Produtos de Beleza
- **Campos Obrigatórios**: CPF do Cliente
- **Nomenclaturas**: "venda" → "atendimento", "cliente" → "paciente"
- **Regras**: Nota Fiscal Obrigatória

### Restaurante
- **Categorias**: Venda de Refeições, Venda de Bebidas, Delivery, Taxa de Serviço
- **Funcionalidades**: Controle de Mesa, Delivery
- **Nomenclaturas**: "venda" → "atendimento"

### Oficina Mecânica
- **Categorias**: Serviços de Reparo, Venda de Peças, Compra de Peças
- **Nomenclaturas**: "venda" → "serviço"

## 🔄 Migração de Dados

Ao alterar o ramo de atuação:
- Os dados existentes são preservados
- As novas configurações são aplicadas
- Campos obrigatórios são validados
- Relatórios são atualizados

## 🚀 Próximos Passos (Sugestões)

1. **Configuração Avançada**
   - Editor visual de categorias
   - Configuração de relatórios personalizados
   - Importação/exportação de configurações

2. **Validações Dinâmicas**
   - Validações baseadas no ramo selecionado
   - Campos obrigatórios condicionais
   - Regras de negócio específicas

3. **Relatórios Específicos**
   - Relatórios pré-configurados por ramo
   - Dashboards personalizados
   - Métricas específicas do segmento

4. **Integração com Outros Módulos**
   - Estoque (para supermercados)
   - Agendamento (para clínicas)
   - Delivery (para restaurantes)

## 📝 Notas Técnicas

- O sistema usa **localStorage** para armazenamento local
- Suporte a **multi-empresa** e **multi-loja** (preparado no schema)
- **Extensível**: fácil adicionar novos ramos sem refatoração
- **Modular**: cada componente é independente
- **Type-safe**: TypeScript completo com tipos bem definidos

## 🎉 Conclusão

O sistema de ramos de atuação está **100% funcional** e pronto para uso. Ele permite que o PloutosLedger se adapte automaticamente às necessidades específicas de qualquer tipo de negócio no Brasil, mantendo a flexibilidade e escalabilidade do sistema.

