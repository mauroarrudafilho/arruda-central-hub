# arruda-central-hub - Lições Aprendidas e Boas Práticas

## Lição 1: Mudanças no Token JWT Quebram TODO o Ecossistema

### O Problema

O token JWT é o contrato entre o hub e todos os 10+ projetos clientes. Qualquer mudança na estrutura do token impacta **todos os projetos simultaneamente**.

**Cenário de Risco Real**:
```typescript
// Versão anterior (todos os projetos esperam isso)
{
  sub: "user-id",
  email: "user@email.com",
  roles: ["USER"],
  exp: 1234567890
}

// Sua mudança: adicionar campo obrigatório
{
  sub: "user-id",
  email: "user@email.com",
  roles: ["USER"],
  department: "Vendas",  // NOVO CAMPO OBRIGATÓRIO
  exp: 1234567890
}

// Problema: Projeto antigo (arruda-flow-buddy) espera 'department'
// Valida com erro, usuário não consegue fazer login em TODOS os apps
```

### A Solução: Versionamento de Token

Sempre versionar tokens se mudanças forem necessárias:

```typescript
// Versão 1 (backward compatible)
{
  token_version: "1",  // Sempre incluir versão
  sub: "user-id",
  email: "user@email.com",
  roles: ["USER"],
  exp: 1234567890
}

// Versão 2 (breaking change)
{
  token_version: "2",
  sub: "user-id",
  email: "user@email.com",
  roles: ["USER"],
  department: "Vendas",  // Novo campo
  exp: 1234567890
}
```

No lado do cliente (em shared-lib):
```typescript
export function parseToken(token: string) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  
  switch(payload.token_version) {
    case "1":
      return parseV1Token(payload);
    case "2":
      return parseV2Token(payload);
    default:
      throw new Error(`Unknown token version: ${payload.token_version}`);
  }
}

// Suportar v1 e v2 simultaneamente por 2-3 releases
// Depois deprecar v1
```

### Checklist para Mudanças de Token

- [ ] Planejar versão de migration
- [ ] Comunicar com proprietários de TODOS os 10+ projetos
- [ ] Implementar suporte para versão anterior no hub
- [ ] Atualizar shared-lib para parsear ambas versões
- [ ] Período de transição (mínimo 2 releases)
- [ ] Testar com cada projeto integrado
- [ ] Documentar deprecation em CHANGELOG

---

## Lição 2: Shared-lib é o Coração do Ecossistema

### Por Que Shared-lib é Crítico

Shared-lib é consumida por TODOS os 10+ projetos:
- Validadores de JWT
- Definições de tipos (User, Role, Permission)
- Constantes de roles e permissions
- Utilitários de autenticação

Uma mudança em shared-lib quebra a cadeia inteira.

### Safe vs Risky Changes

#### Safe (sem quebra de compatibilidade)
```typescript
// Adicionar novo export/tipo
export interface Department {
  id: string;
  name: string;
}

// Adicionar novo validator
export function validateDepartment(dept: Department): boolean { ... }
```

#### Risky (requer versionamento)
```typescript
// Renomear export
export function validateJWT() { ... }
// Para
export function validateToken() { ... }  // QUEBRA TODOS OS IMPORTS

// Alterar assinatura de função
export function hasPermission(token, perm): boolean { ... }
// Para
export function hasPermission(token, perm, resource): boolean { ... }
// QUEBRA se algum projeto não passa resource
```

#### Dangerous (evitar ao máximo)
```typescript
// Remover export usado por muitos projetos
// export function parseToken(token) { ... }  // REMOVIDO
// Isso quebra TODOS os projetos que chamam parseToken()
```

### Processo de Mudança em Shared-lib

**Para mudanças SAFE** (adicionar código):
1. Fazer a mudança
2. Bumpar versão patch (1.0.1)
3. Deploy automático no Vercel
4. Projetos atuam np NPM quando prontos

