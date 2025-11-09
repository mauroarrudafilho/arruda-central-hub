# Implementação Segura Direta - RBAC Simplificado

## 🛡️ Estratégia Alternativa (Sem Supabase CLI)

Como o Supabase CLI não está disponível, vamos implementar diretamente no banco de produção com máxima segurança.

## 📋 Estratégia em 3 Fases

### **Fase 1: Backup e Preparação** 💾
1. Fazer backup completo via Supabase Dashboard
2. Validar que o backup está correto
3. Documentar estado atual do sistema

### **Fase 2: Implementação Progressiva** 🔄
1. Executar migrações uma por uma
2. Validar após cada migração
3. Parar se algo der errado

### **Fase 3: Validação e Monitoramento** ✅
1. Testar todas as funcionalidades
2. Validar acesso de usuários
3. Monitorar por 24-48 horas

## 🚀 Execução Manual Passo a Passo

### **PASSO 1: Backup Manual (CRÍTICO)**
1. Acesse o Supabase Dashboard
2. Vá em Database → Backups
3. Crie um backup manual agora
4. Aguarde confirmação de que o backup foi criado

### **PASSO 2: Executar Migração 1 - Estrutura de Roles**
Execute no SQL Editor do Supabase:

```sql
-- Arquivo: 20250130_create_simplified_rbac_roles.sql
-- Copia o conteúdo completo do arquivo e execute
```

**Validação:**
```sql
-- Verificar se os 9 roles foram criados
SELECT COUNT(*) as total_roles FROM public.rbac_auth_role WHERE ativo = true;
-- Deve retornar: 9

-- Verificar nomes dos roles
SELECT nome FROM public.rbac_auth_role WHERE ativo = true ORDER BY nome;
-- Deve mostrar: admin, gestor, gestor_fornecedor, teste, teste_fornecedor, 
-- usuario, usuario_fornecedor, visualizador, visualizador_fornecedor
```

### **PASSO 3: Executar Migração 2 - Permissões por Tela**
Execute no SQL Editor do Supabase:

```sql
-- Arquivo: 20250130_create_screen_permissions_data.sql
-- Copia o conteúdo completo do arquivo e execute
```

**Validação:**
```sql
-- Verificar se as permissões foram criadas
SELECT COUNT(*) as total_permissoes FROM public.rbac_screen_permissions;
-- Deve retornar um número > 0

-- Verificar permissões por role
SELECT 
  ar.nome as role_name,
  COUNT(*) as total_permissoes
FROM public.rbac_screen_permissions sp
JOIN public.rbac_auth_role ar ON ar.id = sp.role_id
GROUP BY ar.nome
ORDER BY ar.nome;
```

### **PASSO 4: Executar Migração 3 - Políticas RLS**
Execute no SQL Editor do Supabase:

```sql
-- Arquivo: 20250130_update_rls_policies_for_simplified_roles.sql
-- Copia o conteúdo completo do arquivo e execute
```

**Validação:**
```sql
-- Verificar se as funções foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%user%role%'
ORDER BY routine_name;

-- Testar função principal
SELECT public.get_user_role();
```

### **PASSO 5: Executar Migração 4 - Migrar Usuários**
Execute no SQL Editor do Supabase:

```sql
-- Arquivo: 20250130_migrate_existing_users_to_new_roles.sql
-- Copia o conteúdo completo do arquivo e execute
```

**Validação:**
```sql
-- Verificar usuários migrados
SELECT 
  'Usuários migrados' as tipo,
  ar.nome as role_name,
  COUNT(*) as total_usuarios
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE aur.ativo = true
  AND ar.ativo = true
GROUP BY ar.nome
ORDER BY ar.nome;

-- Verificar acesso a tenants
SELECT 
  'Acesso a tenants' as tipo,
  COUNT(*) as total_acessos
FROM public.rbac_user_tenant_access
WHERE ativo = true;
```

## 🔍 Validações Finais

