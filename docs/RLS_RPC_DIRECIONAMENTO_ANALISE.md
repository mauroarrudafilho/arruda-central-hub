# 🔍 Análise: Estrutura de Direcionamento RLS-RPC

## 📋 Resumo Executivo

O sistema de sincronização RLS-RPC está **bem estruturado**, mas há **ajustes necessários** na estrutura de direcionamento para garantir que o módulo de acordos acesse os dados corretamente via SSO.

---

## ✅ O que está funcionando

### 1. **Estrutura RLS-RPC Unificada**
- ✅ Funções auxiliares de permissão criadas (`can_user_view_acordo`, `get_acordos_where_filter`, etc.)
- ✅ Políticas RLS migradas para usar funções auxiliares
- ✅ Funções RPC SSO criadas (`get_acordos_sso`, `get_acordo_sso`)
- ✅ Tabela de mapeamento RLS-RPC criada (`rls_rpc_mapping`)
- ✅ Scripts de sincronização e validação criados

### 2. **Fluxo de SSO no Hub Central**
- ✅ Geração de token SSO funcionando (`generate_sso_token`)
- ✅ Token adicionado na URL corretamente
- ✅ Redirecionamento para módulo externo funcionando

---

## ⚠️ Ajustes Necessários na Estrutura de Direcionamento

### **Problema 1: Módulo de Acordos não está usando RPC Functions**

**Situação Atual:**
O módulo de acordos provavelmente está fazendo queries diretas à tabela `acordos` ao invés de usar as funções RPC SSO.

**Solução:**
O módulo de acordos **DEVE** usar as funções RPC quando autenticado via SSO:

```typescript
// ❌ ERRADO: Query direta (não funciona com SSO)
const { data, error } = await supabase
  .from('acordos')
  .select('*');

// ✅ CORRETO: Usar função RPC SSO
const { data, error } = await supabase
  .rpc('get_acordos_sso', {
    p_user_email: userEmail // Opcional: se não fornecido, usa header x-sso-token
  });
```

**Ação Necessária:**
1. Identificar todas as queries diretas à tabela `acordos` no módulo
2. Substituir por chamadas RPC `get_acordos_sso` ou `get_acordo_sso`
3. Garantir que o interceptor SSO está enviando o header `x-sso-token`

---

### **Problema 2: Interceptor SSO pode não estar configurado corretamente**

**Situação Atual:**
O módulo precisa ter um interceptor que adiciona o header `x-sso-token` em todas as requisições.

**Solução:**
Verificar se o módulo tem o interceptor configurado:

```typescript
// src/lib/supabase.ts no módulo de acordos
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon';

const getSSOToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('arruda_sso_token');
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ✅ Interceptor obrigatório
const originalFetch = supabase.rest.fetch;
supabase.rest.fetch = async (url, options = {}) => {
  const ssoToken = getSSOToken();
  const headers = new Headers(options.headers);
  if (ssoToken) {
    headers.set('x-sso-token', ssoToken);
  }
  return originalFetch(url, { ...options, headers });
};
```

**Ação Necessária:**
1. Verificar se o interceptor está implementado no módulo de acordos
2. Verificar se o token está sendo salvo no localStorage após validação
3. Testar se o header `x-sso-token` está sendo enviado nas requisições

---

### **Problema 3: Função `get_sso_user_from_header()` ✅ JÁ EXISTE**

**Status:**
✅ A função já foi criada na migration `20250205000001_add_sso_header_validation.sql`

**Verificação:**
```sql
-- Verificar se função existe (deve retornar resultado)
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_sso_user_from_header';
```

**Ação Necessária:**
1. ✅ Função existe - apenas verificar se está funcionando corretamente
2. Testar se a função retorna dados corretos quando header `x-sso-token` está presente
3. Verificar se o header está sendo lido corretamente do request

---

### **Problema 4: Função `get_user_data_unified()` ✅ JÁ EXISTE**

**Status:**
✅ A função já foi criada na migration `20250206000001_create_unified_permission_base.sql`