**Para mudanças RISKY** (renomear, alterar assinatura):
1. **Release N**: Adicionar nova função/export
2. **Release N**: Marcar antiga como deprecated com warning
3. **Documentar** período de transição (ex. 2 releases)
4. **Release N+2**: Remover código deprecated
5. **Comunicar** a cada dono de projeto

**Exemplo de Deprecation**:
```typescript
// shared-lib/utils/token.ts

/**
 * @deprecated Use validateToken() instead
 * Will be removed in v2.0.0 (estimated: June 2026)
 */
export function validateJWT(token: string): boolean {
  console.warn('[shared-lib] validateJWT is deprecated. Use validateToken() instead.');
  return validateToken(token);
}

// Nova função com naming correto
export function validateToken(token: string): boolean { ... }
```

---

## Lição 3: RLS e Autenticação Multi-app

### O Desafio

Supabase RLS usa `auth.uid()` para validar acesso a dados. Mas em um ecossistema multi-app:
- Todos os apps compartilham a mesma instância Supabase
- Todos os apps usam tokens JWT assinados pelo hub
- RLS precisa saber qual `user_id` fazer validação

### Como Funciona

**No Hub** (arruda-central-hub):
```sql
-- Tabela de usuários
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- RLS: Usuário só vê seus próprios dados
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

**No App Externo** (arruda-flow-buddy):
```typescript
// Ao login, recebe JWT do hub com user_id
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
const payload = parseToken(token);
const userId = payload.sub;  // UUID do usuário

// Supabase automaticamente usa auth.uid() = userId
// Porque o token é assinado com chave do Supabase
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// RLS válida que o token é do mesmo usuário
const { data } = await supabase
  .from('finance_titulo_ajustes')
  .select('*');
// Query retorna APENAS dados onde criado_por = auth.uid()
```

### Configuração Correta de RLS

```sql
-- Tabela de dados financeiros
CREATE TABLE public.finance_titulo_ajustes (
  id UUID PRIMARY KEY,
  payment_id UUID NOT NULL,
  valor_original NUMERIC NOT NULL,
  valor_pago NUMERIC NOT NULL,
  criado_por UUID NOT NULL,  -- USER ID
  created_at TIMESTAMP DEFAULT now()
);

-- Ativar RLS (CRÍTICO!)
ALTER TABLE finance_titulo_ajustes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Usuário vê dados que criou
CREATE POLICY "Users read own data"
  ON finance_titulo_ajustes
  FOR SELECT
  USING (criado_por = auth.uid());

-- Policy 2: Usuário escreve apenas seus dados
CREATE POLICY "Users write own data"
  ON finance_titulo_ajustes
  FOR INSERT
  WITH CHECK (criado_por = auth.uid());

-- Policy 3: Admin consegue ver todos
CREATE POLICY "Admins can read all data"
  ON finance_titulo_ajustes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_roles
      WHERE user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );
```

### Testando RLS

```typescript
// Teste 1: Usuário vê dados dele
const user1Token = generateToken(user1Id, ["USER"]);
const supabase1 = createClient(URL, KEY, { headers: { Authorization: `Bearer ${user1Token}` }});
const { data } = await supabase1.from('finance_titulo_ajustes').select('*');
// Deve retornar APENAS dados onde criado_por = user1Id

// Teste 2: Usuário NÃO vê dados de outro
const user2Token = generateToken(user2Id, ["USER"]);
const supabase2 = createClient(URL, KEY, { headers: { Authorization: `Bearer ${user2Token}` }});
const { data } = await supabase2.from('finance_titulo_ajustes').select('*');
// Deve retornar APENAS dados onde criado_por = user2Id
// Dados de user1 não aparecem

