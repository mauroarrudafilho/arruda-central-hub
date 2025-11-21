# 🎯 Guia SSO para Implementação em Módulos Externos

**Este é o documento que você deve seguir para implementar SSO nos projetos externos (Catalog Maker, Acordos, etc.)**

---

## 📋 Visão Geral

O Arruda Central Hub já está **perfeito** e funcionando. Ele:
- ✅ Gera tokens SSO quando usuário clica em módulos externos
- ✅ Envia token na URL como parâmetro: `?sso_token=TOKEN&from=arruda-hub`
- ✅ Redireciona para o módulo externo com o token

**O que VOCÊ precisa fazer** é implementar o código que:
1. Pega o token da URL
2. Valida o token com o Supabase
3. Salva no localStorage
4. **IMPORTANTE**: Envia o token automaticamente em TODAS as requisições ao Supabase

---

## 🚀 Implementação - Passo a Passo

### ⚠️ PONTO CRÍTICO: Cliente Supabase com Interceptor

**Este é o passo mais importante!** Sem isso, o SSO não funcionará.

Crie `src/lib/supabase.ts` com o interceptor:

```typescript
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
 * ⚠️ CRÍTICO: Este interceptor adiciona o token em TODAS as requisições
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

// ⚠️ INTERCEPTOR: Adiciona token SSO em TODAS as requisições
const originalFetch = supabase.rest.fetch;
supabase.rest.fetch = async (url, options = {}) => {
  const ssoToken = getSSOToken();
  
  const headers = new Headers(options.headers);
  if (ssoToken) {
    headers.set('x-sso-token', ssoToken); // ⚠️ Este header é enviado automaticamente
  }
  
  return originalFetch(url, {
    ...options,
    headers,
  });
};
```

**Por que isso é crítico?**
- Sem o interceptor, o token fica no localStorage mas não é enviado nas requisições
- As funções RPC do Supabase precisam receber o token no header `x-sso-token`
- Sem o header, você verá erros como "User not authenticated"

---

### 2. Criar Hook useSSO

Crie `src/hooks/useSSO.ts`:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Use o cliente configurado acima

const HUB_URL = 'https://arruda-central-hub.vercel.app/hub';

export interface SSOUser {
  id: string;
  email: string;
  name: string;
  projectId: string;
  projectSlug: string; // Ex: 'acordo-flow', 'arruda-catalog-maker'
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
  redirectToHub: () => void;
}

