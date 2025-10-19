# Sistema de Registro de Políticas RLS - Arruda Hub

## 📋 Visão Geral

O Sistema de Registro de Políticas RLS permite registrar, gerenciar e controlar todas as políticas de Row Level Security (RLS) por roles de cada projeto de forma centralizada e organizada.

## 🎯 Objetivos

- ✅ **Registro centralizado** de todas as políticas RLS
- ✅ **Controle por roles** específicos de cada projeto
- ✅ **Auditoria completa** de mudanças nas políticas
- ✅ **Aplicação automática** de políticas RLS
- ✅ **Histórico detalhado** de todas as operações
- ✅ **Gestão granular** por organização, projeto e módulo
- ✅ **Priorização** de políticas para resolução de conflitos

## 🏗️ Estrutura de Dados

### **Tabela `rbac_rls_policies`**
```sql
CREATE TABLE public.rbac_rls_policies (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,                    -- Nome da política
  tabela TEXT NOT NULL,                  -- Tabela que a política se aplica
  operacao TEXT NOT NULL,               -- SELECT, INSERT, UPDATE, DELETE, ALL
  condicao_using TEXT,                  -- Condição USING da política
  condicao_with_check TEXT,             -- Condição WITH CHECK da política
  projeto_id UUID,                       -- Projeto específico (null = global)
  modulo_id UUID,                        -- Módulo específico (null = global)
  organizacao_id UUID,                   -- Organização específica (null = global)
  role_id UUID,                          -- Role específico (null = aplica a todos)
  prioridade INTEGER DEFAULT 0,         -- Prioridade (maior = mais específica)
  ativo BOOLEAN DEFAULT true,           -- Política ativa
  descricao TEXT,                        -- Descrição da política
  tags TEXT[],                          -- Tags para categorização
  configuracoes JSONB DEFAULT '{}',     -- Configurações específicas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
```