### **Teste 1: Verificar Estrutura**
```sql
-- Verificar todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'rbac_%'
ORDER BY table_name;

-- Deve mostrar:
-- rbac_auth_audit
-- rbac_auth_permission
-- rbac_auth_profile
-- rbac_auth_role
-- rbac_auth_role_permission
-- rbac_auth_user_permission
-- rbac_auth_user_role
-- rbac_organizations
-- rbac_screen_permissions
-- rbac_team_management
-- rbac_user_tenant_access
```

### **Teste 2: Verificar Dados**
```sql
-- Resumo geral
SELECT 
  'Resumo Geral' as tipo,
  (SELECT COUNT(*) FROM public.rbac_auth_role WHERE ativo = true) as total_roles,
  (SELECT COUNT(*) FROM public.rbac_organizations WHERE ativo = true) as total_organizations,
  (SELECT COUNT(*) FROM public.rbac_screen_permissions) as total_screen_permissions,
  (SELECT COUNT(*) FROM public.rbac_auth_user_role WHERE ativo = true) as total_user_roles,
  (SELECT COUNT(*) FROM public.rbac_user_tenant_access WHERE ativo = true) as total_tenant_access,
  (SELECT COUNT(*) FROM public.rbac_team_management WHERE ativo = true) as total_team_management;
```

### **Teste 3: Testar Funcionalidades**
```sql
-- Testar função get_user_role
SELECT public.get_user_role();

-- Testar função is_admin
SELECT public.is_admin();

-- Testar função is_gestor
SELECT public.is_gestor();

-- Obter permissões de tela do usuário atual
SELECT * FROM public.get_user_screen_permissions()
ORDER BY module_name, screen_name;
```

## 🚨 Plano de Rollback

### **Se Algo Der Errado:**

1. **Parar Imediatamente**: Não continue executando migrações
2. **Restaurar Backup**: Via Supabase Dashboard → Database → Backups
3. **Validar Restauração**: Verificar se os dados estão corretos
4. **Analisar Problema**: Identificar o que deu errado
5. **Corrigir e Tentar Novamente**: Após correção

### **Como Restaurar Backup:**
1. Acesse Supabase Dashboard
2. Vá em Database → Backups
3. Selecione o backup criado antes da migração
4. Clique em "Restore"
5. Aguarde confirmação

## ✅ Checklist de Implementação

### **Antes de Começar:**
- [ ] Backup manual criado no Supabase Dashboard
- [ ] Backup validado e confirmado
- [ ] Documentado estado atual do sistema
- [ ] Usuários notificados (se necessário)

### **Durante a Implementação:**
- [ ] Migração 1 executada e validada
- [ ] Migração 2 executada e validada
- [ ] Migração 3 executada e validada
- [ ] Migração 4 executada e validada

### **Após a Implementação:**
- [ ] Todos os testes passaram
- [ ] Funcionalidades validadas
- [ ] Acesso de usuários verificado
- [ ] Sistema monitorado por 24-48 horas

## 📊 Monitoramento Pós-Implementação

### **Primeiras 24 Horas:**
- Verificar logs de auditoria a cada 2 horas
- Monitorar acesso de usuários
- Validar permissões estão funcionando
- Responder rapidamente a qualquer problema

### **Primeiras 48 Horas:**
- Continuar monitoramento
- Coletar feedback de usuários
- Validar todas as funcionalidades
- Documentar problemas encontrados

## 🎯 Contato e Suporte

### **Se Precisar de Ajuda:**
- Documentação completa em `docs/`
- Scripts de teste em `scripts/`
- Logs de auditoria no banco de dados
- Backup disponível no Supabase Dashboard

## 🎉 Conclusão

Esta abordagem:
- ✅ **Segura**: Backup antes de qualquer mudança
- ✅ **Validada**: Testes após cada passo
- ✅ **Reversível**: Rollback disponível
- ✅ **Monitorada**: Acompanhamento contínuo

**Pronto para começar!** 🚀




