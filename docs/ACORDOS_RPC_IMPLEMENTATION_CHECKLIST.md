# ✅ Checklist de Implementação: Ajuste do Módulo de Acordos para RPC

## 📋 Status Atual

### ✅ **Completado no Hub Central**

1. **Funções RPC de Leitura (SELECT):**
   - ✅ `get_acordos_sso()` - Listar acordos
   - ✅ `get_acordo_sso()` - Buscar acordo específico

2. **Funções Auxiliares de Permissão:**
   - ✅ `get_user_data_unified()` - Buscar dados do usuário
   - ✅ `get_acordos_where_filter()` - Obter filtro WHERE
   - ✅ `can_user_view_acordo()` - Verificar permissão de visualização
   - ✅ `can_user_edit_acordo()` - Verificar permissão de edição
   - ✅ `can_user_create_acordo()` - Verificar permissão de criação
   - ✅ `can_user_delete_acordo()` - Verificar permissão de exclusão

3. **RLS Policies Migradas:**
   - ✅ `acordos_select_unified` - SELECT
   - ✅ `acordos_insert_unified` - INSERT
   - ✅ `acordos_update_unified` - UPDATE
   - ✅ `acordos_delete_unified` - DELETE

4. **Tabela de Mapeamento:**
   - ✅ `rls_rpc_mapping` - Tabela de sincronização
   - ✅ Funções de registro e validação

### ⏳ **Pendente no Hub Central**

1. **Funções RPC de Escrita (INSERT, UPDATE, DELETE):**
   - ⏳ `update_acordo_status_sso()` - Atualizar status
   - ⏳ `update_acordo_sso()` - Atualizar acordo completo
   - ⏳ `create_acordo_sso()` - Criar acordo
   - ⏳ `delete_acordo_sso()` - Excluir acordo

   **Arquivo:** `supabase/migrations/20250206000006_create_acordos_write_rpc.sql` (CRIADO, PRONTO PARA APLICAR)

### ⚠️ **Pendente no Módulo de Acordos** (Repositório Separado)

**Nota:** O módulo de acordos está em um repositório separado (`acordo-flow` ou similar). As mudanças abaixo precisam ser feitas lá.

#### 1. **Atualizar Hook `useAcordos.ts`**

**Arquivo:** `src/hooks/useAcordos.ts` (no módulo de acordos)

##### 1.1 Função `fetchAcordos` ✅ (JÁ DEVE ESTAR OK)
- [ ] Verificar se já usa `get_acordos_sso()` quando SSO
- [ ] Verificar se mantém queries diretas quando Supabase Auth

##### 1.2 Função `updateAcordoStatus` ⚠️ (PRECISA AJUSTE)
**Localização:** Linha ~411-469

**Mudanças necessárias:**
- [ ] Adicionar verificação `if (isSSO && ssoUser?.email)`
- [ ] Se SSO: usar `supabase.rpc('update_acordo_status_sso', { p_acordo_id, p_novo_status, p_user_email })`
- [ ] Se Supabase Auth: manter lógica atual (UPDATE direto)

**Exemplo:**
```typescript
if (isSSO && ssoUser?.email) {
  const { data, error } = await supabase.rpc('update_acordo_status_sso', {
    p_acordo_id: acordoId,
    p_novo_status: novoStatus,
    p_user_email: ssoUser.email
  });
  // ... tratamento de erro
} else {
  // Lógica atual com UPDATE direto
}
```

##### 1.3 Função `updateAcordo` ⚠️ (PRECISA AJUSTE)
**Localização:** Linha ~686+

**Mudanças necessárias:**
- [ ] Adicionar verificação `if (isSSO && ssoUser?.email)`
- [ ] Se SSO: converter dados para JSONB e usar `update_acordo_sso`
- [ ] Se Supabase Auth: manter lógica atual

##### 1.4 Função `deleteAcordo` ⚠️ (PRECISA AJUSTE)
**Localização:** Linha ~872+

**Mudanças necessárias:**
- [ ] Adicionar verificação `if (isSSO && ssoUser?.email)`
- [ ] Se SSO: usar `supabase.rpc('delete_acordo_sso', { p_acordo_id, p_user_email })`
- [ ] Se Supabase Auth: manter lógica atual

##### 1.5 Função `createAcordo` ⚠️ (PRECISA AJUSTE)
**Localização:** Linha ~902+

