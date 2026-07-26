# ROADMAP — Arruda Central Hub

**Última atualização:** Abril 2026
**Status do projeto:** Produção (Manutenção + Evolução)

---

## Contexto

O **Arruda Central Hub** é o sistema de autenticação SSO e RBAC centralizado do ecossistema ArrudaHub. Serve todos os 11 projetos:

1. arruda-central-hub (próprio)
2. arruda-rbac-master
3. arruda-catalog-maker
4. arruda-hub-commercial-core
5. arruda-sales-boost
6. acordo-flow
7. arruda-flow-buddy
8. logistics-arrudahub
9. degusta-go-app
10. nfe-radar
11. route-planner

**Responsabilidades:**
- Autenticação via SSO (email/senha + OAuth)
- Geração de tokens JWT validados por RPC no Supabase
- RBAC — controle de acesso por role (admin, gestor, vendedor, operador, etc.)
- Dashboard para gerenciamento de usuários e permissões
- Auditoria de acessos

**Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase (auth + RLS)

---

## ⚠️ AVISO CRÍTICO: Impacto Cross-Projeto

**Qualquer mudança no fluxo de token SSO, estrutura de usuários ou validação de permissões REQUER coordenação com todos os 11 projetos.**

Exemplo: Se mudarmos a estrutura do token JWT, precisamos atualizar:
- Validação RPC em todos os 11 projetos
- AuthContext em todos os 11 projetos
- Supabase client interceptor em todos os 11 projetos

**Protocolo:**
1. Propor mudança com 2 semanas de antecedência
2. Comunicar por email/Slack para todos os times
3. Fornecer migration guide claro
4. Suportar tokens antigos por 1 mês (backward compatibility)
5. Deploy em staging primeiro, testar em todos os 11 projetos

---

## Fase 1 — Admin Dashboard & UX | Prioridade Alta
**Duração:** 4 semanas
**Valor:** Administradores gerenciam usuários e permissões via GUI (não via SQL)

### 1.1 Dashboard de Administração (Gestão de Usuários)
**Esforço:** Médio | **Impacto:** Alto | **Bloqueador:** Nenhum

**Descrição:**
Interface gráfica para gerenciar usuários do sistema: criar, editar, desativar, resetar senha, atribuir roles. Visualização em tabela com paginação, filtros (role, projeto, status).

**Funcionalidades:**
- Lista de usuários com colunas: email, nome, role, projeto(s), status, último login, ações
- Botões: Novo Usuário, Editar, Desativar, Resetar Senha, Ver Auditoria
- Filtros: por role (Admin, Gestor, Vendedor, Operador), por projeto, status (ativo/inativo)
- Busca full-text por email/nome
- Modal para criar/editar usuário:
  - Email, Nome, Role (dropdown), Projetos (multi-select)
  - Validação no frontend + backend
  - Confirmação antes de salvar

**Componentes Novos:**
- `src/pages/AdminDashboard.tsx` (novo)
- `src/pages/UserManagement.tsx` (novo)
- `src/components/admin/UserTable.tsx` (novo)
- `src/components/admin/UserForm.tsx` (novo)
- `src/components/admin/UserFilters.tsx` (novo)

**Tabelas Supabase:**
- Existente: `auth.users` (Supabase Auth)
- Existente: `user_roles` — user_id, role (admin|gestor|vendedor|operador)
- Existente: `user_project_access` — user_id, project_id, access_level
- Existente: `user_audit_log` — user_id, action, timestamp, ip_address, user_agent

**RLS Policies Necessárias:**
```sql
-- Apenas admins podem ler user_roles
CREATE POLICY "admin_read_user_roles" ON user_roles
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
  );

-- Apenas admins podem modificar user_roles
CREATE POLICY "admin_modify_user_roles" ON user_roles
  FOR INSERT, UPDATE, DELETE USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
  );
```

---

### 1.2 Gestão de Roles e Permissões por GUI
**Esforço:** Médio | **Impacto:** Alto | **Bloqueador:** 1.1 (parcial)

**Descrição:**
Interface para gerenciar roles customizadas e suas permissões. Atualmente, roles são hardcoded (admin, gestor, vendedor, operador). Permitir admin criar roles customizadas com permissões selecionáveis.