### **Tabela `rbac_rls_policy_history`**
```sql
CREATE TABLE public.rbac_rls_policy_history (
  id UUID PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES rbac_rls_policies(id),
  acao TEXT NOT NULL,                    -- created, updated, activated, deactivated, deleted
  dados_anteriores JSONB,               -- Estado anterior da política
  dados_novos JSONB,                    -- Novo estado da política
  motivo TEXT,                          -- Motivo da mudança
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

### **Tabela `rbac_rls_policy_applications`**
```sql
CREATE TABLE public.rbac_rls_policy_applications (
  id UUID PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES rbac_rls_policies(id),
  tabela TEXT NOT NULL,                 -- Tabela onde foi aplicada
  status TEXT NOT NULL DEFAULT 'pending', -- pending, applied, failed, rolled_back
  erro TEXT,                            -- Erro se falhou
  aplicado_em TIMESTAMP WITH TIME ZONE,
  aplicado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 🔧 Funcionalidades Principais

### **1. Registro de Políticas**

#### **Políticas por Role:**
```typescript
// Política específica para role 'gestor_fornecedor'
await createPolicy({
  nome: 'Gestores podem ver todos os acordos',
  tabela: 'acordos',
  operacao: 'SELECT',
  condicao_using: 'is_admin() OR get_user_role() = ''gestor_fornecedor''',
  role_id: 'role-gestor-fornecedor-id',
  prioridade: 100,
  descricao: 'Gestores de fornecedor têm acesso total aos acordos',
  tags: ['acordos', 'gestor', 'fornecedor']
});
```

#### **Políticas por Projeto:**
```typescript
// Política específica para projeto 'acordos-comerciais'
await createPolicy({
  nome: 'Usuários do projeto Acordos podem criar acordos',
  tabela: 'acordos',
  operacao: 'INSERT',
  condicao_with_check: 'EXISTS (SELECT 1 FROM rbac_user_project_access WHERE project_id = ''projeto-acordos-id'' AND user_id = auth.uid())',
  projeto_id: 'projeto-acordos-id',
  prioridade: 80,
  tags: ['acordos', 'projeto', 'insert']
});
```

#### **Políticas por Organização:**
```typescript
// Política específica para organização 'Grupo Arruda'
await createPolicy({
  nome: 'Usuários do Grupo Arruda podem ver acordos da organização',
  tabela: 'acordos',
  operacao: 'SELECT',
  condicao_using: 'EXISTS (SELECT 1 FROM rbac_auth_profile ap JOIN rbac_organizations o ON o.id = ap.organizacao_id WHERE ap.user_id = auth.uid() AND o.slug = ''grupo-arruda'')',
  organizacao_id: 'grupo-arruda-id',
  prioridade: 90,
  tags: ['acordos', 'organizacao', 'grupo-arruda']
});
```

### **2. Aplicação de Políticas**

#### **Aplicar Política:**
```typescript
const { applyPolicy } = useRLSPolicies();

// Aplicar política específica
await applyPolicy('policy-id');
```

#### **Remover Política:**
```typescript
const { removePolicy } = useRLSPolicies();

// Remover política específica
await removePolicy('policy-id');
```

### **3. Consulta de Políticas**

#### **Buscar Políticas Aplicáveis:**
```typescript
const { fetchApplicablePolicies } = useRLSPolicies();

// Buscar políticas aplicáveis para tabela 'acordos'
const policies = await fetchApplicablePolicies(
  'acordos',
  'organizacao-id',
  'projeto-id'
);
```

#### **Filtrar Políticas:**
```typescript
const { filterPolicies } = useRLSPolicies();

// Filtrar políticas por critérios
const filteredPolicies = filterPolicies({
  tabela: 'acordos',
  operacao: 'SELECT',
  ativo: true,
  tags: ['gestor']
});
```

### **4. Auditoria e Histórico**

#### **Histórico de Política:**
```typescript
const { fetchPolicyHistory } = useRLSPolicies();

// Buscar histórico de uma política
const history = await fetchPolicyHistory('policy-id');
```

#### **Aplicações de Política:**
```typescript
const { fetchPolicyApplications } = useRLSPolicies();

// Buscar aplicações de uma política
const applications = await fetchPolicyApplications('policy-id');
```

## 📊 Hierarquia de Prioridades

### **1. Políticas Globais (Prioridade 0-50)**
- Aplicam-se a todos os usuários
- Exemplo: "Admins podem fazer tudo"

### **2. Políticas por Organização (Prioridade 51-70)**
- Aplicam-se a usuários de uma organização específica
- Exemplo: "Usuários do Grupo Arruda podem ver acordos da organização"

### **3. Políticas por Projeto (Prioridade 71-85)**
- Aplicam-se a usuários de um projeto específico
- Exemplo: "Usuários do projeto Acordos podem criar acordos"

### **4. Políticas por Módulo (Prioridade 86-95)**
- Aplicam-se a usuários de um módulo específico
- Exemplo: "Usuários do módulo Trade Marketing podem ver campanhas"

### **5. Políticas por Role (Prioridade 96-100)**
- Aplicam-se a usuários com role específico
- Exemplo: "Gestores de fornecedor podem aprovar acordos"

## 🎯 Casos de Uso Práticos

### **1. Controle de Acesso por Role**

```typescript
// Política para vendedores só verem seus próprios acordos
await createPolicy({
  nome: 'Vendedores veem apenas seus acordos',
  tabela: 'acordos',
  operacao: 'SELECT',
  condicao_using: 'get_user_role() = ''vendedor'' AND criado_por = auth.uid()',
  role_id: 'role-vendedor-id',
  prioridade: 95,
  tags: ['acordos', 'vendedor', 'own-data']
});
```

### **2. Controle por Organização**

```typescript
// Política para isolamento entre organizações
await createPolicy({
  nome: 'Isolamento por organização',
  tabela: 'acordos',
  operacao: 'ALL',
  condicao_using: 'EXISTS (SELECT 1 FROM rbac_auth_profile ap WHERE ap.user_id = auth.uid() AND ap.organizacao_id = acordos.organizacao_id)',
  organizacao_id: 'grupo-arruda-id',
  prioridade: 80,
  tags: ['acordos', 'organizacao', 'isolation']
});
```

### **3. Controle por Projeto**

```typescript
// Política para usuários de projeto específico
await createPolicy({
  nome: 'Usuários do projeto Trade Marketing',
  tabela: 'campanhas',
  operacao: 'ALL',
  condicao_using: 'EXISTS (SELECT 1 FROM rbac_user_project_access upa WHERE upa.user_id = auth.uid() AND upa.project_id = ''projeto-trade-marketing-id'')',
  projeto_id: 'projeto-trade-marketing-id',
  prioridade: 85,
  tags: ['campanhas', 'projeto', 'trade-marketing']
});
```

## 🔍 Monitoramento e Estatísticas

### **Estatísticas de Políticas:**
```typescript
const { fetchPolicyStats } = useRLSPolicies();

const stats = await fetchPolicyStats();
console.log(stats);
// {
//   total_policies: 25,
//   active_policies: 23,
//   applied_policies: 20,
//   failed_policies: 3,
//   by_operation: { 'SELECT': 15, 'INSERT': 5, 'UPDATE': 3, 'DELETE': 2 },
//   by_table: { 'acordos': 10, 'campanhas': 8, 'usuarios': 7 }
// }
```

### **Relatórios Disponíveis:**
- Políticas por tabela
- Políticas por operação
- Políticas por role
- Políticas por projeto
- Histórico de mudanças
- Taxa de sucesso de aplicação

## 🚀 Benefícios

- ✅ **Controle centralizado** de todas as políticas RLS
- ✅ **Gestão granular** por role, projeto e organização
- ✅ **Auditoria completa** de todas as mudanças
- ✅ **Aplicação automática** de políticas
- ✅ **Resolução de conflitos** por prioridade
- ✅ **Histórico detalhado** de operações
- ✅ **Monitoramento** de aplicação de políticas
- ✅ **Escalabilidade** para novos projetos e módulos

## 📋 Próximos Passos

1. **Aplicar migração** em ambiente de desenvolvimento
2. **Testar sistema** de políticas RLS
3. **Migrar políticas existentes** para o novo sistema
4. **Criar interface** de gerenciamento de políticas
5. **Implementar monitoramento** de aplicação
6. **Treinar equipe** no novo sistema
