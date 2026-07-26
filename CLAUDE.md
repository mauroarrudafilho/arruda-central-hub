# arruda-central-hub - Documentação para Agentes de IA

> **Antes de começar qualquer tarefa:** leia `AGENTS.md` na raiz deste projeto (runbook de comportamento do agente — rituais `CHECKPOINT`/`DEPLOY`, protocolo de commit, armadilhas transversais). Depois continue por este arquivo.


## Visão Geral

**arruda-central-hub** é o projeto mais crítico do ecossistema ArrudaHub. Funciona como o **gateway centralizado de autenticação SSO (Single Sign-On) e RBAC (Role-Based Access Control)** para todos os 10+ projetos conectados. É o provedor de identidade e autorização que permite que usuários façam login uma única vez e acessem todos os aplicativos do ecossistema com permissões granulares.

**Status**: Produção  
**Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + React Router v6  
**Deploy**: Vercel (`arruda-central-hub.vercel.app`)  
**GitHub**: https://github.com/mauroarrudafilho/arruda-central-hub.git  
**RBAC canônico**: políticas e matriz granular vivem em `arruda-rbac-master`; o hub consome `rbac_*` via Supabase compartilhado.

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
│   │   ├── Auth.tsx         # Login (Supabase Auth)
│   │   ├── Hub.tsx          # Launcher de apps/módulos (pós-login)
│   │   ├── Redirect.tsx     # Redirecionamento SSO para app externo
│   │   ├── SSORedirect.tsx  # Callback SSO
│   │   ├── Profile.tsx      # Perfil do usuário
│   │   ├── ForgotPassword.tsx / ResetPassword.tsx / SetPassword.tsx / ConfirmEmail.tsx
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

**Reset de senha (edge unificada):** `ForgotPassword` → Edge `send-reset-password` (`product: "hub"`); `/reset-password` valida via `verify-reset-token` (mesmo fluxo multi-app).

### 2. RBAC - Roles e Permissões

Roles e policies são geridas no **`arruda-rbac-master`**. O hub lê o catálogo via Supabase:

| Tabela | Uso no hub |
|--------|------------|
| `rbac_auth_profile` | Perfil do usuário autenticado |
| `rbac_auth_user_role` + `rbac_auth_role` | Role efetiva (`useAuth` → `isAdmin` quando `nome === 'admin'`) |
| `rbac_projects` | Cards de apps no launcher (`Hub.tsx`) |
| `rbac_project_modules` + `rbac_modules` | Módulos por projeto (`useProjects`) |

**Não editar policies `rbac_*` neste repo** — registrar mudanças em `arruda-rbac-master/LESSONS.md`.

### 3. Launcher de Apps (Hub)

**Tabelas `rbac_projects` / `rbac_project_modules`**: slug, URL Vercel, ícone, rota de módulo.  
`sso-token-manager.ts` pré-gera tokens por `project_slug` após login e persiste em `localStorage` (`arruda_sso_tokens`).

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

## Rotas Principais (React Router — SPA)

| Rota | Acesso | Componente |
|------|--------|------------|
| `/` | Público | Redirect → `/auth` |
| `/auth` | Público | Login Supabase Auth |
| `/forgot-password` | Público | Solicitar reset |
| `/reset-password` | Público | Nova senha (`verify-reset-token`) |
| `/confirm-email` | Público | Confirmação de e-mail |
| `/set-password` | Público | Definir senha (convite) |
| `/sso-redirect` | Público | Callback SSO para apps |
| `/hub` | Autenticado (`AuthGuard`) | Launcher de apps/módulos |
| `/redirect` | Autenticado | Redireciona para app com token SSO |
| `/profile` | Autenticado | Perfil do usuário |
| `*` | — | `NotFound` |

**Dev:** `npm run dev` — porta Vite default 5173.

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

Ver `PROGRESS.md` / `ROADMAP.md`. Backlog imediato: GUI admin de usuários no hub, MFA, auditoria detalhada.

---

## Documentação do SSO (`docs/sso/`) — desenho preservado, sistema em stand-by

> **Este app está em stand-by e o SSO não é usado.** Evidência: `sso_sessions` tem **1 linha,
> de 2025-11-21** — oito meses sem uso. Toda a documentação de SSO foi escrita naquela mesma
> data. O sistema foi construído, testado uma vez e nunca adotado, porque cada time opera
> exclusivamente um app e sessão única cross-app nunca foi necessária.
>
> **Fonte canônica de acesso do ecossistema: `arruda-rbac-master`.** Não usar este repo como
> referência para permissão, policy ou identidade. Ver `CLAUDE.md` da raiz, seção
> *arruda-central-hub — stand-by*.