**Funcionalidades:**
- Nova página: `/admin/roles`
- Listar roles existentes (built-in + customizadas)
- Criar novo role:
  - Nome do role, descrição
  - Seleção de permissões (checkboxes): gerenciar-usuários, visualizar-relatórios, criar-pedidos, editar-catálogos, etc.
  - Projetos aplicáveis (multi-select)
- Editar role (exceto built-in)
- Deletar role (se não atribuído a nenhum usuário)
- Visualizar permissões de cada role

**Modelo de Dados:**
```sql
roles_custom:
  id UUID
  nome TEXT UNIQUE
  descricao TEXT
  built_in BOOLEAN DEFAULT FALSE
  criado_em TIMESTAMP
  criado_por UUID -> auth.users

role_permissions:
  id UUID
  role_id UUID -> roles_custom
  permissao TEXT (enum)
  criado_em TIMESTAMP

-- Enum de permissões possíveis
CREATE TYPE permission_enum AS ENUM (
  'manage_users',
  'manage_roles',
  'view_audit_log',
  'manage_projects',
  'create_orders',
  'edit_catalogs',
  'view_reports',
  'manage_automation',
  -- adicionar conforme necessário
);
```

**Componentes:**
- `src/pages/RoleManagement.tsx` (novo)
- `src/components/admin/RoleForm.tsx` (novo)
- `src/components/admin/PermissionCheckboxes.tsx` (novo)

---

### 1.3 Onboarding de Usuários Melhorado
**Esforço:** Baixo-Médio | **Impacto:** Médio | **Bloqueador:** Nenhum

**Descrição:**
Primeiro acesso do usuário — welcome flow com descoberta de funcionalidades, tutorial de como acessar os 11 projetos, documentação contextual.

**Funcionalidades:**
- Welcome screen com boas-vindas personalizado (nome)
- Listagem dos projetos disponíveis (baseado em role/access)
- Cards clicáveis para cada projeto com descrição e link
- Mini-tutorial sobre o SSO e como funciona
- Checklist de "próximos passos" (completar perfil, etc.)
- Botão para pular onboarding

**Componentes:**
- `src/components/onboarding/WelcomeFlow.tsx` (novo)
- `src/components/onboarding/ProjectDiscovery.tsx` (novo)
- `src/pages/Dashboard.tsx` — Melhorar para mostrar onboarding na primeira visita

**Tabelas:**
- `user_onboarding_progress` (nova) — user_id, step_id, completed_at

---

### 1.4 Visual Consistency — Design System Refresh
**Esforço:** Baixo | **Impacto:** Médio | **Bloqueador:** Nenhum

**Descrição:**
Revisar e documenta design system. Garantir consistência entre Central Hub e os 11 projetos.

**Ações:**
- Auditar cores, tipografia, espaçamento
- Documentar em Storybook
- Criar guia de padrões para os 11 projetos
- Revisar componentes shadcn/ui já em uso

---

## Fase 2 — Segurança Avançada & Auditoria | Prioridade Alta
**Duração:** 5 semanas
**Valor:** Sistema mais seguro, conformidade, rastreabilidade completa de acessos

### 2.1 Multi-Factor Authentication (MFA)
**Esforço:** Alto | **Impacto:** Muito Alto | **Bloqueador:** Nenhum

**Descrição:**
Implementar MFA obrigatório para admins e opcional para outros usuários. Suportar TOTP (Google Authenticator, Authy) e SMS.

**Funcionalidades:**
- Setup MFA na página de Perfil:
  - Gerar secret TOTP (QR code)
  - Escanear QR code
  - Validar código
  - Armazenar backup codes (10 códigos)
- Verificação MFA no login (se ativado)
- Interface para desativar MFA
- Admin pode forçar MFA para todos os usuários (policy)

**Componentes:**
- `src/components/auth/MFASetup.tsx` (novo)
- `src/components/auth/MFAVerification.tsx` (novo)
- `src/components/auth/BackupCodes.tsx` (novo)

**Tabelas:**
```sql
user_mfa:
  user_id UUID PRIMARY KEY -> auth.users
  mfa_enabled BOOLEAN DEFAULT FALSE
  mfa_method ENUM ('totp', 'sms') DEFAULT 'totp'
  totp_secret TEXT (encrypted)
  backup_codes TEXT[] (encrypted)
  phone_number TEXT
  mfa_verified_at TIMESTAMP
  ultimo_uso TIMESTAMP

mfa_attempts:
  id UUID
  user_id UUID
  tentativa TEXT (encrypted)
  sucesso BOOLEAN
  ip_address INET
  user_agent TEXT
  timestamp TIMESTAMP
```

