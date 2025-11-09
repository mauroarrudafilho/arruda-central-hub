# Guia de Implementação - Sistema RBAC Simplificado

## 📋 Visão Geral

Este guia fornece instruções passo a passo para implementar a nova estrutura de perfis RBAC simplificada no Arruda Hub.

## 🚀 Passos de Implementação

### **Passo 1: Preparação do Ambiente**

#### 1.1 Verificar Pré-requisitos
```bash
# Verificar se o Supabase CLI está instalado
supabase --version

# Se não estiver instalado, instalar
npm install -g supabase
```

#### 1.2 Verificar Status do Projeto
```bash
# Navegar para o diretório do projeto
cd /Users/mauro/arrudahub/arruda-rbac-master

# Verificar status do Supabase
supabase status
```

### **Passo 2: Executar Migrações**

#### 2.1 Executar Script de Migrações
```bash
# Tornar o script executável (já feito)
chmod +x scripts/execute_migrations.sh

# Executar as migrações
./scripts/execute_migrations.sh
```

#### 2.2 Migrações em Ordem
As migrações serão executadas na seguinte ordem:

1. **20250130_create_simplified_rbac_roles.sql**
   - Cria nova estrutura de roles simplificada
   - Cria tabelas de vinculação de equipes
   - Cria tabelas de controle de acesso a tenants
   - Cria tabelas de permissões por tela

2. **20250130_create_screen_permissions_data.sql**
   - Insere permissões específicas por tela/módulo
   - Configura permissões para cada role
   - Define matriz de permissões completa

3. **20250130_update_rls_policies_for_simplified_roles.sql**
   - Atualiza funções de verificação de roles
   - Atualiza políticas RLS
   - Cria funções para verificação de acesso

4. **20250130_migrate_existing_users_to_new_roles.sql**
   - Migra usuários existentes para novos roles
   - Configura acesso a tenants
   - Configura equipes de gestores

### **Passo 3: Verificar Implementação**

#### 3.1 Executar Testes
```bash
# Executar script de testes
supabase db shell --file scripts/test_rbac_system.sql
```

#### 3.2 Verificar Resultados
Os testes devem retornar:
- ✅ 9 roles criados
- ✅ 2 organizações configuradas
- ✅ Permissões por tela configuradas
- ✅ Políticas RLS aplicadas
- ✅ Usuários migrados

### **Passo 4: Configuração de Usuários**

#### 4.1 Configurar Usuários Específicos
```sql
-- Exemplo: Atribuir role de gestor a um usuário
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    u.id,
    ar.id,
    auth.uid(),
    true
FROM auth.users u
JOIN public.rbac_auth_role ar ON ar.nome = 'gestor'
WHERE u.email = 'usuario@exemplo.com';
```

#### 4.2 Configurar Acesso a Tenants
```sql
-- Exemplo: Dar acesso a tenant específico
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
    u.id,
    o.id,
    'write',
    auth.uid(),
    true
FROM auth.users u
JOIN public.rbac_organizations o ON o.slug = 'grupo-arruda'
WHERE u.email = 'usuario@exemplo.com';
```

#### 4.3 Configurar Equipes
```sql
-- Exemplo: Vincular usuário a gestor
INSERT INTO public.rbac_team_management (gestor_id, usuario_id, organizacao_id, ativo)
SELECT 
    gestor.user_id,
    usuario.user_id,
    o.id,
    true
FROM public.rbac_auth_user_role gestor
JOIN public.rbac_auth_role gestor_role ON gestor_role.id = gestor.role_id
JOIN public.rbac_auth_user_role usuario
JOIN public.rbac_auth_role usuario_role ON usuario_role.id = usuario.role_id
JOIN public.rbac_organizations o ON o.slug = 'grupo-arruda'
WHERE gestor_role.nome = 'gestor'
  AND usuario_role.nome = 'usuario'
  AND gestor.ativo = true
  AND usuario.ativo = true;
```

### **Passo 5: Testar Sistema**

#### 5.1 Testar Diferentes Perfis
1. **Admin**: Deve ter acesso total
2. **Gestor**: Deve poder gerenciar equipe
3. **Usuário**: Deve ter acesso aos próprios dados
4. **Visualizador**: Deve ter apenas leitura
5. **Teste**: Deve ter acesso total exceto exclusão

#### 5.2 Testar Controle de Acesso
1. **Grupo Arruda**: Acesso configurável a tenants
2. **Fornecedores**: Acesso exclusivo ao próprio tenant
3. **Isolamento**: Dados isolados por organização

#### 5.3 Testar Permissões por Tela
1. **Gestão**: users, roles, audit, profile
2. **Acordos**: acordos, fornecedores
3. **Degustação**: degustacao, campanhas
4. **Analytics**: analytics, relatorios

## 🔧 Configurações Avançadas

### **Configurar Permissões Específicas**
```sql
-- Exemplo: Dar permissão específica a um role
UPDATE public.rbac_screen_permissions 
SET can_approve = true
WHERE role_id = (SELECT id FROM public.rbac_auth_role WHERE nome = 'usuario')
  AND screen_name = 'acordos'
  AND module_name = 'acordos';
```