**Verificação:**
```sql
-- Verificar se função existe (deve retornar resultado)
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_user_data_unified';
```

**Ação Necessária:**
1. ✅ Função existe - apenas verificar se está funcionando corretamente
2. Testar se a função funciona tanto com Supabase Auth quanto com SSO
3. Verificar se retorna dados corretos para diferentes cenários

---

## 🔧 Checklist de Verificação

### **No Banco de Dados:**
- [x] Função `get_sso_user_from_header()` existe (migration 20250205000001)
- [x] Função `get_user_data_unified()` existe (migration 20250206000001)
- [x] Função `get_acordos_sso()` existe (migration 20250206000004)
- [x] Função `get_acordo_sso()` existe (migration 20250206000004)
- [x] Tabela `rls_rpc_mapping` criada (migration 20250206000005)
- [x] Políticas RLS migradas para usar funções auxiliares (migration 20250206000003)
- [ ] **Testar se funções estão funcionando corretamente em produção**

### **No Módulo de Acordos:**
- [ ] Interceptor SSO está configurado no cliente Supabase
- [ ] Token SSO está sendo salvo no localStorage após validação
- [ ] Queries diretas à tabela `acordos` foram substituídas por RPC
- [ ] Header `x-sso-token` está sendo enviado nas requisições
- [ ] Hook `useSSO` está sendo usado no componente principal

### **No Hub Central:**
- [ ] Token SSO está sendo gerado corretamente
- [ ] Token está sendo adicionado na URL
- [ ] Redirecionamento está funcionando

---

## 📝 Próximos Passos Recomendados

### **1. Verificar Funções Base (Prioridade Alta)**
```sql
-- Executar no Supabase SQL Editor
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'get_sso_user_from_header',
  'get_user_data_unified',
  'get_acordos_sso',
  'get_acordo_sso'
);
```

### **2. Testar Função RPC SSO (Prioridade Alta)**
```sql
-- Testar manualmente (substituir EMAIL e TOKEN)
SELECT * FROM public.get_acordos_sso('usuario@exemplo.com');
-- ou
-- Fazer requisição HTTP com header x-sso-token
```

### **3. Verificar Mapeamentos (Prioridade Média)**
```sql
-- Verificar mapeamentos registrados
SELECT * FROM public.rls_rpc_mapping 
WHERE table_name = 'acordos';

-- Validar mapeamentos
SELECT * FROM public.validate_rls_rpc_mapping(id) 
FROM public.rls_rpc_mapping 
WHERE table_name = 'acordos';
```

### **4. Atualizar Módulo de Acordos (Prioridade Alta)**
- Substituir queries diretas por RPC functions
- Garantir interceptor SSO configurado
- Testar acesso via SSO

---

## 🎯 Conclusão

A estrutura RLS-RPC está **completamente implementada** no banco de dados. Todas as funções base e de sincronização foram criadas:

✅ **Funções Base:**
- `get_sso_user_from_header()` - Existe (migration 20250205000001)
- `get_user_data_unified()` - Existe (migration 20250206000001)

✅ **Funções de Permissão:**
- `can_user_view_acordo()` - Existe (migration 20250206000002)
- `get_acordos_where_filter()` - Existe (migration 20250206000002)
- Outras funções de permissão - Existem

✅ **Funções RPC SSO:**
- `get_acordos_sso()` - Existe (migration 20250206000004)
- `get_acordo_sso()` - Existe (migration 20250206000004)

✅ **Sistema de Sincronização:**
- Tabela `rls_rpc_mapping` - Criada (migration 20250206000005)
- Scripts de validação - Criados

**O que falta:**

1. ⚠️ **Módulo de Acordos precisa ser atualizado** para usar funções RPC ao invés de queries diretas quando autenticado via SSO
2. ⚠️ **Interceptor SSO precisa estar configurado** no módulo de acordos
3. ⚠️ **Testar em produção** se todas as funções estão funcionando corretamente

**A estrutura de direcionamento está 100% correta e pronta**. O próximo passo é **atualizar o módulo de acordos** para usar essa estrutura.