**Dependências:**
- `speakeasy` — Gerar TOTP secrets
- `qrcode.react` — Renderizar QR code
- (Opcional) Twilio para SMS

**Políticas de Segurança:**
- MFA obrigatório para role "admin"
- MFA recomendado para role "gestor"
- MFA optional para outros
- Lockout após 5 tentativas falhadas

---

### 2.2 Auditoria Completa de Acessos
**Esforço:** Médio | **Impacto:** Alto | **Bloqueador:** Nenhum

**Descrição:**
Sistema completo de auditoria: log de todos os acessos, mudanças de permissões, alterações de dados sensíveis. Visualização em dashboard com filtros e exportação.

**Funcionalidades:**
- Nova tabela `audit_log` centralizada
- Registrar:
  - Login (sucesso/falha, IP, user-agent)
  - Logout
  - Mudança de permissão
  - Mudança de role
  - Criação/edição/deleção de usuário
  - Reset de senha
  - MFA ativado/desativado
  - Acesso a projetos específicos
- Dashboard de auditoria (admin only):
  - Timeline de eventos por usuário
  - Filtros: usuário, tipo de evento, data, IP
  - Exportar para CSV
  - Alertas de atividades suspeitas (múltiplas tentativas falhadas, acesso de IP novo, etc.)

**Componentes:**
- `src/pages/AuditLog.tsx` (novo)
- `src/components/admin/AuditTimeline.tsx` (novo)
- `src/components/admin/AuditFilters.tsx` (novo)

**Tabelas:**
```sql
audit_log:
  id UUID PRIMARY KEY
  user_id UUID -> auth.users
  event_type ENUM ('login', 'logout', 'permission_change', 'role_change', ...)
  recurso_tipo ENUM ('user', 'role', 'project', 'token', ...)
  recurso_id UUID (nullable)
  descricao TEXT
  ip_address INET
  user_agent TEXT
  timestamp TIMESTAMP DEFAULT NOW()
  
CREATE INDEX idx_audit_user_timestamp ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_event_type ON audit_log(event_type, timestamp DESC);
```

---

### 2.3 Detecção de Anomalias & Alertas Automáticos
**Esforço:** Médio | **Impacto:** Médio | **Bloqueador:** 2.2

**Descrição:**
Sistema inteligente que detecta atividades suspeitas e notifica admins.

**Regras de Detecção:**
1. **Múltiplas tentativas falhadas** (5+ em 10 min) → bloquear temporário + alerta
2. **Acesso de IP novo** → notificar admin
3. **Acesso fora de horário comercial** (config por role) → log
4. **Acesso a múltiplos projetos rapidamente** → indicador de roubo de token
5. **Tentativa de escalonamento de privilégio** → alerta crítica

**Componentes:**
- `src/services/security/AnomalyDetector.ts` (novo)
- `src/pages/SecurityAlerts.tsx` (novo)

---

### 2.4 Controle de Sessão Avançado
**Esforço:** Médio | **Impacto:** Médio | **Bloqueador:** Nenhum

**Descrição:**
Admin pode ver e gerenciar sessões ativas de qualquer usuário. Forçar logout, limpar cache, revogar tokens específicos.

**Funcionalidades:**
- Página `/admin/sessions`:
  - Listar todas as sessões ativas (por usuário, projeto, IP, último uso)
  - Forçar logout de sessão específica
  - Revogar todos os tokens de um usuário
  - Configurar timeout de sessão (default 1 hora, customizável)
- Aviso de sessão expirada com 5 min de antecedência
- Logout automático após timeout
- "Remember me" com limite de 30 dias

**Componentes:**
- `src/pages/AdminSessions.tsx` (novo)
- `src/components/session/SessionManager.tsx` (novo)
- `src/components/session/SessionTimeoutWarning.tsx` (novo)

**Tabelas:**
```sql
user_sessions:
  id UUID PRIMARY KEY
  user_id UUID -> auth.users
  token_hash TEXT (hash do JWT para privacidade)
  ip_address INET
  user_agent TEXT
  criado_em TIMESTAMP
  ultimo_uso TIMESTAMP
  expira_em TIMESTAMP
  revogado BOOLEAN DEFAULT FALSE
```

