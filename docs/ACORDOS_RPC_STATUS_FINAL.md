# ✅ Status Final: Ajuste do Módulo de Acordos para RPC

## 📊 Resumo Executivo

**Data:** 2025-02-06  
**Status Geral:** ✅ **Funções RPC Criadas no Hub Central**  
**Próximo Passo:** ⚠️ **Atualizar Módulo de Acordos** (repositório separado)

---

## ✅ **Completado no Hub Central**

### 1. **Funções RPC de Leitura (SELECT)** ✅

- ✅ `get_acordos_sso(p_user_email)` - Listar acordos com filtro por permissões
- ✅ `get_acordo_sso(p_acordo_id, p_user_email)` - Buscar acordo específico

**Status:** ✅ **100% Completo**

### 2. **Funções RPC de Escrita (INSERT, UPDATE, DELETE)** ✅

- ✅ `update_acordo_status_sso(p_acordo_id, p_novo_status, p_user_email)` - Atualizar status
- ✅ `update_acordo_sso(p_acordo_id, p_dados_acordo, p_user_email)` - Atualizar acordo completo
- ✅ `create_acordo_sso(p_dados_acordo, p_user_email)` - Criar novo acordo
- ✅ `delete_acordo_sso(p_acordo_id, p_user_email)` - Excluir acordo

**Status:** ✅ **100% Completo** (migration aplicada)

### 3. **Funções Auxiliares de Permissão** ✅

- ✅ `get_user_data_unified(p_user_id, p_user_email)` - Buscar dados do usuário
- ✅ `get_acordos_where_filter(p_user_id, p_user_email)` - Obter filtro WHERE
- ✅ `can_user_view_acordo(p_user_id, p_user_email, p_acordo_id)` - Verificar visualização
- ✅ `can_user_edit_acordo(p_user_id, p_user_email, p_acordo_id)` - Verificar edição
- ✅ `can_user_create_acordo(p_user_id, p_user_email)` - Verificar criação
- ✅ `can_user_delete_acordo(p_user_id, p_user_email, p_acordo_id)` - Verificar exclusão

**Status:** ✅ **100% Completo**

### 4. **RLS Policies Migradas** ✅

- ✅ `acordos_select_unified` - SELECT usando `can_user_view_acordo()`
- ✅ `acordos_insert_unified` - INSERT usando `can_user_create_acordo()`
- ✅ `acordos_update_unified` - UPDATE usando `can_user_edit_acordo()`
- ✅ `acordos_delete_unified` - DELETE usando `can_user_delete_acordo()`

**Status:** ✅ **100% Completo**

### 5. **Sistema de Sincronização** ✅

- ✅ Tabela `rls_rpc_mapping` - Mapeamento RLS ↔ RPC
- ✅ Função `register_rls_rpc_mapping()` - Registrar mapeamentos
- ✅ Função `validate_rls_rpc_mapping()` - Validar mapeamentos

**Status:** ✅ **100% Completo**

---

## ⚠️ **Pendente no Módulo de Acordos**

**Nota:** O módulo de acordos está em um repositório separado. As mudanças abaixo precisam ser feitas lá.

### **Checklist para o Módulo de Acordos**

#### ✅ **O que deve estar funcionando:**

1. **Interceptor SSO** (`src/integrations/supabase/client.ts`)
   - ✅ Deve adicionar header `x-sso-token` automaticamente
   - ✅ Deve detectar se login é via SSO (`isSSO`)

2. **`fetchAcordos`** (no hook `useAcordos.ts`)
   - ✅ Deve usar `get_acordos_sso()` quando SSO
   - ✅ Deve usar queries diretas quando Supabase Auth

#### ⚠️ **O que precisa ser ajustado:**

1. **`updateAcordoStatus`** (linha ~411-469)
   - ⚠️ Adicionar verificação SSO
   - ⚠️ Usar `update_acordo_status_sso()` quando SSO

2. **`updateAcordo`** (linha ~686+)
   - ⚠️ Adicionar verificação SSO
   - ⚠️ Usar `update_acordo_sso()` quando SSO

3. **`createAcordo`** (linha ~902+)
   - ⚠️ Adicionar verificação SSO
   - ⚠️ Usar `create_acordo_sso()` quando SSO

4. **`deleteAcordo`** (linha ~872+)
   - ⚠️ Adicionar verificação SSO
   - ⚠️ Usar `delete_acordo_sso()` quando SSO

5. **Outras operações auxiliares**
   - ⚠️ Buscar acordo específico: usar `get_acordo_sso()` quando SSO
   - ⚠️ Todas as queries diretas devem verificar SSO primeiro

---

## 📋 **Lista Completa de Funções RPC Disponíveis**

### **Leitura (SELECT)**
1. ✅ `get_acordos_sso(p_user_email)` - Listar acordos
2. ✅ `get_acordo_sso(p_acordo_id, p_user_email)` - Buscar acordo específico

### **Escrita (INSERT, UPDATE, DELETE)**
3. ✅ `create_acordo_sso(p_dados_acordo, p_user_email)` - Criar acordo
4. ✅ `update_acordo_sso(p_acordo_id, p_dados_acordo, p_user_email)` - Atualizar acordo
5. ✅ `update_acordo_status_sso(p_acordo_id, p_novo_status, p_user_email)` - Atualizar status
6. ✅ `delete_acordo_sso(p_acordo_id, p_user_email)` - Excluir acordo