**Mudanças necessárias:**
- [ ] Adicionar verificação `if (isSSO && ssoUser?.email)` antes do INSERT
- [ ] Se SSO: converter dados para JSONB e usar `create_acordo_sso`
- [ ] Verificar sincronização de dados relacionados (compradores, etc.)
- [ ] Se Supabase Auth: manter lógica atual

#### 2. **Verificar Interceptor SSO**

**Arquivo:** `src/integrations/supabase/client.ts` (no módulo de acordos)

- [ ] Verificar se interceptor adiciona header `x-sso-token` automaticamente
- [ ] Verificar se `isSSO` e `ssoUser` estão disponíveis globalmente

#### 3. **Verificar Outros Hooks**

**Arquivos a verificar:**
- [ ] `useFinanceiro.ts` - Verificar operações de escrita
- [ ] `useAnalytics.ts` - Verificar outras operações
- [ ] `useVendedores.ts` - Verificar uso de RPC
- [ ] `useClientes.ts` - Verificar uso de RPC
- [ ] `useImportacao.ts` e `useImportacaoMelhorado.ts` - Verificar criação via importação

## 🚀 Próximos Passos

### **Passo 1: Aplicar Migration no Hub Central** ⚠️ URGENTE

```bash
# Aplicar migration das funções RPC de escrita
# Arquivo: supabase/migrations/20250206000006_create_acordos_write_rpc.sql
```

**Via MCP Supabase:**
```sql
-- Executar migration: create_acordos_write_rpc
```

**Resultado esperado:**
- ✅ `update_acordo_status_sso()` criada
- ✅ `update_acordo_sso()` criada
- ✅ `create_acordo_sso()` criada
- ✅ `delete_acordo_sso()` criada

### **Passo 2: Atualizar Módulo de Acordos** (Repositório Separado)

1. **Identificar arquivo `useAcordos.ts`**
2. **Atualizar cada função conforme checklist acima**
3. **Testar cada operação após atualização**

### **Passo 3: Testes**

#### Testes no Hub Central:
- [ ] Testar `update_acordo_status_sso()` com diferentes papéis
- [ ] Testar `update_acordo_sso()` com diferentes papéis
- [ ] Testar `create_acordo_sso()` com diferentes papéis
- [ ] Testar `delete_acordo_sso()` com diferentes papéis

#### Testes no Módulo de Acordos:
- [ ] Testar `updateAcordoStatus` com SSO
- [ ] Testar `updateAcordoStatus` com Supabase Auth
- [ ] Testar `updateAcordo` com SSO
- [ ] Testar `createAcordo` com SSO
- [ ] Testar `deleteAcordo` com SSO
- [ ] Testar permissões (vendedor só pode editar próprios acordos)
- [ ] Testar fluxo completo end-to-end

## 📊 Resumo de Status

### **Hub Central:**
- ✅ **Leitura (SELECT):** 100% completo
- ⏳ **Escrita (INSERT/UPDATE/DELETE):** 0% completo (migration criada, aguardando aplicação)

### **Módulo de Acordos:**
- ⚠️ **Status desconhecido** (repositório separado)
- ⚠️ **Necessário verificar** se já usa RPC para SELECT
- ⚠️ **Necessário atualizar** funções de escrita

## 🔍 Verificações Importantes

### **Verificar se funções RPC podem ler header:**

```sql
-- Testar se get_sso_user_from_header funciona
SELECT * FROM public.get_sso_user_from_header();
```

### **Verificar estrutura de retorno das funções RPC:**

As funções RPC de leitura já retornam a estrutura correta:
- `get_acordos_sso()` retorna lista de acordos
- `get_acordo_sso()` retorna acordo único

### **Verificar compatibilidade com Supabase Auth:**

Todas as mudanças devem manter branch para Supabase Auth:
- Se não é SSO (`!isSSO`), usar queries diretas (RLS funciona automaticamente)
- Se é SSO (`isSSO`), usar funções RPC

## 📝 Notas Importantes

1. **Não quebrar Supabase Auth:** Sempre manter branch `else` para autenticação normal
2. **Header x-sso-token:** Verificar se está sendo enviado pelo interceptor
3. **Funções auxiliares:** Usar sempre as funções de permissão criadas no Hub Central
4. **Testes incrementais:** Testar cada função após migração

## 🎯 Critérios de Sucesso

1. ✅ Todas as funções RPC de escrita criadas no Hub Central
2. ✅ Todas as operações no módulo de acordos verificam SSO
3. ✅ Operações SSO usam funções RPC correspondentes
4. ✅ Operações Supabase Auth continuam funcionando
5. ✅ Permissões por papel funcionam corretamente
6. ✅ Testes passam para todos os cenários