### **Configurar Acesso a Múltiplos Tenants**
```sql
-- Exemplo: Dar acesso a múltiplos tenants
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
    u.id,
    o.id,
    'read',
    auth.uid(),
    true
FROM auth.users u
CROSS JOIN public.rbac_organizations o
WHERE u.email = 'usuario@exemplo.com'
  AND o.slug IN ('grupo-arruda', 'vinicola-campestre');
```

### **Configurar Equipes Complexas**
```sql
-- Exemplo: Configurar hierarquia de equipes
WITH gestor_principal AS (
  SELECT user_id FROM public.rbac_auth_user_role aur
  JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
  WHERE ar.nome = 'gestor' AND aur.ativo = true
  LIMIT 1
),
usuarios_equipe AS (
  SELECT user_id FROM public.rbac_auth_user_role aur
  JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
  WHERE ar.nome = 'usuario' AND aur.ativo = true
)
INSERT INTO public.rbac_team_management (gestor_id, usuario_id, organizacao_id, ativo)
SELECT 
  gp.user_id,
  ue.user_id,
  o.id,
  true
FROM gestor_principal gp
CROSS JOIN usuarios_equipe ue
CROSS JOIN public.rbac_organizations o
WHERE o.slug = 'grupo-arruda';
```

## 📊 Monitoramento e Manutenção

### **Verificar Status do Sistema**
```sql
-- Verificar usuários por role
SELECT 
  ar.nome as role_name,
  COUNT(*) as total_usuarios
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE aur.ativo = true
GROUP BY ar.nome
ORDER BY ar.nome;

-- Verificar acesso a tenants
SELECT 
  ap.nome as usuario_nome,
  o.nome as tenant_nome,
  uta.nivel_acesso
FROM public.rbac_user_tenant_access uta
JOIN public.rbac_auth_profile ap ON ap.user_id = uta.user_id
JOIN public.rbac_organizations o ON o.id = uta.tenant_id
WHERE uta.ativo = true
ORDER BY ap.nome, o.nome;
```

### **Logs de Auditoria**
```sql
-- Verificar logs de auditoria
SELECT 
  acao,
  tabela_afetada,
  dados_anteriores,
  dados_novos,
  created_at
FROM public.rbac_auth_audit
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🚨 Troubleshooting

### **Problemas Comuns**

#### 1. **Usuário não consegue acessar sistema**
```sql
-- Verificar se usuário tem role ativo
SELECT 
  u.email,
  ar.nome as role_name,
  aur.ativo as role_ativo
FROM auth.users u
LEFT JOIN public.rbac_auth_user_role aur ON aur.user_id = u.id
LEFT JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE u.email = 'usuario@exemplo.com';
```

#### 2. **Usuário não consegue acessar tenant**
```sql
-- Verificar acesso a tenant
SELECT 
  u.email,
  o.nome as tenant_nome,
  uta.nivel_acesso,
  uta.ativo
FROM auth.users u
LEFT JOIN public.rbac_user_tenant_access uta ON uta.user_id = u.id
LEFT JOIN public.rbac_organizations o ON o.id = uta.tenant_id
WHERE u.email = 'usuario@exemplo.com';
```

#### 3. **Permissões não funcionam**
```sql
-- Verificar permissões de tela
SELECT 
  u.email,
  sp.screen_name,
  sp.module_name,
  sp.can_view,
  sp.can_create,
  sp.can_edit,
  sp.can_delete,
  sp.can_approve
FROM auth.users u
JOIN public.rbac_auth_user_role aur ON aur.user_id = u.id
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
JOIN public.rbac_screen_permissions sp ON sp.role_id = ar.id
WHERE u.email = 'usuario@exemplo.com'
  AND sp.screen_name = 'users'
  AND sp.module_name = 'gestao';
```

## ✅ Checklist de Implementação

- [ ] **Ambiente preparado**
  - [ ] Supabase CLI instalado
  - [ ] Projeto configurado
  - [ ] Status verificado

- [ ] **Migrações executadas**
  - [ ] Estrutura de roles criada
  - [ ] Permissões por tela configuradas
  - [ ] Políticas RLS atualizadas
  - [ ] Usuários migrados

- [ ] **Sistema testado**
  - [ ] Testes executados
  - [ ] Resultados verificados
  - [ ] Funcionalidades testadas

- [ ] **Usuários configurados**
  - [ ] Roles atribuídos
  - [ ] Acesso a tenants configurado
  - [ ] Equipes configuradas

- [ ] **Sistema em produção**
  - [ ] Monitoramento configurado
  - [ ] Logs de auditoria ativos
  - [ ] Troubleshooting documentado

## 🎉 Conclusão

Após seguir todos os passos deste guia, o sistema RBAC simplificado estará completamente implementado e funcionando. O sistema oferece:

- ✅ **9 perfis simplificados** com permissões claras
- ✅ **Controle granular** de acesso por tenant
- ✅ **Permissões específicas** por tela/módulo
- ✅ **Gestão de equipes** para gestores
- ✅ **Isolamento de dados** por organização
- ✅ **Auditoria completa** de todas as operações

O sistema está pronto para uso em produção! 🚀