export const useSSO = (): UseSSOReturn => {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSSO();
  }, []);

  const redirectToHub = () => {
    window.location.href = HUB_URL;
  };

  const checkSSO = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar token na URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      if (ssoToken && fromHub) {
        console.log('🔑 Token SSO encontrado na URL, validando...');
        
        // 2. Validar token SSO (usando o cliente com interceptor)
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (validationError || !data || !data.length || !data[0].is_valid) {
          console.error('❌ Token SSO inválido:', validationError);
          setError('Token SSO inválido ou expirado');
          redirectToHub();
          return;
        }

        const sessionData = data[0];
        console.log('✅ Token SSO válido!', { 
          user: sessionData.user_email, 
          project: sessionData.project_name 
        });
        
        // 3. Criar objeto de usuário
        const ssoUser: SSOUser = {
          id: sessionData.user_id,
          email: sessionData.user_email,
          name: sessionData.user_name,
          projectId: sessionData.project_id,
          projectSlug: sessionData.project_slug, // Ex: 'acordo-flow'
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || [],
        };

        // 4. Salvar para persistência (12 horas)
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken); // ⚠️ Usado pelo interceptor
        localStorage.setItem('arruda_sso_expires', sessionData.expires_at);
        
        // 5. Limpar token da URL (segurança)
        window.history.replaceState({}, '', window.location.pathname);

        setUser(ssoUser);
        setAuthenticated(true);
        
      } else {
        // Verificar sessão salva no localStorage
        const savedUser = localStorage.getItem('arruda_sso_user');
        const savedToken = localStorage.getItem('arruda_sso_token');
        const savedExpires = localStorage.getItem('arruda_sso_expires');

        if (savedUser && savedToken && savedExpires) {
          const expiresAt = new Date(savedExpires);
          if (expiresAt > new Date()) {
            // Validar token novamente
            const { data: validationData, error: validationError } = await supabase.rpc('validate_sso_token', {
              _token: savedToken,
            });

            if (!validationError && validationData && validationData.length > 0 && validationData[0].is_valid) {
              const sessionData = validationData[0];
              setUser({
                id: sessionData.user_id,
                email: sessionData.user_email,
                name: sessionData.user_name,
                projectId: sessionData.project_id,
                projectSlug: sessionData.project_slug,
                projectName: sessionData.project_name,
                permissions: sessionData.permissions || [],
              });
              setAuthenticated(true);
              console.log('✅ Sessão restaurada do localStorage');
            } else {
              // Token inválido
              localStorage.removeItem('arruda_sso_user');
              localStorage.removeItem('arruda_sso_token');
              localStorage.removeItem('arruda_sso_expires');
              redirectToHub();
            }
          } else {
            // Sessão expirada
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
            redirectToHub();
          }
        } else {
          // Sem token - redirecionar para Hub
          redirectToHub();
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao verificar SSO:', err);
      setError(err.message || 'Erro ao autenticar');
      redirectToHub();
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, authenticated, error, redirectToHub };
};
```

---

### 3. Usar no App Principal

No seu `App.tsx` ou componente principal:

```typescript
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated, error } = useSSO();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!authenticated) {
    return <div>Redirecionando para o Hub Central...</div>;
  }

  // Usuário autenticado via SSO - pode usar o módulo
  return (
    <div>
      <h1>Bem-vindo, {user?.name}!</h1>
      {/* Seu app aqui */}
    </div>
  );
}
```

---

## ✅ Checklist de Implementação

- [ ] Criar `src/lib/supabase.ts` com interceptor SSO
- [ ] Criar `src/hooks/useSSO.ts` com validação de token
- [ ] Usar hook `useSSO()` no App principal
- [ ] Testar: token é salvo no localStorage?
- [ ] Testar: token é enviado nas requisições? (verificar Network tab)
- [ ] Testar: autenticação persiste entre navegações?
- [ ] Testar: logout limpa localStorage?

---

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar Token na URL
Quando o Hub redireciona, a URL deve ter:
```
?sso_token=TOKEN_AQUI&from=arruda-hub
```

### 2. Verificar Token no localStorage
Após validação, deve ter:
- `arruda_sso_user`: Dados do usuário
- `arruda_sso_token`: Token SSO
- `arruda_sso_expires`: Data de expiração

### 3. Verificar Token nas Requisições (CRÍTICO!)
No Network tab do DevTools, todas as requisições ao Supabase devem ter header:
```
x-sso-token: TOKEN_AQUI
```

**Se não tiver este header, o SSO não funcionará!**

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- **Guia Completo**: `docs/SSO_MODULE_INTEGRATION_GUIDE.md`
- **Solução Global**: `docs/SSO_GLOBAL_SOLUTION.md`
- **Exemplo de Código**: `examples/useSSO.ts`

---

## 🆘 Problemas Comuns

### "User not authenticated" em funções RPC
**Causa**: Token não está sendo enviado no header  
**Solução**: Verificar se o interceptor está funcionando (Network tab)

### Token válido mas autenticação não persiste
**Causa**: Cliente Supabase não está configurado globalmente  
**Solução**: Garantir que todos os componentes usam o mesmo cliente (`src/lib/supabase.ts`)

### Token expira mas usuário ainda está usando
**Causa**: Sem verificação de expiração  
**Solução**: O hook já faz isso automaticamente, verificar se está sendo usado

---

**Última atualização**: 05 de Fevereiro de 2025  
**Versão**: 2.0.0  
**Status**: Pronto para Implementação ✅

