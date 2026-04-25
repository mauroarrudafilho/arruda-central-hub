# arruda-central-hub - Documentação para Agentes de IA

> **Antes de começar qualquer tarefa:** leia `AGENTS.md` na raiz deste projeto (runbook de comportamento do agente — rituais `CHECKPOINT`/`DEPLOY`, protocolo de commit, armadilhas transversais). Depois continue por este arquivo.


## Visão Geral

**arruda-central-hub** é o projeto mais crítico do ecossistema ArrudaHub. Funciona como o **gateway centralizado de autenticação SSO (Single Sign-On) e RBAC (Role-Based Access Control)** para todos os 10+ projetos conectados. É o provedor de identidade e autorização que permite que usuários façam login uma única vez e acessem todos os aplicativos do ecossistema com permissões granulares.

**Status**: Produção  
**Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase  
**Deploy**: Vercel  
**GitHub**: https://github.com/mauroarrudafilho/arruda-central-hub.git

---

## Arquitetura Crítica: Fluxo SSO

### 1. Geração de Token JWT

Após o login bem-sucedido, o hub gera um token JWT assinado contendo:
- **Identidade do usuário**: `user_id`, `email`, `name`
- **Roles e permissões**: Array de roles (ex: ADMIN, USER, MANAGER)
- **Claim de app**: Identificador do app externo que consome o token
- **Timestamps**: `iat` (issued at), `exp` (expiration - default 24h)
- **Metadados**: Informações adicionais do usuário (departamento, empresa)

```typescript
// Estrutura simplificada do token
{
  sub: "user-uuid",
  email: "user@company.com",
  name: "Nome do Usuário",
  roles: ["ADMIN", "USER"],
  app_id: "arruda-flow-buddy",
  iat: 1681234567,
  exp: 1681320967,
  aud: "arruda-ecosystem"
}
```

### 2. Consumo por Projetos Externos

Cada projeto externo (arruda-flow-buddy, acordo-flow, etc.) aponta para:
```env
VITE_HUB_CENTRAL_URL=https://arruda-central-hub.vercel.app
```

O projeto externo:
1. Redireciona usuários não autenticados para `VITE_HUB_CENTRAL_URL/auth`
2. Recebe um token JWT via callback ou query parameter
3. Valida o token contra a chave pública do hub (armazenada em `shared-lib`)
4. Armazena o token em localStorage com expiração
5. Usa o token para todas as requisições à Supabase (como header Authorization)

### 3. Supabase + RLS (Row Level Security)

O hub e todos os projetos compartilham a mesma instância Supabase:
- Política de RLS valida o `user_id` do token JWT
- Cada linha de dados é acessível apenas se o JWT autenticado pertencer ao owner ou tiver role apropriada
- Exemplo: `SELECT * FROM finance_titulo_ajustes WHERE criado_por = auth.uid()`

---

## Estrutura do Projeto

```
arruda-central-hub/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── AuthGuard.tsx    # HOC que protege rotas (requer token válido)
│   │   ├── design-system/   # Componentes do design system exportado
│   │   └── ...
│   ├── contexts/            # Contextos React (auth context, user context)
│   ├── hooks/
│   │   ├── useAuth.tsx      # Hook para acessar dados de autenticação
│   │   └── useDesignTokens.ts
│   ├── lib/
│   │   ├── sso-token-manager.ts  # Gerenciador de pré-geração de tokens
│   │   └── supabase-client.ts
│   ├── pages/
│   │   ├── Auth.tsx         # Página de login
│   │   ├── SSORedirect.tsx  # Callback de retorno do login SSO
│   │   ├── Dashboard.tsx    # Dashboard principal
│   │   └── AdminUsers.tsx   # Gestão de usuários e roles
│   ├── services/            # Camada de negócio (Supabase queries)
│   └── shared-lib/          # Biblioteca compartilhada com todos os projetos
│       ├── types/           # Tipos TypeScript exportados
│       ├── constants/       # Constantes (roles, permissions)
│       ├── utils/           # Funções utilitárias (validação de token, etc.)
│       └── package.json     # Exporta como npm package
├── design-system/           # Design system centralizado
│   ├── components/          # Componentes reutilizáveis (Button, Input, etc.)
│   ├── tokens/              # Design tokens (cores, spacing, tipografia)
│   └── package.json         # Exporta como @arruda/design-system
├── examples/                # Exemplos de integração para projetos externos
├── supabase/                # Migrações SQL e configuração RLS
│   └── migrations/
└── vite.config.ts
```

---

## Funcionalidades Principais

### 1. Autenticação SSO (Auth.tsx + SSORedirect.tsx)

**Fluxo de Login**:
1. Usuário acessa `/auth?redirect_to=...`
2. Form de login via Supabase Auth (email/senha ou social login)
3. Após sucesso, gera token JWT assinado com identidade do usuário
4. Armazena token em localStorage
5. Redireciona para a URL original (query param `redirect_to`)