// Teste 3: Admin vê todos
const adminToken = generateToken(adminId, ["ADMIN"]);
const supabaseAdmin = createClient(URL, KEY, { headers: { Authorization: `Bearer ${adminToken}` }});
const { data } = await supabaseAdmin.from('finance_titulo_ajustes').select('*');
// Deve retornar dados de TODOS os usuários
```

### Erros Comuns de RLS

❌ **Erro 1**: Esquecer `ENABLE ROW LEVEL SECURITY`
```sql
CREATE TABLE new_table (id UUID PRIMARY KEY);
-- RLS NÃO ATIVADO! Qualquer um consegue ler/escrever
```

✅ **Correto**:
```sql
CREATE TABLE new_table (id UUID PRIMARY KEY);
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
-- DEFAULT DENY ALL (seguro)
```

❌ **Erro 2**: Policy muito permissiva
```sql
-- Não fazer isso!
CREATE POLICY "Everyone can read" ON table FOR SELECT USING (true);
```

✅ **Correto**:
```sql
CREATE POLICY "Users read own data" ON table FOR SELECT
USING (user_id = auth.uid() OR is_public = true);
```

---

## Lição 4: Por Que Não Usar Auth0, Clerk ou Firebase Auth

### Decisão do Projeto

O arruda-central-hub usa **Supabase Auth** em vez de serviços terceiros. Por quê?

### Razões Técnicas

**1. Controle Total do Token**
- Com Supabase: Você assina o JWT, você controla os claims
- Com Auth0: Auth0 assina, você é limitado aos claims que Auth0 oferece
- Necessário: Adicionar campos customizados ao token (department, empresa, etc.)

**2. Custo Operacional**
- Supabase: Incluso no plano (sem custo extra por usuário)
- Auth0: $680/mês + $200/mês por 1000 usuários adicionais
- Com 5000+ usuários, Auth0 fica muito caro

**3. Integração com RLS**
- Supabase: Native integration - RLS usa `auth.uid()` automaticamente
- Auth0: Requer JWT customizado + lógica RLS manual
- Mais simples e menos bug-prone

**4. Ausência de Vendor Lock-in**
- Supabase: Pode migrar para outro backend (postgres puro)
- Auth0: Dados presos em Auth0, difícil migrar

### Trade-offs da Escolha

**Vantagens de usar Supabase Auth**:
- ✅ Controle total sobre estrutura de token
- ✅ Integração perfeita com RLS
- ✅ Sem custo por usuário
- ✅ Fácil migração se necessário
- ✅ Menos dependências externas

**Desvantagens**:
- ❌ Menos features prontas (ex: advanced analytics, anomaly detection)
- ❌ Menos suporte de terceiros (não tem integrações ricas)
- ❌ Admin dashboard menos polido
- ❌ Suporte técnico menor que Auth0

### Como a Escolha Impacta o Design

```typescript
// Com Auth0 (impossível fazer isso)
const token = {
  sub: "user123",
  email: "user@email.com",
  // Auth0 só oferece claims padrão, customização limitada
};

// Com Supabase (flexibilidade total)
const token = {
  sub: "user123",
  email: "user@email.com",
  roles: ["ADMIN", "MANAGER"],       // Custom claim
  department: "Financeiro",          // Custom claim
  empresa_id: "empresa456",          // Custom claim
  permissions: ["write:finance"],    // Custom claim
  // Você controla tudo
};
```

---

## Lição 5: Versionamento é Seu Amigo

### As Três Dimensões de Versionamento

**1. Versionamento de Token (JWT)**
```typescript
// Hash dos campos do token
token_version: "1"  // v1: sem department
token_version: "2"  // v2: com department
```

**2. Versionamento de Shared-lib (npm package)**
```json
{
  "name": "@arruda/shared-lib",
  "version": "1.0.0"  // Major.Minor.Patch
}
```

**3. Versionamento de API**
```
GET /api/v1/users/me     (stable)
GET /api/v2/users/me     (new, pode quebrar)
```

### Semantic Versioning

```
MAJOR.MINOR.PATCH
1.0.0