---

## Fase 3 — Analytics & Intelligence | Prioridade Média
**Duração:** 6 semanas
**Valor:** Insights sobre adoção dos 11 projetos, comportamento de usuários, ROI

### 3.1 Dashboard de Analytics
**Esforço:** Alto | **Impacto:** Alto | **Bloqueador:** Nenhum

**Descrição:**
Dashboard centralizado com métricas cross-projeto: usuários ativos, tempo gasto por projeto, funcionalidades mais usadas, retenção, churn.

**Funcionalidades:**
- Cards: total de usuários, usuários ativos (últimos 30 dias), projects com mais tráfego
- Gráficos:
  - Crescimento de usuários ao longo do tempo
  - Distribuição de usuários por role
  - Acessos por projeto (pie/bar chart)
  - Tempo médio de sessão por projeto
  - Hora do dia mais movimentada
  - Taxa de retenção/churn
- Filtros: período, role, projeto
- Exportar relatório em PDF

**Componentes:**
- `src/pages/CentralAnalytics.tsx` (novo)
- `src/components/analytics/MetricsCard.tsx` (novo)
- Gráficos com Recharts ou Tremor

**Dados Necessários:**
```sql
-- Tabela para rastrear user journeys (criar em Fase 3)
user_journey_events:
  id UUID
  user_id UUID
  project_id TEXT
  event_type ENUM ('project_access', 'feature_use', 'logout')
  timestamp TIMESTAMP
  session_id TEXT
  tempo_gasto_segundos INTEGER
```

---

### 3.2 Relatórios Automáticos por Email
**Esforço:** Médio | **Impacto:** Médio | **Bloqueador:** Nenhum

**Descrição:**
Relatórios automáticos enviados por email: weekly digest de atividades, monthly business review (MBR), alertas críticos.

**Tipos de Relatório:**
1. **Weekly Digest** (segunda-feira):
   - Usuários ativos na semana anterior
   - Projetos mais usados
   - Alertas de segurança
   - Destinatário: admin

2. **Monthly Business Review** (1º do mês):
   - Crescimento de usuários
   - Adoção por projeto
   - Churn (usuários inativos)
   - ROI estimado
   - Destinatário: stakeholders

**Implementação:**
- Edge Function `send-scheduled-reports` (cron job)
- Templates de email customizáveis
- Botão para gerar relatório manual
- Configuração de frequência/destinatários por admin

---

### 3.3 Recomendações de Permissões
**Esforço:** Médio | **Impacto:** Baixo | **Bloqueador:** Nenhum

**Descrição:**
IA analisa padrões de uso e recomenda roles/permissões mais apropriadas para novos usuários.

**Exemplo:** "Usuário X acessa frequentemente projeto Y e Z. Recomendamos role 'Gestor' ao invés de 'Vendedor'."

---

## Fase 4 — Ecossistema & Extensibilidade | Prioridade Baixa
**Duração:** 8 semanas (Q4 2026+)
**Valor:** Platform como serviço, integrações externas, marketplace de plugins

### 4.1 API Gateway Documentado
**Esforço:** Médio | **Impacto:** Médio | **Bloqueador:** Nenhum

**Descrição:**
Documentar e versionaizar API SSO/RBAC. Permitir integrações externas (futuro: terceiros desenvolverem sobre ArrudaHub).

**Especificação:**
- OpenAPI/Swagger
- Endpoints:
  - GET `/api/v1/auth/user` — Info do usuário autenticado
  - POST `/api/v1/auth/validate-token` — Validar JWT
  - GET `/api/v1/user/:id/permissions` — Listar permissões de usuário
  - POST `/api/v1/user` — Criar usuário (admin only)
  - GET `/api/v1/projects` — Listar projetos

**Implementação:**
- Documentação em `/api/docs` (Swagger UI)
- Rate limiting por API key
- Webhooks para eventos (user_created, permission_changed)

---

### 4.2 Plugin System (Futuro Distante)
**Esforço:** Muito Alto | **Impacto:** Alto (futuro) | **Bloqueador:** 4.1

**Descrição:**
Permitir desenvolvedores criar plugins que se integram com Central Hub (exemplo: plugin de autenticação com Okta).

---