**Endpoints**:
- `POST /api/auth/login` - Autenticação (Supabase Auth)
- `POST /api/auth/logout` - Revogação de sessão
- `POST /api/sso/token` - Gera JWT para consumo por apps externos
- `GET /api/sso/public-key` - Retorna chave pública para validação de token

### 2. RBAC - Gestão de Roles e Permissões

**Schema do Banco**:

**Tabela `auth_users`** (Supabase Auth):
- Identidade padrão do Supabase Auth
- Campos: `id` (uuid), `email`, `created_at`, etc.

**Tabela `public.users_roles`** (Custom):
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `role` (text): ADMIN, MANAGER, USER, VIEWER
- `assigned_by` (uuid): Quem atribuiu a role
- `assigned_at` (timestamp)

**Tabela `public.role_permissions`** (Custom):
- `id` (uuid, PK)
- `role` (text): Nome da role
- `permission` (text): Ex. "read:finances", "write:users", "admin:config"
- `description` (text)

**Exemplo de Roles**:
```
ADMIN: Acesso total, gestão de usuários, configuração de apps
MANAGER: Acesso a dados financeiros, relatórios, sem gestão de usuários
USER: Acesso a próprios dados, leitura de relatórios públicos
VIEWER: Apenas leitura de dados compartilhados
```

### 3. Gestão de Apps Conectados

**Tabela `public.apps_conectados`**:
- `id` (uuid, PK)
- `slug` (text, UNIQUE): Identificador do app (ex. "arruda-flow-buddy")
- `name` (text): Nome exibição (ex. "Arruda Flow Buddy")
- `url` (text): URL base do app
- `sso_enabled` (boolean): Se SSO está ativo
- `shared_lib_version` (text): Versão de shared-lib esperada
- `created_by` (uuid): Admin que registrou

**Dashboard de Admin**:
- Listar todos os apps conectados
- Ativar/desativar SSO por app
- Configurar versionamento de shared-lib
- Visualizar tokens gerados e expirados

### 4. Shared-lib - Biblioteca Compartilhada

**Exporta para todos os projetos**:
- **Tipos TypeScript**: Interfaces de User, Role, Permission, Token
- **Constantes**: Lista de roles, permissions, variáveis de ambiente esperadas
- **Validadores**: Funções de validação de token JWT, permissões
- **Utilities**: Helper functions para autenticação em projetos clientes

**Como é consumida**:
```bash
# Em arruda-flow-buddy, acordo-flow, etc.
npm install @arruda/shared-lib
# ou local em development
npm link ../arruda-central-hub/shared-lib
```

**Exemplo de uso**:
```typescript
import { validateJWT, hasPermission } from '@arruda/shared-lib';

// Em um projeto externo
const token = localStorage.getItem('sso_token');
const isValid = validateJWT(token, process.env.VITE_HUB_PUBLIC_KEY);
const canWrite = hasPermission(token, 'write:finances');
```

### 5. Design System Centralizado

**Design System** (`design-system/` folder):
- Componentes shadcn/ui estilizados com Tailwind
- Design tokens (cores, spacing, tipografia)
- Ícones via lucide-react
- Tema dark/light via next-themes

**Exportado como npm package** para uso em outros projetos:
```bash
npm install @arruda/design-system
```

**Componentes disponíveis**:
- Button, Input, Form, Dialog, Dropdown, Table, Card, etc.
- Todas com suporte a dark mode
- Acessibilidade (ARIA labels, keyboard navigation)

---

## Variáveis de Ambiente

```env
# Supabase - CRÍTICO
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# SSO - JWT Secret (deve ser muito seguro)
VITE_JWT_SECRET=your-super-secret-key-min-32-chars
VITE_JWT_EXPIRY_HOURS=24

# Apps conectados (para validação de redirect)
VITE_ALLOWED_REDIRECT_DOMAINS=localhost:3000,arruda-flow-buddy.vercel.app,portal-fornecedor-ah.vercel.app

# Social Login (opcional)
VITE_GOOGLE_CLIENT_ID=...
VITE_GITHUB_CLIENT_ID=...
```

---

## Rotas Principais

### Públicas (sem autenticação)
- `GET /` - Homepage
- `GET /auth` - Página de login
- `POST /api/auth/login` - Endpoint de login
- `GET /api/sso/public-key` - Chave pública para validação de tokens
- `GET /health` - Health check

### Protegidas (requer autenticação)
- `GET /dashboard` - Dashboard principal do hub
- `GET /admin/users` - Gestão de usuários (requer ADMIN role)
- `GET /admin/roles` - Gestão de roles (requer ADMIN role)
- `GET /admin/apps` - Gestão de apps conectados (requer ADMIN role)
- `GET /admin/audit-log` - Log de acessos (requer ADMIN role)

### APIs Internas
- `POST /api/sso/generate-token` - Gera token para app específico
- `POST /api/sso/revoke-token` - Revoga token (logout)
- `GET /api/users/me` - Dados do usuário autenticado
- `PUT /api/users/:id/roles` - Atualiza roles do usuário

---

## Avisos Críticos

### 1. Quebra de Compatibilidade em Tokens JWT

