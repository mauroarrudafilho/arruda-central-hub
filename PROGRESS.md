# arruda-central-hub - Progresso do Projeto

## Status Geral

**Fase**: Produção  
**Data da Última Atualização**: 2026-07-19  
**Versão Atual**: 1.0.0

---

## Concluído (recente)

### Analytics frequência — `@arruda/tracking` (2026-07-19)
- [x] Dep `@arruda/tracking` (link local → rbac-master/packages/tracking)
- [x] `initTracking` em `main.tsx` (`projectSlug: arruda-central-hub`, mode `frequency`)
- [x] `useTrackPageView()` em `AuthGuard` (rotas autenticadas dentro do Router)

### Reset de senha via edge unificada (2026-07-15)
- [x] Auth + ForgotPassword chamam `send-reset-password` com `product: "hub"`
- [x] `/reset-password` usa `verify-reset-token` (mesmo fluxo multi-app)

---

## Recursos Concluídos ✅

### 1. Autenticação SSO via JWT
- [x] Página de login (Auth.tsx)
- [x] Integração com Supabase Auth (email/senha)
- [x] Geração de token JWT assinado
- [x] Gerenciador de tokens (sso-token-manager.ts)
- [x] Callback de retorno SSO (SSORedirect.tsx)
- [x] Validação de token em projetos clientes
- [x] Expiração e renovação de token
- [x] Revogação de token (logout)

### 2. RBAC (Role-Based Access Control)
- [x] Estrutura de roles (ADMIN, MANAGER, USER, VIEWER)
- [x] Tabela `users_roles` no banco
- [x] Tabela `role_permissions` para mapeamento
- [x] Hook `useAuth()` com acesso a roles e permissões
- [x] Componente `AuthGuard` para proteção de rotas
- [x] Validação de permissões em componentes React
- [x] Integração com RLS do Supabase

### 3. Shared-lib (Biblioteca Compartilhada)
- [x] Estrutura de tipos TypeScript exportados
- [x] Constantes de roles e permissions
- [x] Funções de validação de JWT
- [x] Verificadores de permissão (`hasPermission()`)
- [x] Package.json configurado para npm link / publicação
- [x] Exemplos de integração em outros projetos
- [x] Documentação de como consumir

### 4. Design System
- [x] Componentes base: Button, Input, Form, Dialog
- [x] Componentes avançados: Table, Card, Dropdown, Navigation
- [x] Integração com shadcn/ui
- [x] Design tokens (cores, spacing, tipografia)
- [x] Tema dark/light via next-themes
- [x] Ícones via lucide-react
- [x] Acessibilidade básica (ARIA labels)
- [x] Export como @arruda/design-system

### 5. Supabase + RLS
- [x] Instância Supabase compartilhada configurada
- [x] RLS ativado em tabelas críticas
- [x] Políticas RLS para `users_roles`
- [x] Políticas RLS para dados do usuário
- [x] Chave JWT do Supabase integrada
- [x] Migrations para criação de tabelas

### 6. Deploy e Infraestrutura
- [x] Configuração do Vercel
- [x] CI/CD com GitHub Actions
- [x] Variáveis de ambiente em produção
- [x] Custom domain: arruda-central-hub.vercel.app
- [x] Preview deployments para PRs

### 7. Dashboard Básico
- [x] Dashboard principal para usuários autenticados
- [x] Exibição de informações do usuário (email, roles)
- [x] Logout

---

## Recursos em Desenvolvimento 🚧

### 1. Dashboard de Admin de Usuários
- [ ] Listagem completa de usuários
- [ ] Criação de novos usuários
- [ ] Edição de informações do usuário
- [ ] Atribuição/revogação de roles via GUI
- [ ] Busca e filtros por role
- [ ] Paginação de resultados
- [ ] Confirmação de ações críticas (delete, role change)

### 2. Gestão de Permissões Avançada
- [ ] Atribuição de permissões específicas (não apenas roles)
- [ ] Permissões por tabela/recurso
- [ ] Permissões temporárias (com data de expiração)
- [ ] Herança de permissões (role → permission)
- [ ] Visualização de quem tem qual permissão

