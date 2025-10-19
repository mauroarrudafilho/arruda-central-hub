# Sistema de Módulos - Arruda Hub

## 📋 Visão Geral

O sistema de módulos permite registrar, gerenciar e controlar acesso a todas as telas/módulos implementados no Arruda Hub.

## 🏗️ Estrutura de Dados

### **Tabela `modules`**
```sql
CREATE TABLE public.rbac_modules (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,                    -- Nome do módulo
  slug TEXT NOT NULL UNIQUE,             -- Slug único (ex: 'gestao-usuarios')
  descricao TEXT,                        -- Descrição do módulo
  icone TEXT,                           -- Nome do ícone (ex: 'Users', 'Building2')
  rota TEXT,                            -- Rota interna (ex: '/users')
  url_externa TEXT,                     -- URL externa para micro-frontends
  status TEXT NOT NULL DEFAULT 'planejado', -- Status do módulo
  organizacao_id UUID,                  -- Módulo específico de uma organização
  categoria TEXT NOT NULL DEFAULT 'negocio', -- Categoria do módulo
  ordem INTEGER NOT NULL DEFAULT 0,     -- Ordem de exibição
  ativo BOOLEAN NOT NULL DEFAULT true,  -- Módulo ativo
  versao TEXT DEFAULT '1.0.0',          -- Versão do módulo
  desenvolvedor TEXT,                   -- Responsável pelo desenvolvimento
  data_lancamento TIMESTAMP WITH TIME ZONE,
  data_atualizacao TIMESTAMP WITH TIME ZONE,
  configuracoes JSONB DEFAULT '{}'::jsonb, -- Configurações específicas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Tabela `user_module_access`**
```sql
CREATE TABLE public.rbac_user_module_access (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  module_id UUID NOT NULL REFERENCES public.rbac_modules(id),
  nivel_acesso TEXT NOT NULL DEFAULT 'visualizador',
  concedido_por UUID REFERENCES auth.users(id),
  data_concessao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_id)
);
```

### **Tabela `module_stats`**
```sql
CREATE TABLE public.rbac_module_stats (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.rbac_modules(id),
  data DATE NOT NULL,
  acessos INTEGER NOT NULL DEFAULT 0,
  usuarios_unicos INTEGER NOT NULL DEFAULT 0,
  tempo_medio_sessao INTEGER, -- em segundos
  erros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(module_id, data)
);
```

## 📊 Módulos Registrados

### **✅ Módulos Disponíveis**
- **Gestão de Usuários** (`gestao-usuarios`) - Controle de usuários e permissões
- **Trade Marketing** (`trade-marketing`) - Campanhas e promoções comerciais
- **Acordos Comerciais** (`acordos-comerciais`) - Gestão de acordos e contratos
- **Meus Documentos** (`meus-documentos`) - Ingestão e parse de documentos

### **🚧 Módulos em Desenvolvimento**
- **Comercial+** (`comercial-plus`) - Gestão comercial avançada
- **Financeiro** (`financeiro`) - Controle financeiro e contabilidade
- **Always On** (`always-on`) - Monitoramento 24/7 do sistema
- **Logística** (`logistica`) - Controle logístico e distribuição
- **Reembolsos** (`reembolsos`) - Controle de reembolsos e devoluções

### **📋 Módulos Planejados**
- **Gestor de Comissão** (`gestor-comissao`) - Cálculo e repasse de comissões
- **Gestor de Pricing** (`gestor-pricing`) - Histórico de preços e promoções
- **Analytics** (`analytics`) - Relatórios e insights
- **Flex Tracker** (`flex-tracker`) - Monitoramento de savings
- **LMS** (`lms`) - Treinamentos e certificações
- **Meus Produtos** (`meus-produtos`) - Repositório de produtos
- **Cliente 360º** (`cliente-360`) - Visão unificada do cliente

## 🔐 Controle de Acesso

### **Níveis de Acesso**
- **admin**: Acesso total ao módulo
- **gestor**: Acesso gerencial com restrições
- **visualizador**: Apenas leitura

### **Políticas RLS**
```sql
-- Usuários só veem módulos que têm acesso
SELECT * FROM rbac_modules 
WHERE id IN (
  SELECT module_id FROM rbac_user_module_access 
  WHERE user_id = auth.uid() AND ativo = true
) OR status = 'disponivel';
```

## 🎯 Casos de Uso

### **1. Registrar Acesso a Módulo**
```typescript
const { grantModuleAccess } = useModules();

await grantModuleAccess(
  userId, 
  moduleId, 
  'gestor' // nível de acesso
);
```

### **2. Verificar Acesso do Usuário**
```typescript
const { checkModuleAccess } = useModules();

const hasAccess = await checkModuleAccess('gestao-usuarios');
```

### **3. Registrar Uso do Módulo**
```typescript
const { recordModuleAccess } = useModules();

await recordModuleAccess('trade-marketing');
```

### **4. Buscar Módulos do Usuário**
```typescript
const { userModules } = useModules();

// Módulos acessíveis pelo usuário atual
console.log(userModules);
```

## 📈 Estatísticas e Monitoramento

### **Métricas Coletadas**
- **Acessos diários** por módulo
- **Usuários únicos** por módulo
- **Tempo médio de sessão**
- **Taxa de erro** por módulo

### **Relatórios Disponíveis**
- Uso por módulo
- Tendências de acesso
- Performance por módulo
- Usuários mais ativos

## 🔧 Funções Auxiliares

### **Obter Módulos do Usuário**
```sql
SELECT * FROM public.get_user_modules(auth.uid());
```

### **Verificar Acesso a Módulo**
```sql
SELECT public.user_has_module_access(auth.uid(), 'gestao-usuarios');
```

### **Registrar Acesso**
```sql
SELECT public.record_module_access('trade-marketing');
```

## 🚀 Benefícios

- ✅ **Controle centralizado** de todos os módulos
- ✅ **Gestão de acesso granular** por usuário
- ✅ **Estatísticas de uso** automáticas
- ✅ **Organização por categoria** e status
- ✅ **Integração com organizações**
- ✅ **Auditoria completa** de acessos
- ✅ **Escalabilidade** para novos módulos

## 📋 Próximos Passos

1. **Aplicar migração** em ambiente de desenvolvimento
2. **Testar controle de acesso** entre módulos
3. **Implementar dashboard** de estatísticas
4. **Integrar com sistema de permissões** existente
5. **Criar interface** de gerenciamento de módulos