**NUNCA** modifique a estrutura do payload do token JWT sem:
1. Planejar uma versão de migration para apps existentes
2. Versionar o token (`token_version` field)
3. Manter backward compatibility por um período
4. Comunicar com proprietários de todos os 10+ projetos

**Cenário de risco**: Adicionar um novo campo obrigatório ao token quebrará apps que não esperam esse campo.

**Solução**: Use versionamento:
```typescript
{
  version: "1.0",  // Incrementar apenas se quebrar compatibilidade
  sub: "user-uuid",
  roles: [...],
  ...
}
```

### 2. Modificações em Shared-lib

Shared-lib é consumida por todos os projetos. Alterações podem quebrar imports:

**Safe**: Adicionar novos exports (tipos, funções)
**Risky**: Renomear exports, alterar assinatura de função
**Dangerous**: Remover exports

**Processo para alterações risky**:
1. Adicionar deprecation warning
2. Versionar o package
3. Comunicar período de transição (ex. 2 releases)
4. Remover apenas depois da transição

### 3. RLS e Segurança de Dados

- Sempre que adicionar uma nova tabela, **defina RLS** no Supabase
- Default: **DENY ALL**, depois abra permissões específicas
- Exemplo: `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
- Teste RLS com usuário que NÃO é owner para garantir restrição

### 4. Backward Compatibility de APIs

Sempre versionar endpoints se alterar estrutura de resposta:
```
GET /api/v1/users/me    (nova estrutura)
GET /api/users/me       (legacy, redireciona ou mantém)
```

---

## Testing do SSO Localmente

### Setup: Múltiplos Projetos em Dev Mode

1. **Terminal 1 - arruda-central-hub**:
```bash
cd /path/to/arruda-central-hub
export VITE_HUB_CENTRAL_URL=http://localhost:5173
npm run dev
# Roda em http://localhost:5173
```

2. **Terminal 2 - arruda-flow-buddy** (ou outro projeto):
```bash
cd /path/to/arruda-flow-buddy
export VITE_HUB_CENTRAL_URL=http://localhost:5173
export VITE_ALLOWED_REDIRECT_DOMAINS=localhost:5173,localhost:5174
npm run dev
# Roda em http://localhost:5174
```

3. **Teste de fluxo SSO**:
```
1. Abrir http://localhost:5174/
2. App detecta ausência de token
3. Redireciona para http://localhost:5173/auth?redirect_to=http://localhost:5174/dashboard
4. Fazer login no hub
5. Hub gera token e redireciona de volta para 5174
6. App valida token contra public key do hub
7. App armazena token e carrega dashboard
```

### Debug de Token

```typescript
// No console do navegador
localStorage.getItem('arruda_sso_tokens')  // Ver tokens armazenados
localStorage.getItem('sso_token')           // Token da sessão atual

// Decodificar JWT (sem validar assinatura, apenas para debug)
const token = localStorage.getItem('sso_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);  // Ver claims do token
```

---

## Fluxo de Dados: Visão Completa

```
┌─────────────────────┐
│  Usuário            │
└──────────┬──────────┘
           │
           │ (1) Login com email/senha
           ▼
┌─────────────────────────────────────┐
│  arruda-central-hub                 │
│  ├─ Auth.tsx (login form)           │
│  ├─ Supabase Auth (validação)       │
│  └─ JWT Token Generator             │
└──────────┬──────────────────────────┘
           │ (2) Token JWT gerado
           │ (3) Redireciona com token
           ▼
┌──────────────────────────────────────────┐
│  arruda-flow-buddy                       │
│  (ou outro projeto do ecossistema)      │
│  ├─ Valida token via public key          │
│  ├─ Armazena em localStorage             │
│  └─ Usa token em todas requisições       │
└──────────┬───────────────────────────────┘
           │ (4) Requisição com token
           │     (Header: Authorization: Bearer <token>)
           ▼
┌──────────────────────────────┐
│  Supabase                    │
│  ├─ RLS valida user_id       │
│  ├─ RLS valida roles/perms   │
│  └─ Retorna dados seguros    │
└──────────────────────────────┘
```

---

## Deployment e Produção

### Supabase
- Usar projeto compartilhado (não criar novo por projeto)
- RLS deve estar ativado em TODAS as tabelas
- Backups automáticos habilitados

### Vercel
- Variáveis de ambiente sincronizadas com `.env` local
- Preview deployments para branches
- Revert automático se build falhar
- Custom domain: arruda-central-hub.vercel.app

### Monitoramento
- Logs de erro: Check Vercel dashboard ou Supabase logs
- Alertas de downtime: Configure via Vercel settings
- Audit log: Tabela `audit_logs` para rastreamento de ações de admin

---

## Próximos Passos (Roadmap)

- **MFA (Multi-Factor Authentication)**: TOTP ou SMS
- **Dashboard avançado de admin**: CRUD de usuários via GUI
- **Gestão de permissões granulares**: Per-table/per-row
- **Auditoria detalhada**: Log de todas as ações em produção
- **OAuth 2.0 para apps terceiros**: Integração externa segura

