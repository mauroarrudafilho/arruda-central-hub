# ✅ Checklist de Implementação RBAC Simplificado

## 🎯 Objetivo
Implementar nova estrutura de perfis RBAC de forma segura e validada.

---

## 📋 FASE 1: PREPARAÇÃO (ANTES DE COMEÇAR)

### **1.1 Backup e Documentação**
- [ ] **CRÍTICO**: Criar backup manual no Supabase Dashboard
  - Acesse: Database → Backups → Create Backup
  - Aguarde confirmação de que o backup foi criado
  - Anote o timestamp do backup: `_______________`

- [ ] Documentar estado atual do sistema
  - [ ] Número de usuários ativos: `_____`
  - [ ] Roles existentes: `_____`
  - [ ] Módulos ativos: `_____`

- [ ] Notificar usuários (se necessário)
  - [ ] Data/hora da manutenção: `_______________`
  - [ ] Tempo estimado: `_______________`
  - [ ] Canal de comunicação: `_______________`

---

## 🔧 FASE 2: IMPLEMENTAÇÃO (EXECUTAR NO SQL EDITOR)

### **2.1 Migração 1: Estrutura de Roles**
- [ ] Abrir arquivo: `supabase/migrations/20250130_create_simplified_rbac_roles.sql`
- [ ] Copiar conteúdo completo
- [ ] Colar no SQL Editor do Supabase
- [ ] Executar migração
- [ ] **VALIDAR**: Executar query de validação
```sql
SELECT COUNT(*) as total_roles FROM public.rbac_auth_role WHERE ativo = true;
```
- [ ] Resultado esperado: `9 roles`
- [ ] ✅ Validação passou? Sim [ ] Não [ ]
- [ ] Se NÃO: PARAR e fazer rollback

### **2.2 Migração 2: Permissões por Tela**
- [ ] Abrir arquivo: `supabase/migrations/20250130_create_screen_permissions_data.sql`
- [ ] Copiar conteúdo completo
- [ ] Colar no SQL Editor do Supabase
- [ ] Executar migração
- [ ] **VALIDAR**: Executar query de validação
```sql
SELECT COUNT(*) as total_permissoes FROM public.rbac_screen_permissions;
```
- [ ] Resultado esperado: `> 0 permissões`
- [ ] ✅ Validação passou? Sim [ ] Não [ ]
- [ ] Se NÃO: PARAR e fazer rollback

### **2.3 Migração 3: Políticas RLS**
- [ ] Abrir arquivo: `supabase/migrations/20250130_update_rls_policies_for_simplified_roles.sql`
- [ ] Copiar conteúdo completo
- [ ] Colar no SQL Editor do Supabase
- [ ] Executar migração
- [ ] **VALIDAR**: Executar query de validação
```sql
SELECT public.get_user_role();
```
- [ ] Resultado esperado: `Retorna um role`
- [ ] ✅ Validação passou? Sim [ ] Não [ ]
- [ ] Se NÃO: PARAR e fazer rollback

### **2.4 Migração 4: Migrar Usuários**
- [ ] Abrir arquivo: `supabase/migrations/20250130_migrate_existing_users_to_new_roles.sql`
- [ ] Copiar conteúdo completo
- [ ] Colar no SQL Editor do Supabase
- [ ] Executar migração
- [ ] **VALIDAR**: Executar query de validação
```sql
SELECT 
  ar.nome as role_name,
  COUNT(*) as total_usuarios
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE aur.ativo = true
GROUP BY ar.nome
ORDER BY ar.nome;
```
- [ ] Resultado esperado: `Usuários distribuídos pelos roles`
- [ ] ✅ Validação passou? Sim [ ] Não [ ]
- [ ] Se NÃO: PARAR e fazer rollback

---

## ✅ FASE 3: VALIDAÇÃO FINAL

### **3.1 Teste de Estrutura**
- [ ] Executar query de teste:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'rbac_%'
ORDER BY table_name;
```
- [ ] Verificar se todas as tabelas foram criadas
- [ ] Tabelas esperadas: `11 tabelas rbac_*`
- [ ] ✅ Todas as tabelas criadas? Sim [ ] Não [ ]

### **3.2 Teste de Dados**
- [ ] Executar query de resumo:
```sql
SELECT 
  'Resumo Geral' as tipo,
  (SELECT COUNT(*) FROM public.rbac_auth_role WHERE ativo = true) as total_roles,
  (SELECT COUNT(*) FROM public.rbac_organizations WHERE ativo = true) as total_organizations,
  (SELECT COUNT(*) FROM public.rbac_screen_permissions) as total_screen_permissions,
  (SELECT COUNT(*) FROM public.rbac_auth_user_role WHERE ativo = true) as total_user_roles,
  (SELECT COUNT(*) FROM public.rbac_user_tenant_access WHERE ativo = true) as total_tenant_access;