---

## Backlog Futuro 📋

### 1. MFA (Multi-Factor Authentication)
**Descrição**: Implementar autenticação de dois fatores para usuários  
**Opções**:
- TOTP (Time-based One-Time Password) via Google Authenticator
- SMS 2FA
- Backup codes

**Complexidade**: Médio  
**Impacto**: Segurança crítica para produção

### 2. Social Login
- [ ] Login via Google OAuth
- [ ] Login via GitHub OAuth
- [ ] Mapeamento automático de usuários (primeiro login = criar usuário)

### 3. Auditoria Detalhada
- [ ] Tabela `audit_logs` para rastreamento de ações
- [ ] Log de logins (sucesso/falha, IP, user agent)
- [ ] Log de alterações de roles/permissões
- [ ] Log de acesso a dados sensíveis
- [ ] Dashboard de auditoria para admins
- [ ] Exportação de logs (CSV, JSON)

### 4. Gestão de Apps Conectados via GUI
- [ ] Dashboard para listar apps conectados
- [ ] Registrar novo app (gera client_id e client_secret)
- [ ] Ativar/desativar SSO por app
- [ ] Visualizar tokens gerados
- [ ] Revogar tokens específicos
- [ ] Configurar redirect_uri whitelist

### 5. Gestão de Sessões
- [ ] Listar sessões ativas do usuário
- [ ] Revogar sessões específicas (logout em outro dispositivo)
- [ ] Detecção de login suspeito
- [ ] Rate limiting em tentativas de login

### 6. Reset de Senha
- [ ] Email de reset com link seguro
- [ ] Validação de token de reset
- [ ] Atualização de senha
- [ ] Notificação de mudança de senha
- [ ] Histórico de senhas (prevenir reutilização)

### 7. Versionamento de Shared-lib
- [ ] Publicar no npm registry
- [ ] Semantic versioning
- [ ] CHANGELOG automático
- [ ] Deprecation warnings em releases

### 8. OAuth 2.0 para Apps Terceiros
- [ ] Implementar OAuth 2.0 server
- [ ] Authorization code flow
- [ ] Client credentials flow
- [ ] Token introspection endpoint

### 9. Integração com Serviços Externos
- [ ] Slack notifications para eventos críticos
- [ ] Email transacional (SendGrid ou similar)
- [ ] SMS para 2FA (Twilio)

### 10. Analytics
- [ ] Rastreamento de login success rate
- [ ] Tempo médio de autenticação
- [ ] Apps mais/menos utilizados
- [ ] Distribuição de roles

---

## Métricas de Qualidade

| Métrica | Status | Alvo |
|---------|--------|------|
| Test Coverage | 45% | 80% |
| Lighthouse Score | 92 | 95+ |
| Uptime SLA | 99.8% | 99.9% |
| Auth Latency | 180ms | <200ms |
| Token Validation | 0 failures | 0 |

---

## Dependências Críticas

- **Supabase**: Banco de dados e auth
- **React 18**: Framework frontend
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind + shadcn/ui**: Styling
- **Vercel**: Hosting

---

## Riscos Conhecidos

1. **Token Expiration**: Se projeto cliente não renovar token, SSO falha
   - Mitigação: Renovação automática no interceptor de requisição

2. **Shared-lib Breaking Changes**: Alterações quebram todos os projetos
   - Mitigação: Versionamento rigoroso e deprecation warnings

3. **RLS Misconfiguration**: Dados expostos se RLS não for correto
   - Mitigação: Code review obrigatório de migrações SQL

4. **Supabase Downtime**: Afeta ALL projects
   - Mitigação: Status page, alertas automáticos, failover planing

---

## Próximas Prioridades (Q2 2026)

1. Dashboard de Admin de Usuários (alta prioridade)
2. MFA implementation (alta prioridade)
3. Auditoria detalhada (média prioridade)
4. Reset de senha (média prioridade)

