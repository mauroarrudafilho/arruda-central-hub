# 🔧 Fix: Erro "User not authenticated" no Catalog Maker

## 📋 Problema Identificado

O front-end do **arruda-catalog-maker.vercel.app** está autenticando via SSO corretamente, mas as requisições subsequentes (como buscar métricas) falham com `Error: User not authenticated`.

### Causa Raiz

O token SSO está sendo salvo no `localStorage`, mas **não está sendo enviado** nas requisições subsequentes ao Supabase. O backend precisa do token para validar a autenticação.

---

## ✅ Solução: Configurar Cliente Supabase com Token SSO

### Passo 1: Criar Cliente Supabase com Interceptor

**Opção A: Usando Helper da Biblioteca Compartilhada (Recomendado)**

Se o módulo externo usa a biblioteca `@arruda/rbac-client`, use o helper:

```typescript
// src/lib/supabase.ts
import { createArrudaSSOClient } from '@arruda/rbac-client';

// Cliente Supabase pré-configurado para Arruda Hub com suporte SSO
export const supabase = createArrudaSSOClient();
```

**Opção B: Configuração Manual**

Se não usar a biblioteca compartilhada, configure manualmente:

```typescript
// src/lib/supabase.ts ou similar
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

// Função para obter token SSO do localStorage
const getSSOToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('arruda_sso_token');
};

// Criar cliente Supabase com interceptor dinâmico
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      // Token SSO será adicionado dinamicamente via interceptor
    },
  },
  auth: {
    persistSession: false, // Não usar sessão do Supabase Auth quando usando SSO
    autoRefreshToken: false,
  },
});

// Interceptor para adicionar token SSO em todas as requisições
const originalFetch = supabase.rest.fetch;
supabase.rest.fetch = async (url, options = {}) => {
  const ssoToken = getSSOToken();
  
  // Adicionar token SSO ao header se existir
  const headers = new Headers(options.headers);
  if (ssoToken) {
    headers.set('x-sso-token', ssoToken);
    console.log('[Supabase] Token SSO adicionado à requisição:', url);
  }
  
  return originalFetch(url, {
    ...options,
    headers,
  });
};
```

### Passo 2: Criar Função Helper para Validação SSO no Backend

Crie uma função RPC no Supabase que valida o token SSO a partir do header:

```sql
-- Migration: Função para validar SSO token de requisições
CREATE OR REPLACE FUNCTION public.get_sso_user_from_header()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token TEXT;
  _session RECORD;
BEGIN
  -- Obter token do header da requisição
  _token := current_setting('request.headers', true)::json->>'x-sso-token';
  
  IF _token IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE::BOOLEAN;
    RETURN;
  END IF;
  
  -- Buscar sessão válida
  SELECT 
    us.user_id,
    rap.email,
    rap.nome
  INTO _session
  FROM user_sessions us
  JOIN rbac_auth_profile rap ON rap.user_id = us.user_id
  WHERE us.session_token = _token
    AND us.expires_at > NOW()
    AND us.status = 'ativo';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE::BOOLEAN;
    RETURN;
  END IF;
  
  -- Retornar dados do usuário
  RETURN QUERY SELECT 
    _session.user_id,
    _session.email,
    _session.nome,
    TRUE::BOOLEAN;
END;
$$;

-- Permitir acesso anônimo (o token valida a autenticação)
GRANT EXECUTE ON FUNCTION public.get_sso_user_from_header() TO anon;
GRANT EXECUTE ON FUNCTION public.get_sso_user_from_header() TO authenticated;
```

### Passo 3: Atualizar Funções RPC para Usar Token SSO

Atualize as funções que precisam de autenticação para verificar o token SSO:

```sql
-- Exemplo: Função para buscar métricas
CREATE OR REPLACE FUNCTION public.get_user_metrics()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_id UUID;
BEGIN
  -- Tentar obter usuário do token SSO
  SELECT * INTO _sso_user
  FROM public.get_sso_user_from_header();
  
  -- Se não encontrou via SSO, tentar via Supabase Auth
  IF NOT _sso_user.is_valid THEN
    _user_id := auth.uid();
  ELSE
    _user_id := _sso_user.user_id;
  END IF;
  
  -- Se ainda não tem usuário, retornar erro
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Retornar métricas do usuário
  RETURN QUERY
  SELECT 
    m.name::TEXT,
    m.value,
    m.created_at
  FROM metrics m
  WHERE m.user_id = _user_id
  ORDER BY m.created_at DESC;
END;
$$;
```

### Passo 4: Atualizar Hook useSSO (Opcional - Melhoria)

Se o catalog-maker usa o hook `useSSO`, atualize para garantir que o token seja sempre enviado:

```typescript
// hooks/useSSO.ts
export const useSSO = () => {
  // ... código existente ...
  
  // Adicionar função para obter cliente Supabase configurado
  const getSupabaseClient = () => {
    const ssoToken = localStorage.getItem('arruda_sso_token');
    
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: ssoToken ? { 'x-sso-token': ssoToken } : {},
      },
      auth: {
        persistSession: false,
      },
    });
  };
  
  return {
    // ... outros retornos ...
    getSupabaseClient, // Exportar para uso em componentes
  };
};
```

---

## 🔍 Verificação

Após implementar, verifique:

1. **Console do navegador**: Deve mostrar `[Supabase] Token SSO adicionado à requisição` para cada chamada
2. **Network tab**: Verifique que o header `x-sso-token` está presente nas requisições
3. **Erro deve desaparecer**: `Error fetching metrics` não deve mais aparecer

---

## 📝 Notas Importantes

1. **Token SSO vs Supabase Auth**: Quando usando SSO, não use `supabase.auth` para autenticação. Use apenas o token SSO.

2. **Segurança**: O token SSO expira em 12 horas. Implemente renovação automática se necessário.

3. **Fallback**: As funções RPC devem ter fallback para `auth.uid()` caso o token SSO não esteja presente (para compatibilidade).

---

## 🚀 Próximos Passos

1. Implementar a configuração do Supabase client no catalog-maker
2. Criar a migration SQL para `get_sso_user_from_header()`
3. Atualizar funções RPC que precisam de autenticação
4. Testar no ambiente de produção

---

## ❓ Dúvidas?

Se o erro persistir após implementar:
1. Verifique se o token está sendo salvo corretamente no localStorage
2. Verifique se o header `x-sso-token` está sendo enviado (Network tab)
3. Verifique se a função `get_sso_user_from_header()` está retornando o usuário correto
4. Verifique os logs do Supabase para erros de RPC

