# 📡 Documento Oficial - API de Endpoints SSO
## Arruda Central Hub - Referência Técnica de Integração

**Versão:** 1.1.0  
**Data:** 05 de Fevereiro de 2025  
**Status:** Produção

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Base](#configuração-base)
3. [Endpoint: Validar Token SSO](#endpoint-validar-token-sso)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Códigos de Erro](#códigos-de-erro)
6. [Exemplos de Implementação](#exemplos-de-implementação)
7. [Segurança e Boas Práticas](#segurança-e-boas-práticas)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este documento descreve os endpoints necessários para que um módulo externo receba e valide tokens SSO do Arruda Central Hub, permitindo autenticação automática de usuários sem necessidade de login e senha.

### Fluxo de Autenticação SSO

```
┌─────────────────┐
│  Hub Central    │
│  (Gera Token)   │
└────────┬────────┘
         │
         │ Redireciona com token na URL
         │ ?sso_token=TOKEN&from=arruda-hub
         ▼
┌─────────────────┐
│  Módulo Externo │
│  (Valida Token) │
└────────┬────────┘
         │
         │ Chama validate_sso_token
         ▼
┌─────────────────┐
│   Supabase RPC  │
│  (Validação)    │
└────────┬────────┘
         │
         │ Retorna dados do usuário
         ▼
┌─────────────────┐
│  Módulo Externo │
│  (Autentica)    │
└─────────────────┘
```

---

## ⚙️ Configuração Base

### Credenciais Supabase

Antes de usar os endpoints, configure o cliente Supabase com as seguintes credenciais:

```typescript
const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';
```

### Instalação do Cliente

```bash
npm install @supabase/supabase-js
# ou
yarn add @supabase/supabase-js
# ou
pnpm add @supabase/supabase-js
```

### Configuração do Cliente

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## 🔐 Endpoint: Validar Token SSO

### Informações Gerais

| Propriedade | Valor |
|------------|-------|
| **Método** | RPC (Remote Procedure Call) |
| **Função** | `validate_sso_token` |
| **Autenticação** | Não requerida (usa token SSO) |
| **Rate Limit** | Sem limite específico |
| **Timeout** | 30 segundos |

### URL Base

```
https://kgzybpelluftexrewyke.supabase.co/rest/v1/rpc/validate_sso_token
```

### Chamada via Cliente Supabase

```typescript
const { data, error } = await supabase.rpc('validate_sso_token', {
  _token: 'SEU_TOKEN_AQUI'
});
```

### Parâmetros de Entrada

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `_token` | `string` | ✅ Sim | Token SSO recebido na URL (parâmetro `sso_token`) |

### Formato do Token

- **Tipo**: Base64 string
- **Tamanho**: ~44 caracteres
- **Validade**: 12 horas
- **Origem**: Gerado pelo Hub Central via função `generate_sso_token`

### Exemplo de Requisição

```typescript
// Extrair token da URL
const urlParams = new URLSearchParams(window.location.search);
const ssoToken = urlParams.get('sso_token');

// Validar token
const { data, error } = await supabase.rpc('validate_sso_token', {
  _token: ssoToken
});
```

### Resposta de Sucesso

**Status HTTP:** `200 OK`

**Estrutura da Resposta:**

```typescript
{
  data: [
    {
      is_valid: true,
      user_id: "d54b7209-887c-413f-b203-d4dd156c584f",
      user_email: "usuario@exemplo.com",
      user_name: "João Silva",
      project_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      project_slug: "acordo-flow",
      project_name: "Acordos Comerciais",
      expires_at: "2025-11-15T23:59:59.000Z",
      permissions: [
        {
          permission: "Visualizar Acordos",
          module: "acordos",
          action: "read",
          granted: true
        },
        {
          permission: "Criar Acordos",
          module: "acordos",
          action: "create",
          granted: true
        }
      ]
    }
  ],
  error: null
}
```

### Resposta de Erro (Token Inválido)

**Status HTTP:** `200 OK` (função retorna, mas `is_valid: false`)

**Estrutura da Resposta:**

```typescript
{
  data: [
    {
      is_valid: false,
      user_id: null,
      user_email: null,
      user_name: null,
      project_id: null,
      project_slug: null,
      project_name: null,
      expires_at: null,
      permissions: []
    }
  ],
  error: null
}
```

### Resposta de Erro (Erro de Conexão)

**Status HTTP:** `500 Internal Server Error` ou `400 Bad Request`

**Estrutura da Resposta:**

```typescript
{
  data: null,
  error: {
    message: "Erro ao validar token SSO: ...",
    code: "PGRST301",
    details: "...",
    hint: "..."
  }
}
```

---

## 📊 Estrutura de Dados

### Interface TypeScript Completa

```typescript
interface ValidateSSOTokenResponse {
  is_valid: boolean;
  user_id: string | null;           // UUID do usuário
  user_email: string | null;        // Email do usuário
  user_name: string | null;         // Nome completo do usuário
  project_id: string | null;        // UUID do projeto
  project_slug: string | null;      // Slug do projeto (ex: "acordo-flow")
  project_name: string | null;      // Nome do projeto (ex: "Acordos Comerciais")
  expires_at: string | null;        // ISO 8601 timestamp de expiração
  permissions: Permission[];        // Array de permissões (vazio se inválido)
}

interface Permission {
  permission: string;               // Nome da permissão
  module: string;                   // Módulo da permissão
  action: string;                   // Ação permitida (read, create, update, delete)
  granted: boolean;                 // Sempre true quando retornado
}
```

### Objeto de Usuário (Recomendado)

Após validar o token, crie um objeto de usuário padronizado:

```typescript
interface SSOUser {
  id: string;                       // user_id
  email: string;                     // user_email
  name: string;                      // user_name
  projectId: string;                 // project_id
  projectSlug: string;               // project_slug
  projectName: string;               // project_name
  permissions: Permission[];          // permissions
  expiresAt: string;                 // expires_at
}

// Função de conversão
function createSSOUser(response: ValidateSSOTokenResponse): SSOUser | null {
  if (!response.is_valid || !response.user_id) {
    return null;
  }

  return {
    id: response.user_id,
    email: response.user_email || '',
    name: response.user_name || '',
    projectId: response.project_id || '',
    projectSlug: response.project_slug || '',
    projectName: response.project_name || '',
    permissions: response.permissions || [],
    expiresAt: response.expires_at || ''
  };
}
```

---

## ❌ Códigos de Erro

### Erros Comuns e Soluções

| Código | Descrição | Causa | Solução |
|--------|-----------|-------|---------|
| `PGRST301` | Função não encontrada | Função `validate_sso_token` não existe | Verificar se migração foi aplicada |
| `PGRST116` | Parâmetro inválido | Token não fornecido ou formato incorreto | Verificar se token está na URL |
| `23505` | Violação de constraint única | Erro interno do banco | Contatar suporte |
| `42501` | Permissão negada | Problema de segurança | Verificar credenciais Supabase |
| `Token inválido` | `is_valid: false` | Token expirado ou não existe | Gerar novo token no Hub |

### Tratamento de Erros Recomendado

```typescript
async function validateToken(token: string) {
  try {
    const { data, error } = await supabase.rpc('validate_sso_token', {
      _token: token
    });

    if (error) {
      // Erro de conexão ou função
      console.error('Erro ao validar token:', error);
      throw new Error(`Erro de validação: ${error.message}`);
    }

    if (!data || data.length === 0) {
      // Resposta vazia
      throw new Error('Resposta inválida do servidor');
    }

    const response = data[0];

    if (!response.is_valid) {
      // Token inválido ou expirado
      throw new Error('Token SSO inválido ou expirado');
    }

    return response;
  } catch (err) {
    console.error('Erro ao validar token SSO:', err);
    throw err;
  }
}
```

---

## 💻 Exemplos de Implementação

### Exemplo 1: Validação Básica

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kgzybpelluftexrewyke.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

async function checkSSO() {
  // 1. Extrair token da URL
  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('sso_token');
  const fromHub = urlParams.get('from') === 'arruda-hub';

  if (!ssoToken || !fromHub) {
    console.log('Sem token SSO na URL');
    return null;
  }

  // 2. Validar token
  const { data, error } = await supabase.rpc('validate_sso_token', {
    _token: ssoToken
  });

  if (error) {
    console.error('Erro:', error);
    return null;
  }

  if (!data || data.length === 0 || !data[0].is_valid) {
    console.error('Token inválido');
    return null;
  }

  // 3. Retornar dados do usuário
  return data[0];
}

// Uso
const userData = await checkSSO();
if (userData) {
  console.log('Usuário autenticado:', userData.user_email);
}
```

### Exemplo 2: Hook React Completo

```typescript
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface SSOUser {
  id: string;
  email: string;
  name: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  permissions: any[];
}

export function useSSO() {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validateSSO() {
      try {
        setLoading(true);
        setError(null);

        // Extrair token da URL
        const urlParams = new URLSearchParams(window.location.search);
        const ssoToken = urlParams.get('sso_token');
        const fromHub = urlParams.get('from') === 'arruda-hub';

        if (!ssoToken || !fromHub) {
          setLoading(false);
          return;
        }

        // Validar token
        const { data, error: validationError } = await supabase.rpc(
          'validate_sso_token',
          { _token: ssoToken }
        );

        if (validationError) {
          throw new Error(validationError.message);
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
          throw new Error('Token inválido ou expirado');
        }

        const sessionData = data[0];

        // Criar objeto de usuário
        const ssoUser: SSOUser = {
          id: sessionData.user_id,
          email: sessionData.user_email,
          name: sessionData.user_name,
          projectId: sessionData.project_id,
          projectSlug: sessionData.project_slug,
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || []
        };

        setUser(ssoUser);

        // Limpar token da URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (err: any) {
        setError(err.message || 'Erro ao validar SSO');
      } finally {
        setLoading(false);
      }
    }

    validateSSO();
  }, []);

  return { user, loading, error };
}
```

### Exemplo 3: Validação com Retry

```typescript
async function validateTokenWithRetry(
  token: string,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc('validate_sso_token', {
        _token: token
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error('Resposta vazia');
      }

      if (!data[0].is_valid) {
        throw new Error('Token inválido');
      }

      return data[0];
    } catch (err: any) {
      lastError = err;
      
      if (attempt < maxRetries) {
        // Aguardar antes de tentar novamente (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error('Falha ao validar token após múltiplas tentativas');
}
```

### Exemplo 4: Validação com Cache Local

```typescript
interface CachedSession {
  user: SSOUser;
  token: string;
  expiresAt: string;
  validatedAt: string;
}

async function validateTokenWithCache(token: string): Promise<SSOUser | null> {
  // Verificar cache local
  const cached = localStorage.getItem('sso_session');
  if (cached) {
    try {
      const session: CachedSession = JSON.parse(cached);
      
      // Verificar se não expirou
      if (new Date(session.expiresAt) > new Date()) {
        // Validar novamente para garantir
        const { data, error } = await supabase.rpc('validate_sso_token', {
          _token: session.token
        });

        if (!error && data && data[0]?.is_valid) {
          return session.user;
        }
      }

      // Cache inválido, limpar
      localStorage.removeItem('sso_session');
    } catch (err) {
      localStorage.removeItem('sso_session');
    }
  }

  // Validar token
  const { data, error } = await supabase.rpc('validate_sso_token', {
    _token: token
  });

  if (error || !data || !data[0]?.is_valid) {
    return null;
  }

  const sessionData = data[0];
  const user: SSOUser = {
    id: sessionData.user_id,
    email: sessionData.user_email,
    name: sessionData.user_name,
    projectId: sessionData.project_id,
    projectSlug: sessionData.project_slug,
    projectName: sessionData.project_name,
    permissions: sessionData.permissions || []
  };

  // Salvar no cache
  const cache: CachedSession = {
    user,
    token,
    expiresAt: sessionData.expires_at,
    validatedAt: new Date().toISOString()
  };

  localStorage.setItem('sso_session', JSON.stringify(cache));

  return user;
}
```

---

## 🔒 Segurança e Boas Práticas

### 1. Remover Token da URL Após Validação

```typescript
// Após validar com sucesso
window.history.replaceState({}, '', window.location.pathname);
```

### 2. Validar Token em Cada Requisição Crítica

```typescript
async function makeAuthenticatedRequest(endpoint: string) {
  const token = localStorage.getItem('sso_token');
  
  if (!token) {
    throw new Error('Token não encontrado');
  }

  // Revalidar token antes de requisição crítica
  const { data } = await supabase.rpc('validate_sso_token', {
    _token: token
  });

  if (!data || !data[0]?.is_valid) {
    // Token expirado, redirecionar para Hub
    window.location.href = 'https://arruda-central-hub.vercel.app/hub';
    return;
  }

  // Fazer requisição autenticada
  // ...
}
```

### 3. Verificar Expiração do Token

```typescript
function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

// Verificar antes de usar
if (isTokenExpired(user.expiresAt)) {
  // Token expirado, validar novamente ou redirecionar
}
```

### 4. Implementar Logout Seguro

```typescript
function logout() {
  // Limpar dados locais
  localStorage.removeItem('arruda_sso_user');
  localStorage.removeItem('arruda_sso_token');
  localStorage.removeItem('arruda_sso_expires');
  
  // Redirecionar para Hub
  window.location.href = 'https://arruda-central-hub.vercel.app/auth';
}
```

### 5. Validar Permissões

```typescript
function hasPermission(
  user: SSOUser,
  module: string,
  action: string
): boolean {
  return user.permissions.some(
    p => p.module === module && p.action === action && p.granted
  );
}

// Uso
if (!hasPermission(user, 'acordos', 'create')) {
  // Negar acesso
}
```

---

## 🔍 Troubleshooting

### Problema 1: Token não encontrado na URL

**Sintomas:**
- `sso_token` não está presente na URL
- `from` não é `arruda-hub`

**Soluções:**
1. Verificar se usuário veio do Hub Central
2. Verificar se Hub está gerando token corretamente
3. Permitir acesso direto se não houver SSO

### Problema 2: Token inválido ou expirado

**Sintomas:**
- `is_valid: false` na resposta
- Erro "Token SSO inválido ou expirado"

**Soluções:**
1. Verificar se token não expirou (12 horas)
2. Verificar se token está correto na URL
3. Gerar novo token no Hub

### Problema 3: Erro de conexão com Supabase

**Sintomas:**
- Erro `PGRST301` ou similar
- Timeout na requisição

**Soluções:**
1. Verificar credenciais Supabase
2. Verificar conexão de rede
3. Verificar se função existe no banco
4. Implementar retry com backoff

### Problema 4: Permissões vazias

**Sintomas:**
- `permissions: []` na resposta
- Usuário não tem permissões

**Soluções:**
1. Verificar se usuário tem roles atribuídos
2. Verificar se roles têm permissões
3. Verificar estrutura RBAC no banco

### Checklist de Debug

```typescript
// 1. Verificar token na URL
console.log('Token na URL:', urlParams.get('sso_token'));
console.log('From Hub:', urlParams.get('from'));

// 2. Verificar resposta da validação
const { data, error } = await supabase.rpc('validate_sso_token', {
  _token: token
});
console.log('Resposta:', data);
console.log('Erro:', error);

// 3. Verificar dados do usuário
if (data && data[0]) {
  console.log('Usuário:', data[0].user_email);
  console.log('Projeto:', data[0].project_name);
  console.log('Permissões:', data[0].permissions);
  console.log('Expira em:', data[0].expires_at);
}
```

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- **Guia Completo SSO**: `docs/SSO_COMPLETE_GUIDE.md`
- **Guia de Integração**: `docs/SSO_MODULE_INTEGRATION_GUIDE.md`
- **Exemplos de Código**: `examples/useSSO.ts`

### URLs Importantes

- **Hub Central**: `https://arruda-central-hub.vercel.app/hub`
- **Login Hub**: `https://arruda-central-hub.vercel.app/auth`
- **Supabase Dashboard**: `https://supabase.com/dashboard`

### Suporte

Para problemas técnicos ou dúvidas sobre integração:
1. Verificar logs do console do navegador
2. Verificar logs do Supabase
3. Consultar documentação relacionada
4. Contatar equipe do Hub Central

---

## 📋 Projetos Cadastrados e Slugs

### Lista Completa de Projetos

Abaixo está a lista completa de projetos cadastrados no sistema com seus respectivos slugs que devem ser usados na função `generate_sso_token`:

| # | Nome do Projeto | Slug | URL Vercel | Status |
|---|----------------|------|------------|--------|
| 1 | **Acordos Comerciais** | `acordo-flow` | https://acordo-flow.vercel.app | ✅ Ativo |
| 2 | **Comercial+** | `arruda-sales-boost` | https://arruda-sales-boost.vercel.app | ✅ Ativo |
| 3 | **Financeiro** | `arruda-flow-buddy` | https://arruda-flow-buddy.vercel.app/ | ✅ Ativo |
| 4 | **Gestão de Usuários** | `arruda-rbac-master` | https://arruda-rbac-master.vercel.app/auth | ✅ Ativo |
| 5 | **Meus Documentos** | `nfe-radar` | https://nfe-radar.vercel.app/auth | ✅ Ativo |
| 6 | **Meus Produtos** | `arruda-catalog-maker` | https://arruda-catalog-maker.vercel.app | ✅ Ativo |
| 7 | **Trade Marketing** | `degusta-go-app` | https://degusta-go.vercel.app/ | ✅ Ativo |

### ⚠️ Importante sobre Slugs

- **Os slugs devem corresponder exatamente aos nomes dos projetos no Vercel**
- **Use o slug correto ao chamar `generate_sso_token` no Hub Central**
- **Slugs são case-sensitive e devem ser escritos exatamente como na tabela acima**

### Exemplo de Uso

```typescript
// No Hub Central, ao gerar token SSO para "Acordos Comerciais"
const { data, error } = await supabase.rpc('generate_sso_token', {
  _project_slug: 'acordo-flow' // ✅ Slug correto
});

// ❌ NÃO use: 'acordos' ou 'acordos-comerciais'
```

---

## 📝 Changelog

### Versão 1.1.0 (05/02/2025)
- Atualizada lista de projetos e slugs
- Slugs atualizados para corresponder aos nomes dos projetos no Vercel
- Adicionada seção de referência de projetos cadastrados

### Versão 1.0.0 (15/11/2025)
- Documentação inicial
- Endpoint `validate_sso_token` documentado
- Exemplos de implementação adicionados
- Guia de troubleshooting criado

---

**Última atualização:** 05 de Fevereiro de 2025  
**Mantido por:** Equipe Arruda Central Hub  
**Status:** Produção ✅