## Débito Técnico & Qualidade

| Item | Prioridade | Descrição |
|------|-----------|-----------|
| RLS policies audit | Alta | Revisar 210+ policies no ecossistema, documentar |
| TypeScript strict | Média | Progressivamente habilitar strict mode |
| Testes de autenticação | Média | Cobertura de testes para fluxos críticos |
| Documentação de API | Média | OpenAPI/Swagger |
| Performance queries | Baixa | Índices, query optimization |

---

## Impacto nos 11 Projetos

### Lista de Verificação para Coordenação

Quando implementar mudança no Central Hub, verificar com todos:

- [ ] arruda-rbac-master — Integração de roles
- [ ] arruda-catalog-maker — Validação de token
- [ ] arruda-hub-commercial-core — RLS policies
- [ ] arruda-sales-boost — AuthContext
- [ ] acordo-flow — SSO flow
- [ ] arruda-flow-buddy — Token validation
- [ ] logistics-arrudahub — Audit logging
- [ ] degusta-go-app — Session management
- [ ] nfe-radar — Permission checks
- [ ] route-planner — User context

---

## Cronograma de Execução

```
Fase 1 (4 semanas)
├── Admin dashboard (user management)
├── Role & permissões GUI
├── Onboarding melhorado
└── Design system refresh

Fase 2 (5 semanas)
├── MFA (TOTP + SMS)
├── Auditoria completa
├── Detecção de anomalias
└── Controle avançado de sessões

Fase 3 (6 semanas)
├── Analytics cross-projeto
├── Relatórios automáticos
└── Recomendações de permissões

Fase 4 (8 semanas)
├── API Gateway documentado
└── Plugin system (futuro)
```

---

## Métricas de Sucesso

### Fase 1
- [ ] Admin consegue gerenciar usuários sem SQL
- [ ] Tempo de onboarding reduzido em 50%
- [ ] 100% dos novos usuários completam welcome flow

### Fase 2
- [ ] 90% dos admins ativam MFA
- [ ] 100% dos acessos auditados
- [ ] 0 security incidents não detectados

### Fase 3
- [ ] Analytics consultado por 70% dos stakeholders
- [ ] Retenção de usuários melhora em 20%
- [ ] Relatórios enviados com 95% de taxa de abertura

### Fase 4
- [ ] API documentada com 100% de endpoints
- [ ] Rate limiting aplicado
- [ ] 5+ integrações externas usando API

---

## Dependências e Pré-requisitos

### Conhecimento Técnico
- Autenticação JWT
- Supabase RLS policies
- SQL (views, functions, triggers)
- React patterns (context, hooks)
- Security best practices (password hashing, token validation, CORS)

### Ferramentas
- Supabase Dashboard
- Vercel
- OpenAPI/Swagger
- Email service (Resend ou similar)
- SMS service (Twilio, opcional)

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_JWT_SECRET= # Para validação local
RESEND_API_KEY=  # Para email
TWILIO_ACCOUNT_SID= # Opcional, para SMS
TWILIO_AUTH_TOKEN=  # Opcional
```

---

## Próximos Passos Imediatos

1. [ ] Revisar roadmap com stakeholders de todos os 11 projetos
2. [ ] Definir protocolo de coordenação para mudanças
3. [ ] Começar Fase 1.1 (Admin Dashboard)
4. [ ] Criar migration guide template
5. [ ] Documentar arquitetura SSO em LESSONS.md

---

## Considerações para o Ecossistema

### Backward Compatibility
- Manter suporte para tokens antigos por 1 mês durante transições
- Deprecated endpoints sinalizar com headers HTTP 410 Gone
- Changelog publicado em versão anterior a breaking changes

### Testing Across Projects
- Antes de deploy: testar login em todos os 11 projetos
- Staging environment com réplica de todos os 11 projetos
- Automação: testes de integração em CI/CD

### Communication
- Email com 2 semanas antes de breaking changes
- Video/webinar explicando mudanças
- Documentation atualizada antes do deploy

---

**Mantido por:** Time de Desenvolvimento Arruda
**Última atualização:** 2026-04-13
**Próxima revisão:** 2026-06-30

**Aviso de Responsabilidade:** Este é o projeto crítico do ecossistema. Qualquer mudança aqui afeta 11 outros projetos. Proceder com cautela, comunicação clara e testes completos.
