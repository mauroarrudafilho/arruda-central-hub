# 🚀 Guia de Implementação - RBAC Multi-Frontend

## Resumo da Solução

Esta solução resolve o problema de **rastreabilidade e controle de acesso** entre múltiplos frontends do Arruda Hub, criando:

1. **Sistema de sessões compartilhadas** entre frontends
2. **Biblioteca NPM reutilizável** (@arruda/rbac-client)
3. **Rastreamento completo** de acessos e ações
4. **Dashboard de monitoramento** em tempo real

---

## 📋 Passo 1: Aplicar Migration no Supabase

### 1.1. Executar a Migration

```bash
# No diretório do projeto RBAC
cd /Users/mauro/arrudahub/arruda-rbac-master

# Aplicar a migration
supabase db push
```

### 1.2. Verificar se foi aplicada corretamente

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_sessions', 'resource_access_log', 'frontend_modules');

-- Verificar se as funções foram criadas
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_frontend_session', 'validate_frontend_session');
```

---

## 📦 Passo 2: Publicar a Biblioteca Compartilhada

### 2.1. Build da biblioteca

```bash
cd shared-lib
npm install
npm run build
```

### 2.2. Publicar no NPM (ou usar localmente)

**Opção A: Publicar no NPM**
```bash
npm login
npm publish --access public
```

**Opção B: Usar localmente (para testes)**
```bash
# Criar link local
npm link

# Nos projetos de frontend
npm link @arruda/rbac-client
```

---

## 🔧 Passo 3: Integrar nos Frontends Existentes

### 3.1. Instalar a biblioteca

```bash
# Em cada frontend (acordos, trade-marketing)
npm install @arruda/rbac-client
```

### 3.2. Configurar no frontend de Acordos

```typescript
// src/main.tsx ou App.tsx
import { ArrudaAuthProvider } from '@arruda/rbac-client';

const authConfig = {
  supabaseUrl: 'https://kgzybpelluftexrewyke.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI',
  projectId: 'uuid-do-projeto-gestao', // Buscar com: SELECT id FROM projects WHERE slug = 'gestao'
  moduleName: 'acordos', // Para acordo-flow.lovable.app
  frontendOrigin: 'https://acordo-flow.lovable.app',
  enableLogging: true,
};

function App() {
  return (
    <ArrudaAuthProvider config={authConfig}>
      {/* Seu app existente */}
    </ArrudaAuthProvider>
  );
}
```

### 3.3. Proteger rotas

```typescript
import { ProtectedRoute, PermissionGate } from '@arruda/rbac-client';

// Proteger uma página inteira
<ProtectedRoute 
  requiredPermission={{ module: 'acordos', action: 'access' }}
  redirectTo="https://arruda-rbac-master.lovable.app/auth"
>
  <AcordosPage />
</ProtectedRoute>

// Proteger um componente específico
<PermissionGate module="acordos" action="create">
  <CreateButton />
</PermissionGate>
```

### 3.4. Adicionar logging

```typescript
import { useArrudaAuth } from '@arruda/rbac-client';

function AcordosList() {
  const { logResourceAccess } = useArrudaAuth();

  const handleCreateAcordo = async () => {
    const startTime = Date.now();
    
    try {
      // Sua lógica aqui
      await createAcordo(data);
      
      // Log de sucesso
      await logResourceAccess(
        'action',
        '/acordos/create',
        'create',
        true,
        Date.now() - startTime
      );
      
    } catch (error) {
      // Log de erro
      await logResourceAccess(
        'action',
        '/acordos/create',
        'create',
        false,
        Date.now() - startTime,
        error.message
      );
    }
  };
}
```

---

## 🎯 Passo 4: Configurar o Sistema RBAC Principal

### 4.1. Adicionar página de sessões

```typescript
// src/App.tsx - adicionar rota
<Route path="/sessions" element={
  <AuthGuard requireAdmin>
    <Layout>
      <Sessions />
    </Layout>
  </AuthGuard>
} />
```

### 4.2. Atualizar módulos do projeto

```sql
-- Inserir na tabela project_modules
INSERT INTO project_modules (project_id, nome, slug, icone, rota, ordem)
SELECT 
  p.id,
  'Sessões',
  'sessions',
  'Activity',
  '/sessions',
  5