Cinco documentos foram preservados em `docs/sso/` para o caso de reativação — são o desenho,
não o histórico de execução:

| Arquivo | Conteúdo |
|---|---|
| `docs/sso/SSO_COMPLETE_GUIDE.md` | Guia completo do fluxo |
| `docs/sso/SSO_ENDPOINTS_API_REFERENCE.md` | Referência técnica de integração |
| `docs/sso/SSO_GLOBAL_SOLUTION.md` | Solução global proposta |
| `docs/sso/SSO_MODULE_INTEGRATION_GUIDE.md` | Como um módulo integraria |
| `docs/sso/SSO_FOR_OTHER_AGENTS.md` | Orientação para agentes de outros apps |

**Se reativar, tratar como redesenho, não retomada.** Os apps mudaram desde nov/2025 — a
autorização passou a ser resolvida pela matriz RBAC (Onda 3, jul/2026), o que os documentos
acima não conhecem.

Doc de sessão nasce em `docs/sessions/YYYY-MM-DD-<slug>.md`, **nunca na raiz** — ver `AGENTS.md` §2, passo 9.

---

## Dados

**Este repo não é dono de nenhuma tabela.** Não há prefixo `central_*` na instância. O que o
código de SSO tocaria são tabelas de outros donos — mais uma razão para não escrever daqui.

`sso_sessions` tem **1 linha desde nov/2025**. É a medida mais direta do stand-by.

---

## Estado e legado

> **Leia esta seção antes de qualquer outra deste arquivo.** O resto descreve um sistema que não
> está em uso.

### Em stand-by desde antes de 2026-07

O `arruda-central-hub` foi desenhado como camada de SSO cross-app e **não é fonte de autorização**.
Identidade, perfil, RLS e matriz de acesso se resolvem no **`arruda-rbac-master`**.

**A armadilha é este repositório parecer vigente.** O código de SSO continua completo e bem
documentado; um agente que abra o repo sem contexto encontra um fluxo de token plausível e conclui
que é o caminho atual. Não é. O mecanismo vivo é Supabase Auth direto, com autorização validada no
banco por RPC e RLS.

### Por que o stand-by foi a decisão certa

Cada time opera exclusivamente um app: Comercial → `arruda-sales-boost`, Trade Marketing →
`degusta-go-app`, RH → `arruda-peoplecare-hub`, Finanças → `arruda-flow-buddy`. Sessão única
cross-app nunca foi necessária. O CEO Hub consulta números gerais e autentica em cada app
normalmente.

Por segurança, também: SSO cria um token que atravessa 16 apps e, com ele, um ponto único cujo
comprometimento vale por todos.

### Uso residual

`VITE_HUB_CENTRAL_URL` aparece em código real em 4 apps — `arruda-academy`,
`arruda-peoplecare-hub`, `arruda-sales-boost`, `logistics-arrudahub` — e **só para redirecionar à
tela de login**. Nos demais é declaração de tipo em `vite-env.d.ts`, sem uso.

**Não adicionar essa variável em app novo.**

### Se um dia for reativado

O `LESSONS.md` deste repo abre com *"Mudanças no Token JWT Quebram TODO o Ecossistema"* — vale como
aviso de segurança: um claim a mais no JWT muda o que **todas** as policies dos 16 apps enxergam.

1. Levantar o blast radius no código e no banco: `grep -rn "VITE_HUB_CENTRAL_URL\|sso_" nos `src/` dos 16 apps, mais `pg_policies` e `pg_get_functiondef` via MCP Supabase. (O grafo do Graphify saiu do fluxo em 2026-07-26 e não serve como fonte.)
2. Reconciliar com o modelo canônico do `arruda-rbac-master`, que evoluiu desde o stand-by — a
   Onda 3 mudou `fn_user_module_tiers`. A documentação de SSO em `docs/sso/` descreve um modelo
   **superado**: é histórico, não especificação.
3. **Quando reativar:** só se um usuário passar a precisar de acesso a mais de uma plataforma.
   Até lá, não investir.

---

## Contexto cross-app (Obsidian)

- **Nota Obsidian:** `01 - Projetos/Arruda Central Hub.md` no vault `arruda_hub`.
- **Blast radius cross-app:** apurar no código e no banco — `grep` nos `src/` dos apps envolvidos, e `pg_policies`/`pg_get_functiondef` via MCP Supabase para RLS, RPC e contratos. O Graphify saiu do fluxo em 2026-07-26; `graphify-out/` é retrato congelado de 25/07 — não usar como estado atual (ver `LESSONS.md` da raiz).
- **Ritual:** ver `AGENTS.md` §2 (`CHECKPOINT` / `DEPLOY`) — atualizar este `CLAUDE.md` + `PROGRESS.md` no mesmo ritual quando o contexto mudar.