### **Permissões (Auxiliares)**
7. ✅ `can_user_view_acordo(p_user_id, p_user_email, p_acordo_id)` - Verificar visualização
8. ✅ `can_user_edit_acordo(p_user_id, p_user_email, p_acordo_id)` - Verificar edição
9. ✅ `can_user_create_acordo(p_user_id, p_user_email)` - Verificar criação
10. ✅ `can_user_delete_acordo(p_user_id, p_user_email, p_acordo_id)` - Verificar exclusão
11. ✅ `get_acordos_where_filter(p_user_id, p_user_email)` - Obter filtro WHERE

---

## 🔍 **Verificações Realizadas**

### ✅ **Teste 1: Funções RPC de Leitura**
- ✅ `get_acordos_sso()` existe e funciona
- ✅ `get_acordo_sso()` existe e funciona

### ✅ **Teste 2: Funções RPC de Escrita**
- ✅ `update_acordo_status_sso()` criada e aplicada
- ✅ `update_acordo_sso()` criada e aplicada
- ✅ `create_acordo_sso()` criada e aplicada
- ✅ `delete_acordo_sso()` criada e aplicada

### ✅ **Teste 3: Funções Auxiliares**
- ✅ Todas as funções de permissão existem
- ✅ `get_user_data_unified()` funciona

### ✅ **Teste 4: RLS Policies**
- ✅ Todas as policies migradas para usar funções auxiliares
- ✅ Policies antigas foram removidas

### ✅ **Teste 5: Sistema de Sincronização**
- ✅ Tabela de mapeamento criada
- ✅ Funções de registro e validação funcionam

---

## 📝 **Padrão de Uso no Módulo de Acordos**

### **Padrão para Operações de Leitura:**

```typescript
// Buscar lista de acordos
if (isSSO && ssoUser?.email) {
  const { data, error } = await supabase.rpc('get_acordos_sso', {
    p_user_email: ssoUser.email // Opcional: se não fornecido, usa header
  });
} else {
  // Supabase Auth - RLS funciona automaticamente
  const { data, error } = await supabase
    .from('acordos')
    .select('*');
}

// Buscar acordo específico
if (isSSO && ssoUser?.email) {
  const { data, error } = await supabase.rpc('get_acordo_sso', {
    p_acordo_id: acordoId,
    p_user_email: ssoUser.email // Opcional
  });
} else {
  // Supabase Auth
  const { data, error } = await supabase
    .from('acordos')
    .select('*')
    .eq('id', acordoId)
    .single();
}
```

### **Padrão para Operações de Escrita:**

```typescript
// Criar acordo
if (isSSO && ssoUser?.email) {
  const dadosJsonb = {
    cliente_id: dadosAcordo.cliente_id,
    vendedor_id: userAcordos.id,
    tipo: dadosAcordo.tipo,
    valor: dadosAcordo.valor,
    // ... outros campos
  };
  
  const { data: acordoId, error } = await supabase.rpc('create_acordo_sso', {
    p_dados_acordo: dadosJsonb,
    p_user_email: ssoUser.email // Opcional
  });
} else {
  // Supabase Auth
  const { data, error } = await supabase
    .from('acordos')
    .insert(dadosAcordo)
    .select('id')
    .single();
}

// Atualizar status
if (isSSO && ssoUser?.email) {
  const { data, error } = await supabase.rpc('update_acordo_status_sso', {
    p_acordo_id: acordoId,
    p_novo_status: novoStatus,
    p_user_email: ssoUser.email // Opcional
  });
} else {
  // Supabase Auth
  const { error } = await supabase
    .from('acordos')
    .update({ status: novoStatus })
    .eq('id', acordoId);
}

// Atualizar acordo completo
if (isSSO && ssoUser?.email) {
  const dadosJsonb = {
    cliente_id: dadosAcordo.cliente_id,
    // ... outros campos a atualizar
  };
  
  const { data, error } = await supabase.rpc('update_acordo_sso', {
    p_acordo_id: acordoId,
    p_dados_acordo: dadosJsonb,
    p_user_email: ssoUser.email // Opcional
  });
} else {
  // Supabase Auth
  const { error } = await supabase
    .from('acordos')
    .update(dadosAcordo)
    .eq('id', acordoId);
}

// Excluir acordo
if (isSSO && ssoUser?.email) {
  const { data, error } = await supabase.rpc('delete_acordo_sso', {
    p_acordo_id: acordoId,
    p_user_email: ssoUser.email // Opcional
  });
} else {
  // Supabase Auth
  const { error } = await supabase
    .from('acordos')
    .delete()
    .eq('id', acordoId);
}
```

---

## 🎯 **Próximos Passos**

### **No Hub Central:**
- ✅ **CONCLUÍDO:** Todas as funções RPC criadas e aplicadas

### **No Módulo de Acordos:**
1. ⚠️ Verificar se interceptor SSO está funcionando
2. ⚠️ Atualizar `useAcordos.ts` para usar funções RPC quando SSO
3. ⚠️ Testar cada operação (SELECT, INSERT, UPDATE, DELETE)
4. ⚠️ Testar permissões por papel
5. ⚠️ Validar que Supabase Auth ainda funciona

### **Documentação:**
- ✅ Checklist criado: `docs/ACORDOS_RPC_IMPLEMENTATION_CHECKLIST.md`
- ✅ Este documento de status final

---

## ✅ **Conclusão**

**No Hub Central:** ✅ **100% Completo**  
- Todas as funções RPC criadas
- Sistema de permissões unificado funcionando
- RLS policies migradas
- Sistema de sincronização criado

**No Módulo de Acordos:** ⚠️ **Pendente** (repositório separado)  
- Arquivo `useAcordos.ts` precisa ser atualizado
- Outros hooks precisam ser verificados

**Sistema está pronto para testes reais!** 🚀

