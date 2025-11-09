# 🚀 Quick Start - Consolidação RBAC

## ⚡ Execução Rápida (10 minutos)

### **PASSO 1: Backup (OBRIGATÓRIO)** ⚠️
1. Abra [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Database → Backups**
3. Clique em **"Create Backup"**
4. ✅ Aguarde confirmação

---

### **PASSO 2: Executar Fase 1 (Adicionar Estruturas)**

**Copie e execute no SQL Editor do Supabase:**

1. Abra arquivo: `supabase/migrations/20250131_phase1_consolidate_rbac_add_structures.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Execute (Run)

**Validação Rápida:**
```sql
SELECT * FROM public.validate_rbac_consolidation();
```
✅ Todas devem mostrar **PASS**

---

### **PASSO 3: Executar Fase 2 (Popular Dados)**

**Copie e execute no SQL Editor do Supabase:**

1. Abra arquivo: `supabase/migrations/20250131_phase2_consolidate_rbac_populate_data.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Execute (Run)

**Validação Rápida:**
```sql
SELECT * FROM public.get_consolidation_status();
```
✅ Deve mostrar permissões e acesso configurados

---

### **PASSO 4: Executar Fase 3 (Validação)**

**Copie e execute no SQL Editor do Supabase:**

1. Abra arquivo: `supabase/migrations/20250131_phase3_consolidate_rbac_validation.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Execute (Run)

**Validação Final:**
```sql
-- Resumo completo
SELECT 
  (SELECT COUNT(*) FROM public.rbac_auth_role WHERE ativo = true) as total_roles,
  (SELECT COUNT(*) FROM public.rbac_screen_permissions) as total_permissions,
  (SELECT COUNT(*) FROM public.rbac_user_tenant_access WHERE ativo = true) as total_tenant_access;
```

✅ Deve mostrar:
- `total_roles`: ≥ 9
- `total_permissions`: ≥ 90
- `total_tenant_access`: ≥ 0 (depende de usuários existentes)

---

### **PASSO 5: Testar Funções V2**

```sql
-- Testar função de role
SELECT public.get_user_role_v2();

-- Testar função de admin
SELECT public.is_admin_v2();

-- Ver suas permissões de tela
SELECT * FROM public.get_user_screen_permissions_v2();

-- Ver tenants acessíveis
SELECT * FROM public.get_user_accessible_tenants_v2();
```

✅ Todas devem funcionar!

---

## ✅ Checklist Rápido

- [ ] ✅ Backup criado
- [ ] ✅ Fase 1 executada e validada
- [ ] ✅ Fase 2 executada e validada  
- [ ] ✅ Fase 3 executada e validada
- [ ] ✅ Funções V2 testadas
- [ ] ✅ Sistema atual ainda funciona

---

## 🎯 Próximos Passos

### **Imediato:**
1. ✅ Validar que sistema atual continua funcionando
2. ✅ Testar login de diferentes usuários
3. ✅ Verificar acesso a módulos

### **Próximos Dias:**
1. 🔄 Migrar componentes frontend para `useRBACAuth`
2. 🔄 Testar com feature flag
3. 🔄 Validar por 1-2 semanas

### **Próximas Semanas:**
1. 🎯 Quando 100% validado, unificar sistemas
2. 🎯 Remover código duplicado
3. 🎯 Documentar sistema final

---

## 🚨 Se Algo Der Errado

### **Rollback Imediato:**
1. Supabase Dashboard → Database → Backups
2. Selecione o backup de hoje
3. Clique em "Restore"
4. ✅ Sistema volta ao estado anterior

### **Não Precisa de Rollback:**
- As novas estruturas são independentes
- Sistema atual continua funcionando
- Pode simplesmente não usar as funções V2

---

## 🎉 Pronto!

Se tudo passou nas validações:
- ✅ **Sistema consolidado instalado**
- ✅ **Sistema atual funcionando**
- ✅ **Pronto para migração gradual**

**Tempo total:** ~10 minutos
**Risco:** Zero (sistema atual intacto)
**Rollback:** Disponível a qualquer momento

🚀 **Vamos consolidar o RBAC!**