MAJOR: Breaking changes (ex: remover função)
MINOR: New features, backward compatible (ex: novo parameter opcional)
PATCH: Bug fixes (ex: corrigir erro em validator)
```

**Exemplos**:
```
1.0.0 → 1.0.1: Bug fix no parseToken() → PATCH
1.0.1 → 1.1.0: Novo função validateDepartment() → MINOR
1.1.0 → 2.0.0: Remover validateJWT() (deprecated) → MAJOR
```

---

## Lição 6: Comunicação Entre Equipes é Crítica

### Quando Você Precisa Comunicar

1. **Mudanças no token JWT**: Comunicar TODOS proprietários de apps
2. **Mudanças em shared-lib**: Comunicar quando breaking changes
3. **Downtime planejado**: Avisar com antecedência
4. **Deprecations**: Dar período de transição

### Template de Comunicação

```markdown
Subject: [IMPORTANTE] Mudança no Token JWT - Ação Necessária

Pessoal,

No dia 15/05/2026, vamos fazer uma mudança no token JWT gerado pelo
arruda-central-hub. Essa mudança é BREAKING CHANGE e afeta TODOS os
projetos que consomem SSO.

**O que muda**:
- Adicionamos campo 'department' no token
- Este campo é OBRIGATÓRIO a partir da v2

**O que vocês precisam fazer**:
1. Atualizar @arruda/shared-lib de 1.2.0 → 1.3.0
2. Testar login em dev environment
3. Fazer deploy para staging
4. Confirmar funcionamento
5. Deploy para produção

**Timeline**:
- 15/05: Lançamos v1.3.0 (suporta v1 e v2 de token)
- 22/05: Lançamos hub que gera v2 de token (com department)
- 29/05: Descontinuamos suporte v1 (todos devem estar em v1.3.0+)

**Perguntas?**:
Responda este email ou abra issue em #tech-leads no Slack

Obrigado,
@mauro (Tech Lead)
```

---

## Lição 7: Testes São Escudo

### O Que Testar em Autenticação

```typescript
// test/auth.spec.ts

describe('SSO Token Generation', () => {
  it('should generate valid JWT token', async () => {
    const user = { id: 'user123', email: 'user@email.com' };
    const token = generateToken(user);
    
    expect(token).toBeDefined();
    const payload = parseToken(token);
    expect(payload.sub).toBe('user123');
  });

  it('should respect token expiration', async () => {
    const token = generateToken(user, { expiresIn: '1s' });
    await sleep(1100);
    
    expect(() => validateToken(token)).toThrow();
  });

  it('should reject tampered token', async () => {
    const token = generateToken(user);
    const tampered = token.slice(0, -10) + '0000000000';
    
    expect(() => validateToken(tampered)).toThrow();
  });

  it('should include roles in token', async () => {
    const token = generateToken(user, { roles: ['ADMIN', 'USER'] });
    const payload = parseToken(token);
    
    expect(payload.roles).toEqual(['ADMIN', 'USER']);
  });
});

describe('RLS Integration', () => {
  it('should enforce RLS for regular user', async () => {
    const token = generateToken(user1, { roles: ['USER'] });
    const data = await queryWithToken(token);
    
    expect(data).toContainOnly(records => records.owner_id === user1.id);
  });

  it('should allow admin to see all data', async () => {
    const token = generateToken(adminUser, { roles: ['ADMIN'] });
    const data = await queryWithToken(token);
    
    expect(data.length).toBeGreaterThan(0); // Vê todos
  });
});
```

### Test Coverage Alvo

- Geração de token: 100%
- Validação de token: 100%
- RLS enforcement: 95%+
- Fluxo de login: 90%+
- Rotação de sessão: 85%+

---

## Checklist: Antes de Fazer Deploy

- [ ] Mudança quebraria outros projetos? Se sim, versionar
- [ ] Atualizou testes? Coverage > 80%
- [ ] Revisão de código por outro senior dev
- [ ] Verificou RLS em novas tabelas? (`ENABLE ROW LEVEL SECURITY`)
- [ ] Documentou no CHANGELOG
- [ ] Comunicou com donos de outros projetos se mudança é breaking
- [ ] Testou em staging por 24h
- [ ] Preparou rollback plan

---

## Referências Internas

- CLAUDE.md: Documentação técnica completa
- PROGRESS.md: Status de features
- /src/lib/sso-token-manager.ts: Implementação de token management
- /supabase/migrations/: Histórico de mudanças no banco