```
- [ ] Verificar se os números fazem sentido
- [ ] ✅ Dados corretos? Sim [ ] Não [ ]

### **3.3 Teste de Funcionalidades**
- [ ] Testar função `get_user_role()`:
```sql
SELECT public.get_user_role();
```
- [ ] Testar função `is_admin()`:
```sql
SELECT public.is_admin();
```
- [ ] Testar permissões de tela:
```sql
SELECT * FROM public.get_user_screen_permissions() LIMIT 5;
```
- [ ] ✅ Todas as funções funcionando? Sim [ ] Não [ ]

### **3.4 Teste de Acesso de Usuários**
- [ ] Fazer login com usuário admin
  - [ ] Consegue acessar o sistema? Sim [ ] Não [ ]
  - [ ] Consegue ver todos os módulos? Sim [ ] Não [ ]
  - [ ] Consegue gerenciar usuários? Sim [ ] Não [ ]

- [ ] Fazer login com usuário gestor
  - [ ] Consegue acessar o sistema? Sim [ ] Não [ ]
  - [ ] Consegue ver módulos permitidos? Sim [ ] Não [ ]
  - [ ] Consegue gerenciar equipe? Sim [ ] Não [ ]

- [ ] Fazer login com usuário regular
  - [ ] Consegue acessar o sistema? Sim [ ] Não [ ]
  - [ ] Consegue ver apenas próprios dados? Sim [ ] Não [ ]
  - [ ] NÃO consegue acessar dados de outros? Sim [ ] Não [ ]

---

## 📊 FASE 4: MONITORAMENTO (24-48 HORAS)

### **4.1 Primeiras 2 Horas**
- [ ] Verificar logs de auditoria
- [ ] Monitorar acesso de usuários
- [ ] Validar permissões funcionando
- [ ] Responder a problemas imediatamente

### **4.2 Primeiras 24 Horas**
- [ ] Verificar logs a cada 2 horas
- [ ] Coletar feedback de usuários
- [ ] Validar todas as funcionalidades
- [ ] Documentar problemas encontrados

### **4.3 Primeiras 48 Horas**
- [ ] Continuar monitoramento
- [ ] Validar estabilidade do sistema
- [ ] Resolver problemas identificados
- [ ] Preparar relatório final

---

## 🚨 PLANO DE ROLLBACK (SE NECESSÁRIO)

### **Quando Fazer Rollback:**
- [ ] Migração falhou e não pode ser corrigida
- [ ] Usuários não conseguem acessar o sistema
- [ ] Perda de dados detectada
- [ ] Funcionalidades críticas não funcionam

### **Como Fazer Rollback:**
1. [ ] Acessar Supabase Dashboard
2. [ ] Ir em Database → Backups
3. [ ] Selecionar backup criado antes da migração
4. [ ] Clicar em "Restore"
5. [ ] Aguardar confirmação
6. [ ] Validar que o sistema voltou ao normal
7. [ ] Notificar usuários
8. [ ] Analisar o que deu errado
9. [ ] Corrigir problema
10. [ ] Planejar nova tentativa

---

## ✅ FASE 5: CONCLUSÃO

### **5.1 Validação Final**
- [ ] Todas as migrações executadas com sucesso
- [ ] Todas as validações passaram
- [ ] Usuários conseguem acessar o sistema
- [ ] Funcionalidades estão operacionais
- [ ] Sistema está estável

### **5.2 Documentação**
- [ ] Atualizar documentação com mudanças
- [ ] Documentar problemas encontrados e soluções
- [ ] Atualizar guia de usuários (se necessário)
- [ ] Criar relatório de implementação

### **5.3 Comunicação**
- [ ] Notificar usuários que a manutenção foi concluída
- [ ] Informar sobre novas funcionalidades (se houver)
- [ ] Fornecer suporte para dúvidas
- [ ] Coletar feedback

---

## 📝 NOTAS E OBSERVAÇÕES

### **Durante a Implementação:**
```
Data/Hora de início: _______________
Data/Hora de conclusão: _______________
Tempo total: _______________
Problemas encontrados: 
_______________________________________
_______________________________________
_______________________________________

Soluções aplicadas:
_______________________________________
_______________________________________
_______________________________________
```

### **Contatos de Emergência:**
```
Administrador do Sistema: _______________
Suporte Técnico: _______________
Backup Location: Supabase Dashboard → Database → Backups
```

---

## 🎉 SUCESSO!

Quando todos os itens estiverem marcados:
- ✅ Sistema RBAC simplificado implementado com sucesso
- ✅ Todas as validações passaram
- ✅ Usuários acessando normalmente
- ✅ Sistema estável e monitorado

**Parabéns! A implementação foi concluída com sucesso!** 🚀