FROM projects p
WHERE p.slug = 'gestao';
```

---

## 📊 Passo 5: Configurar Permissões

### 5.1. Verificar permissões criadas

```sql
SELECT * FROM auth_permission 
WHERE modulo IN ('acordos', 'trade-marketing')
ORDER BY modulo, acao;
```

### 5.2. Atribuir permissões aos usuários

```sql
-- Exemplo: dar acesso total ao admin
INSERT INTO auth_role_permission (role_id, permission_id, concedida)
SELECT 
  ar.id,
  ap.id,
  true
FROM auth_role ar
CROSS JOIN auth_permission ap
WHERE ar.nome = 'admin'
AND ap.modulo IN ('acordos', 'trade-marketing')
ON CONFLICT (role_id, permission_id) DO UPDATE SET concedida = true;
```

---

## 🔍 Passo 6: Testes e Validação

### 6.1. Testar autenticação

1. Fazer login no sistema RBAC
2. Acessar frontend de acordos
3. Verificar se a sessão foi criada:

```sql
SELECT 
  us.*,
  ap.nome as user_name,
  p.nome as project_name
FROM user_sessions us
JOIN auth_profile ap ON ap.user_id = us.user_id
JOIN projects p ON p.id = us.project_id
WHERE us.expires_at > now()
ORDER BY us.created_at DESC;
```

### 6.2. Testar logs de acesso

```sql
SELECT 
  ral.*,
  ap.nome as user_name
FROM resource_access_log ral
JOIN auth_profile ap ON ap.user_id = ral.user_id
ORDER BY ral.created_at DESC
LIMIT 20;
```

### 6.3. Testar permissões

1. Criar usuário com permissões limitadas
2. Tentar acessar funcionalidades restritas
3. Verificar se os componentes são ocultados corretamente

---

## 📈 Passo 7: Monitoramento e Analytics

### 7.1. Dashboard de sessões

- Acessar `/sessions` no sistema RBAC
- Monitorar usuários ativos
- Verificar distribuição por módulos

### 7.2. Relatórios de uso

```sql
-- Relatório de uso por módulo
SELECT 
  frontend_module,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (last_activity - created_at))/60) as avg_session_duration_minutes
FROM user_sessions
WHERE created_at >= now() - interval '7 days'
GROUP BY frontend_module
ORDER BY total_sessions DESC;

-- Relatório de ações mais comuns
SELECT 
  resource_type,
  action,
  COUNT(*) as total_actions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(response_time) as avg_response_time_ms
FROM resource_access_log
WHERE created_at >= now() - interval '7 days'
GROUP BY resource_type, action
ORDER BY total_actions DESC;
```

---

## 🚨 Troubleshooting

### Problema: Sessão não é criada

**Verificar:**
1. Se o projeto_id está correto
2. Se o usuário tem acesso ao projeto
3. Se as funções RPC existem

```sql
-- Verificar acesso do usuário ao projeto
SELECT * FROM user_project_access 
WHERE user_id = 'user_uuid' AND project_id = 'project_uuid';
```

### Problema: Permissões não funcionam

**Verificar:**
1. Se as permissões foram criadas
2. Se o role tem as permissões
3. Se o usuário tem o role

```sql
-- Debug de permissões
SELECT 
  u.email,
  ar.nome as role_name,
  ap.nome as permission_name,
  arp.concedida
FROM auth.users u
JOIN auth_user_role aur ON aur.user_id = u.id
JOIN auth_role ar ON ar.id = aur.role_id
JOIN auth_role_permission arp ON arp.role_id = ar.id
JOIN auth_permission ap ON ap.id = arp.permission_id
WHERE u.id = 'user_uuid'
AND ap.modulo = 'acordos';
```

### Problema: Frontend não consegue validar sessão

**Verificar:**
1. Se a biblioteca foi instalada corretamente
2. Se a configuração está correta
3. Se as funções RPC têm as permissões corretas

---

## 📝 Próximos Passos

1. **Implementar nos outros módulos** seguindo o mesmo padrão
2. **Criar alertas** para sessões suspeitas
3. **Implementar rate limiting** por usuário/módulo
4. **Adicionar métricas** de performance
5. **Criar backup** automático dos logs de auditoria

---

## 💡 Benefícios Alcançados

✅ **Rastreabilidade completa** entre frontends
✅ **Controle de acesso granular** por módulo
✅ **Sessões sincronizadas** em tempo real
✅ **Logs detalhados** de todas as ações
✅ **Dashboard de monitoramento** centralizado
✅ **Biblioteca reutilizável** para novos módulos
✅ **Segurança aprimorada** com RLS e auditoria

---

**🎉 Com esta implementação, o Arruda Hub terá um sistema RBAC completo e funcional para todos os seus micro-frontends!**
