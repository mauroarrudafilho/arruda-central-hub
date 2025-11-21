# 🔐 Solução Global SSO - Arruda Central Hub

**Documento único e definitivo para implementação completa de SSO em módulos externos**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Problemas Identificados](#problemas-identificados)
3. [Solução Completa](#solução-completa)
4. [Implementação Passo a Passo](#implementação-passo-a-passo)
5. [Código Pronto para Usar](#código-pronto-para-usar)
6. [Backend - Funções RPC](#backend---funções-rpc)
7. [Troubleshooting](#troubleshooting)
8. [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 Visão Geral

Este documento fornece uma **solução completa e global** para todos os problemas relacionados ao SSO nos módulos externos do Arruda Central Hub, incluindo:

- ✅ Envio automático de token SSO em todas as requisições
- ✅ Validação de token entre telas e navegação
- ✅ Renovação automática de token antes de expirar
- ✅ Sincronização entre abas do navegador
- ✅ Tratamento de erros e estados offline
- ✅ Validação de expiração em tempo real

**Aplicável a qualquer módulo externo**, não apenas ao Catalog Maker.

---

## ⚠️ Problemas Identificados

### 1. Token SSO não é enviado em requisições subsequentes
**Sintoma**: `Error: User not authenticated` ao fazer chamadas RPC/API após autenticação inicial  
**Causa**: Token salvo no localStorage mas não enviado no header das requisições

### 2. Token não persiste entre navegação de telas
**Sintoma**: Usuário autenticado perde acesso ao navegar entre páginas  
**Causa**: Cliente Supabase não configurado globalmente

### 3. Token expira sem aviso
**Sintoma**: Usuário ativo é deslogado subitamente após 12 horas  
**Causa**: Sem verificação proativa de expiração

### 4. Falta sincronização entre abas
**Sintoma**: Logout em uma aba não afeta outras abas  
**Causa**: Sem listener para mudanças no localStorage

### 5. Erros silenciosos quando Supabase está offline
**Sintoma**: Aplicação fica em loading infinito  
**Causa**: Sem tratamento de erros de rede

### 6. Problemas de timezone na validação
**Sintoma**: Token válido considerado expirado (ou vice-versa)  
**Causa**: Comparação incorreta entre timestamps

---

## ✅ Solução Completa

A solução consiste em **3 componentes principais**:

1. **Cliente Supabase Configurado** - Envia token automaticamente em todas as requisições
2. **Hook useSSO Melhorado** - Gerencia autenticação, renovação e sincronização
3. **Funções RPC no Backend** - Valida token via header HTTP

---

## 🚀 Implementação Passo a Passo

### Passo 1: Instalar Dependências

```bash
npm install @supabase/supabase-js
# ou
yarn add @supabase/supabase-js
# ou
pnpm add @supabase/supabase-js
```

**Opcional**: Se usar a biblioteca compartilhada `@arruda/rbac-client`:

```bash
npm install @arruda/rbac-client
```

### Passo 2: Configurar Cliente Supabase Global

Crie `src/lib/supabase.ts`:

```typescript
import { createArrudaSSOClient } from '@arruda/rbac-client';

// Cliente Supabase pré-configurado com suporte SSO completo
export const supabase = createArrudaSSOClient();
```

**OU** se não usar a biblioteca compartilhada, use a configuração manual (veja [Código Pronto para Usar](#código-pronto-para-usar)).

### Passo 3: Implementar Hook useSSO Completo

Copie o hook completo de `examples/useSSO.ts` ou use a versão melhorada abaixo.

### Passo 4: Aplicar Migrations SQL

Execute as migrations no Supabase:
- `20250205000001_add_sso_header_validation.sql` (já criada)

### Passo 5: Atualizar Funções RPC

Atualize suas funções RPC para usar `get_sso_user_from_header()` (veja [Backend - Funções RPC](#backend---funções-rpc)).

---

## 💻 Código Pronto para Usar

### 1. Cliente Supabase com Interceptor SSO

**Opção A: Usando Biblioteca Compartilhada (Recomendado)**

```typescript
// src/lib/supabase.ts
import { createArrudaSSOClient } from '@arruda/rbac-client';

export const supabase = createArrudaSSOClient();
```

**Opção B: Configuração Manual Completa**

```typescript
// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

/**
 * Obtém token SSO do localStorage
 */
const getSSOToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('arruda_sso_token');
};

/**
 * Cliente Supabase configurado para enviar token SSO automaticamente
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {},
  },
  auth: {
    persistSession: false, // Não usar sessão Supabase Auth quando usando SSO
    autoRefreshToken: false,
  },
});

// Interceptor: adiciona token SSO em TODAS as requisições
const originalFetch = supabase.rest.fetch;
supabase.rest.fetch = async (url, options = {}) => {
  const ssoToken = getSSOToken();
  
  const headers = new Headers(options.headers);
  if (ssoToken) {
    headers.set('x-sso-token', ssoToken);
    if (process.env.NODE_ENV === 'development') {
      console.log('[SSO] Token adicionado à requisição:', url);
    }
  }
  
  return originalFetch(url, {
    ...options,
    headers,
  });
};
```

### 2. Hook useSSO Completo e Melhorado

```typescript
// src/hooks/useSSO.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const HUB_URL = 'https://arruda-central-hub.vercel.app/hub';

export interface SSOUser {
  id: string;
  email: string;
  name: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  permissions: Array<{
    permission: string;
    module: string;
    action: string;
    granted: boolean;
  }>;
}

interface UseSSOReturn {
  user: SSOUser | null;
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  hasSSOToken: boolean;
  redirectToHub: () => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useSSO = (options?: {
  onTokenExpiring?: (minutesLeft: number) => void;
  onTokenExpired?: () => void;
  redirectOnExpired?: boolean;
}): UseSSOReturn => {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSSOToken, setHasSSOToken] = useState(false);
  
  const expiryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Valida token SSO no servidor
   */
  const validateToken = useCallback(async (token: string): Promise<SSOUser | null> => {
    try {
      const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
        _token: token,
      });

      if (validationError) {
        console.error('[SSO] Erro ao validar token:', validationError);
        return null;
      }

      if (!data || data.length === 0 || !data[0].is_valid) {
        console.error('[SSO] Token inválido ou expirado');
        return null;
      }

      const sessionData = data[0];
      return {
        id: sessionData.user_id,
        email: sessionData.user_email,
        name: sessionData.user_name,
        projectId: sessionData.project_id,
        projectSlug: sessionData.project_slug,
        projectName: sessionData.project_name,
        permissions: sessionData.permissions || [],
      };
    } catch (err) {
      console.error('[SSO] Erro ao validar token:', err);
      return null;
    }
  }, []);

  /**
   * Verifica e renova token se necessário
   */
  const checkAndRefreshToken = useCallback(async () => {
    const expiresStr = localStorage.getItem('arruda_sso_expires');
    if (!expiresStr) return;

    const expiresAt = new Date(expiresStr);
    const now = new Date();
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

    // Se faltar menos de 30 minutos, tentar renovar
    if (minutesUntilExpiry < 30 && minutesUntilExpiry > 0) {
      console.log(`[SSO] Token expirando em ${Math.round(minutesUntilExpiry)} minutos, renovando...`);
      
      if (options?.onTokenExpiring) {
        options.onTokenExpiring(Math.round(minutesUntilExpiry));
      }

      // Tentar renovar token (chamar generate_sso_token novamente)
      // Nota: Isso requer que o módulo tenha acesso ao project_slug
      const projectSlug = localStorage.getItem('arruda_sso_project_slug');
      if (projectSlug) {
        try {
          // Redirecionar para Hub para renovar token
          // Ou implementar renovação direta se possível
          console.log('[SSO] Redirecionando para Hub para renovar token...');
          if (options?.redirectOnExpired !== false) {
            window.location.href = `${HUB_URL}?refresh_token=true`;
          }
        } catch (err) {
          console.error('[SSO] Erro ao renovar token:', err);
        }
      }
    }

    // Se token expirou
    if (minutesUntilExpiry <= 0) {
      console.warn('[SSO] Token expirado');
      if (options?.onTokenExpired) {
        options.onTokenExpired();
      }
      
      // Limpar dados e redirecionar
      localStorage.removeItem('arruda_sso_user');
      localStorage.removeItem('arruda_sso_token');
      localStorage.removeItem('arruda_sso_expires');
      setUser(null);
      setAuthenticated(false);
      setHasSSOToken(false);
      
      if (options?.redirectOnExpired !== false) {
        window.location.href = HUB_URL;
      }
    }
  }, [options]);

  /**
   * Verifica SSO na inicialização
   */
  const checkSSO = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar token na URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      if (ssoToken && fromHub) {
        console.log('[SSO] Token encontrado na URL, validando...');
        setHasSSOToken(true);

        // Validar token
        const ssoUser = await validateToken(ssoToken);
        
        if (!ssoUser) {
          setError('Token SSO inválido ou expirado');
          setHasSSOToken(false);
          return;
        }

        // Salvar dados
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken);
        localStorage.setItem('arruda_sso_project_slug', ssoUser.projectSlug);
        
        // Obter expires_at do token validado
        const { data } = await supabase.rpc('validate_sso_token', { _token: ssoToken });
        if (data && data[0]?.expires_at) {
          localStorage.setItem('arruda_sso_expires', data[0].expires_at);
        }

        setUser(ssoUser);
        setAuthenticated(true);
        setHasSSOToken(true);

        // Limpar token da URL (segurança)
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // 2. Verificar token salvo no localStorage
        const savedToken = localStorage.getItem('arruda_sso_token');
        const savedUser = localStorage.getItem('arruda_sso_user');
        const savedExpires = localStorage.getItem('arruda_sso_expires');

        if (savedToken && savedUser && savedExpires) {
          // Verificar se não expirou (comparação em UTC)
          const expiresAt = new Date(savedExpires);
          const now = new Date();
          
          if (expiresAt.getTime() > now.getTime()) {
            // Token ainda válido, revalidar no servidor
            const ssoUser = await validateToken(savedToken);
            
            if (ssoUser) {
              setUser(ssoUser);
              setAuthenticated(true);
              setHasSSOToken(true);
            } else {
              // Token inválido no servidor, limpar
              localStorage.removeItem('arruda_sso_user');
              localStorage.removeItem('arruda_sso_token');
              localStorage.removeItem('arruda_sso_expires');
            }
          } else {
            // Token expirado, limpar
            console.warn('[SSO] Token salvo expirado');
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
          }
        }
      }
    } catch (err: any) {
      console.error('[SSO] Erro ao verificar SSO:', err);
      setError(err.message || 'Erro ao verificar autenticação SSO');
      
      // Em caso de erro de rede, tentar usar cache se disponível
      const cachedUser = localStorage.getItem('arruda_sso_user');
      if (cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          setUser(user);
          setAuthenticated(true);
          console.warn('[SSO] Usando cache devido a erro de rede');
        } catch (parseErr) {
          // Cache inválido
        }
      }
    } finally {
      setLoading(false);
    }
  }, [validateToken]);

  /**
   * Renovar token manualmente
   */
  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('arruda_sso_token');
    if (!token) return;

    const ssoUser = await validateToken(token);
    if (ssoUser) {
      setUser(ssoUser);
      localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
    }
  }, [validateToken]);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    localStorage.removeItem('arruda_sso_user');
    localStorage.removeItem('arruda_sso_token');
    localStorage.removeItem('arruda_sso_expires');
    localStorage.removeItem('arruda_sso_project_slug');
    setUser(null);
    setAuthenticated(false);
    setHasSSOToken(false);
    window.location.href = HUB_URL;
  }, []);

  /**
   * Redirecionar para Hub
   */
  const redirectToHub = useCallback(() => {
    window.location.href = HUB_URL;
  }, []);

  // Efeito: Verificar SSO na montagem
  useEffect(() => {
    checkSSO();
  }, [checkSSO]);

  // Efeito: Verificar expiração periodicamente (a cada 5 minutos)
  useEffect(() => {
    if (authenticated && hasSSOToken) {
      // Verificar imediatamente
      checkAndRefreshToken();
      
      // Verificar a cada 5 minutos
      expiryCheckIntervalRef.current = setInterval(() => {
        checkAndRefreshToken();
      }, 5 * 60 * 1000);

      return () => {
        if (expiryCheckIntervalRef.current) {
          clearInterval(expiryCheckIntervalRef.current);
        }
      };
    }
  }, [authenticated, hasSSOToken, checkAndRefreshToken]);

  // Efeito: Sincronizar entre abas do navegador
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'arruda_sso_token') {
        if (!e.newValue) {
          // Token removido em outra aba = logout
          console.log('[SSO] Token removido em outra aba, fazendo logout...');
          setUser(null);
          setAuthenticated(false);
          setHasSSOToken(false);
        } else if (e.newValue !== e.oldValue) {
          // Token atualizado em outra aba = revalidar
          console.log('[SSO] Token atualizado em outra aba, revalidando...');
          checkSSO();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkSSO]);

  return {
    user,
    loading,
    authenticated,
    error,
    hasSSOToken,
    redirectToHub,
    logout,
    refreshToken,
  };
};
```

### 3. Uso no App.tsx

```typescript
// src/App.tsx
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated, error, hasSSOToken, logout } = useSSO({
    onTokenExpiring: (minutesLeft) => {
      console.warn(`Token SSO expirando em ${minutesLeft} minutos`);
      // Opcional: mostrar notificação ao usuário
    },
    onTokenExpired: () => {
      console.warn('Token SSO expirado');
      // Opcional: mostrar mensagem e redirecionar
    },
  });

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!authenticated) {
    // Se não autenticado e não tem token SSO, pode mostrar login próprio
    // ou redirecionar para Hub
    return <LoginScreen />;
  }

  // Usuário autenticado via SSO
  return (
    <YourApp 
      user={user} 
      isSSO={hasSSOToken}
      onLogout={logout}
    />
  );
}
```

---

## 🔧 Backend - Funções RPC

### 1. Função para Obter Usuário do Header (Já Criada)

A migration `20250205000001_add_sso_header_validation.sql` já cria a função `get_sso_user_from_header()`.

### 2. Atualizar Funções RPC Existentes

Atualize suas funções RPC para usar o token SSO:

```sql
-- Exemplo: Função que precisa de autenticação
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
  -- Tentar obter usuário do token SSO primeiro
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

---

## 🔍 Troubleshooting

### Problema: "User not authenticated" em requisições

**Solução**:
1. Verificar se cliente Supabase está configurado com interceptor (veja [Código Pronto para Usar](#1-cliente-supabase-com-interceptor-sso))
2. Verificar se header `x-sso-token` está sendo enviado (Network tab do DevTools)
3. Verificar se função RPC usa `get_sso_user_from_header()`

### Problema: Token não persiste entre telas

**Solução**:
1. Garantir que cliente Supabase é criado uma única vez e exportado
2. Não criar novo cliente em cada componente
3. Usar o mesmo cliente em toda a aplicação

### Problema: Token expira sem aviso

**Solução**:
1. Usar hook `useSSO` completo que verifica expiração periodicamente
2. Implementar callback `onTokenExpiring` para notificar usuário

### Problema: Logout em uma aba não afeta outras

**Solução**:
1. Hook `useSSO` já inclui listener para `storage` event
2. Garantir que logout limpa `localStorage` (já implementado)

---

## ✅ Checklist de Implementação

Para cada módulo externo, verifique:

### Frontend

- [ ] Cliente Supabase configurado com interceptor SSO
- [ ] Hook `useSSO` implementado e usado no App
- [ ] Token sendo enviado em requisições (verificar Network tab)
- [ ] Verificação de expiração funcionando
- [ ] Sincronização entre abas funcionando
- [ ] Tratamento de erros implementado

### Backend

- [ ] Migration `20250205000001_add_sso_header_validation.sql` aplicada
- [ ] Funções RPC atualizadas para usar `get_sso_user_from_header()`
- [ ] Fallback para `auth.uid()` quando não há token SSO

### Testes

- [ ] Autenticação via SSO funciona
- [ ] Requisições subsequentes funcionam
- [ ] Navegação entre telas mantém autenticação
- [ ] Token expira e redireciona corretamente
- [ ] Logout funciona e limpa dados
- [ ] Sincronização entre abas funciona

---

## 📚 Referências

- **Biblioteca Compartilhada**: `shared-lib/src/supabase/createSSOClient.ts`
- **Exemplo Completo**: `examples/useSSO.ts`
- **Migration SQL**: `supabase/migrations/20250205000001_add_sso_header_validation.sql`
- **Documentação API**: `docs/SSO_ENDPOINTS_API_REFERENCE.md`

---

**Última atualização**: 05 de Fevereiro de 2025  
**Versão**: 2.0.0 - Solução Global Completa  
**Status**: Produção ✅

