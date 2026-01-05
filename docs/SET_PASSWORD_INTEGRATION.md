# Integração: Rota /set-password

## Visão Geral

A rota `/set-password` foi criada para centralizar o fluxo de definição de senha de novos usuários no Central Hub. O Reback cria os usuários e dispara esta rota para que os usuários possam definir suas senhas.

## Fluxo de Integração

### 1. Criação de Usuário no Reback

Quando o Reback cria um novo usuário, ele deve:

1. **Criar o usuário no Supabase** (via `create-user` Edge Function ou diretamente)
2. **Gerar um token de definição de senha** usando uma das opções abaixo
3. **Enviar email com link** contendo o token

### 2. Opções para Gerar Token

#### Opção A: Usar Tabela `password_setup_tokens` (Recomendado)

```sql
-- Chamar a função RPC para gerar token
SELECT * FROM public.generate_password_setup_token(
  p_user_id := 'uuid-do-usuario',
  p_expires_in_hours := 168, -- 7 dias
  p_metadata := '{"source": "reback", "project": "nome-projeto"}'::jsonb
);
```

Isso retorna:
- `token`: Token único para usar no link
- `expires_at`: Data de expiração
- `token_id`: ID do registro na tabela

#### Opção B: Armazenar em `user_metadata`

```typescript
// Ao criar o usuário, adicionar token em user_metadata
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'usuario@example.com',
  user_metadata: {
    nome: 'Nome do Usuário',
    password_setup_token: 'token-gerado-aqui',
    password_setup_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
});
```

### 3. Enviar Email com Link

O Reback deve enviar um email com um link no formato:

```
https://arruda-central-hub.vercel.app/set-password?token=TOKEN_GERADO
```

**Exemplo de email:**

```html
<h1>Bem-vindo ao Arruda Hub!</h1>
<p>Clique no link abaixo para criar sua senha:</p>
<a href="https://arruda-central-hub.vercel.app/set-password?token=abc123...">
  Criar Senha
</a>
<p>Este link expira em 7 dias.</p>
```

## Endpoint: Edge Function `set-password`

### Requisição

**URL:** `https://kgzybpelluftexrewyke.supabase.co/functions/v1/set-password`

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "token": "token-gerado-pelo-reback",
  "password": "SenhaSegura123!"
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Senha definida com sucesso",
  "userId": "uuid-do-usuario"
}
```

### Respostas de Erro

#### Token Inválido ou Expirado
```json
{
  "error": "Token inválido ou expirado"
}
```

#### Senha Não Atende Critérios
```json
{
  "error": "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial"
}
```

## Critérios de Senha

A senha deve atender aos seguintes critérios:

- ✅ Mínimo de 8 caracteres
- ✅ Pelo menos uma letra maiúscula (A-Z)
- ✅ Pelo menos uma letra minúscula (a-z)
- ✅ Pelo menos um número (0-9)
- ✅ Pelo menos um caractere especial (!@#$%^&*(),.?":{}|<>)

## Fluxo Completo

```
┌─────────┐
│ Reback  │
└────┬────┘
     │
     │ 1. Criar usuário no Supabase
     │
     ▼
┌─────────────────┐
│ Gerar Token     │
│ (via RPC ou     │
│  user_metadata) │
└────┬────────────┘
     │
     │ 2. Enviar email com link
     │
     ▼
┌─────────────┐
│   Usuário   │
│  (recebe    │
│   email)    │
└────┬────────┘
     │
     │ 3. Clica no link
     │
     ▼
┌──────────────────┐
│ /set-password    │
│ (Central Hub)    │
└────┬─────────────┘
     │
     │ 4. Define senha
     │
     ▼
┌──────────────────┐
│ Edge Function    │
│ set-password     │
└────┬─────────────┘
     │
     │ 5. Valida token
     │ 6. Atualiza senha
     │ 7. Ativa usuário
     │
     ▼
┌──────────────────┐
│ Redireciona para │
│ /auth (login)    │
└──────────────────┘
```

## Tabela: `password_setup_tokens`

A tabela `password_setup_tokens` armazena os tokens de forma centralizada:

```sql
CREATE TABLE password_setup_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### Funções Disponíveis

#### `generate_password_setup_token`

Gera um novo token para um usuário:

```sql
SELECT * FROM public.generate_password_setup_token(
  p_user_id := 'uuid-do-usuario',
  p_expires_in_hours := 168, -- 7 dias
  p_metadata := '{"source": "reback"}'::jsonb
);
```

#### `cleanup_expired_password_tokens`

Remove tokens expirados (útil para cron jobs):

```sql
SELECT public.cleanup_expired_password_tokens();
```

## Segurança

1. **Tokens são únicos** e não podem ser reutilizados
2. **Tokens expiram** após o período definido (padrão: 7 dias)
3. **Tokens são marcados como usados** após a definição da senha
4. **Acesso via RLS** - apenas service role pode acessar a tabela
5. **Validação de senha** no frontend e backend

## Exemplo de Implementação no Reback

```typescript
// 1. Criar usuário
const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'usuario@example.com',
  email_confirm: false, // Usuário precisa confirmar via link
  user_metadata: { nome: 'Nome do Usuário' }
});

// 2. Gerar token via RPC
const { data: tokenData, error: tokenError } = await supabaseAdmin
  .rpc('generate_password_setup_token', {
    p_user_id: user.user.id,
    p_expires_in_hours: 168,
    p_metadata: { source: 'reback', project: 'nome-projeto' }
  });

// 3. Enviar email
const setupUrl = `https://arruda-central-hub.vercel.app/set-password?token=${tokenData.token}`;
await sendEmail({
  to: user.user.email,
  subject: 'Bem-vindo ao Arruda Hub - Crie sua senha',
  html: `
    <h1>Bem-vindo!</h1>
    <p>Clique no link abaixo para criar sua senha:</p>
    <a href="${setupUrl}">Criar Senha</a>
    <p>Este link expira em 7 dias.</p>
  `
});
```

## Troubleshooting

### Token não encontrado

- Verificar se o token foi gerado corretamente
- Verificar se o token não expirou
- Verificar se o token não foi usado anteriormente

### Erro ao atualizar senha

- Verificar se o usuário existe no Supabase
- Verificar permissões da service role
- Verificar logs da Edge Function

### Token expirado

- Gerar um novo token para o usuário
- Verificar configuração de expiração (padrão: 7 dias)

## Notas Importantes

1. **O Central Hub é responsável por:**
   - Interface de definição de senha
   - Validação de critérios de senha
   - Atualização da senha no Supabase
   - Ativação do usuário
   - Redirecionamento para login

2. **O Reback é responsável por:**
   - Criação de usuários
   - Geração de tokens
   - Envio de emails com links

3. **Tokens são únicos e descartáveis** - após uso, não podem ser reutilizados

4. **A tabela `password_setup_tokens` é opcional** - a Edge Function também funciona com tokens em `user_metadata`

