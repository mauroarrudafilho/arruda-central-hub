# 🎯 Guia SSO para Implementação em Módulos Externos

**Este é o documento que você deve seguir para implementar SSO nos projetos externos (Catalog Maker, Acordos, etc.)**

---

## 📋 Visão Geral

O Arruda Central Hub já está **perfeito** e funcionando. Ele:
- ✅ Gera tokens SSO quando usuário clica em módulos externos
- ✅ Envia token na URL como parâmetro: `?sso_token=TOKEN&from=arruda-hub`
- ✅ Redireciona para o módulo externo com o token

**O que VOCÊ precisa fazer** é implementar o código que:
1. Pega o token da URL (com decodificação e múltiplos nomes de parâmetro)
2. Valida o token com o Supabase (usando `_token` como parâmetro)
3. Salva no localStorage (`arruda_sso_user`, `arruda_sso_token`, `arruda_sso_expires`)
4. **CRÍTICO**: Configura cliente Supabase para desabilitar Auth quando SSO está ativo
5. **CRÍTICO**: Implementa interceptor que envia token em TODAS as requisições
6. Limpa o token da URL após processar (segurança)

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
 * Verifica se há SSO ativo (do localStorage ou URL)
 */
const hasSSOUser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('arruda_sso_user') || !!localStorage.getItem('arruda_sso_token');
};

const checkSSOInURL = (): boolean => {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return !!(urlParams.get('sso_token') || urlParams.get('token') || urlParams.get('ssoToken'));
};

const isSSOActive = hasSSOUser() || checkSSOInURL();

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
    persistSession: !isSSOActive, // ⚠️ Não persistir sessão quando SSO está ativo
    autoRefreshToken: !isSSOActive, // ⚠️ Desabilitar refresh token quando SSO está ativo
    detectSessionInUrl: !isSSOActive, // ⚠️ Não detectar sessão na URL quando SSO está ativo
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
- ✅ **SEM este interceptor, o token fica no localStorage mas NÃO é enviado nas requisições**
- ✅ **As funções RPC precisam receber o token no header `x-sso-token`**
- ✅ **Sem o header, você verá erros como "User not authenticated"**
- ✅ **O interceptor intercepta TODAS as requisições (RPC, queries, etc.)**
- ✅ **Adiciona o header `x-sso-token` automaticamente**

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

      // 1. Verificar token na URL (aceita múltiplos nomes de parâmetro)
      const urlParams = new URLSearchParams(window.location.search);
      const ssoTokenRaw = urlParams.get('sso_token') || urlParams.get('token') || urlParams.get('ssoToken');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      // Decodificar token (importante para caracteres especiais como +)
      let ssoToken = null;
      if (ssoTokenRaw) {
        try {
          ssoToken = decodeURIComponent(ssoTokenRaw).trim();
        } catch (e) {
          ssoToken = ssoTokenRaw.trim();
        }
      }

      if (ssoToken && fromHub) {
        console.log('🔑 Token SSO encontrado na URL, validando...');
        
        // 2. Validar token SSO (usando o cliente com interceptor)
        // ⚠️ IMPORTANTE: usar _token, não p_token
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken.trim(), // ⚠️ Sempre usar .trim() para remover espaços
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
              _token: savedToken.trim(), // ⚠️ Sempre usar .trim()
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

## ⚠️ Pontos Críticos (Não Pule Estes!)

### 1. Decodificação do Token é OBRIGATÓRIA
**Por quê:** Tokens podem ter caracteres especiais (ex: `+` vira espaço)  
**Solução:** Sempre usar `decodeURIComponent()` e `.trim()`

### 2. Aceitar Múltiplos Nomes de Parâmetro
**Por quê:** Compatibilidade com diferentes implementações  
**Solução:** Verificar `sso_token`, `token`, `ssoToken`

### 3. Parâmetro Correto na Função RPC
**Por quê:** A função espera `_token`, não `p_token`  
**Solução:** Sempre usar `_token: ssoToken.trim()`

### 4. Configuração do Cliente Supabase
**Por quê:** Evita conflitos entre Supabase Auth e SSO  
**Solução:** Desabilitar `persistSession`, `autoRefreshToken`, `detectSessionInUrl` quando SSO está ativo

### 5. Interceptor é OBRIGATÓRIO
**Por quê:** Sem ele, o token não é enviado e nada funciona  
**Solução:** Implementar interceptor em `src/lib/supabase.ts`

---

## 🆘 Problemas Comuns

### "User not authenticated" em funções RPC
**Causa**: Token não está sendo enviado no header  
**Solução**: Verificar se o interceptor está funcionando (Network tab)  
**Verificação**: Abra DevTools > Network > Requisição RPC > Headers > Deve ter `x-sso-token`

### Token válido mas autenticação não persiste
**Causa**: Cliente Supabase não está configurado globalmente  
**Solução**: Garantir que todos os componentes usam o mesmo cliente (`src/lib/supabase.ts`)

### Token expira mas usuário ainda está usando
**Causa**: Sem verificação de expiração  
**Solução**: O hook já faz isso automaticamente, verificar se está sendo usado

### Erro 400 na função RPC
**Causa**: Função não consegue ler o header ou token inválido  
**Solução**: Verificar tratamento de erros na função RPC e se o token está sendo enviado

### Token não é encontrado na URL
**Causa**: Token pode estar codificado ou com nome diferente  
**Solução**: Usar `decodeURIComponent()` e verificar múltiplos nomes (`sso_token`, `token`, `ssoToken`)

---

---

## 📝 Resumo das Melhorias Críticas (Baseado em Módulo Funcional)

### ✅ Melhorias Implementadas

1. **Decodificação de Token**
   - Usa `decodeURIComponent()` para tratar caracteres especiais
   - Aceita múltiplos nomes de parâmetro: `sso_token`, `token`, `ssoToken`
   - Remove espaços com `.trim()`

2. **Configuração do Cliente Supabase**
   - Verifica se SSO está ativo antes de configurar
   - Desabilita `persistSession`, `autoRefreshToken`, `detectSessionInUrl` quando SSO ativo
   - Evita conflitos entre Supabase Auth e SSO

3. **Validação do Token**
   - Sempre usa `.trim()` no token antes de validar
   - Usa parâmetro correto: `_token` (não `p_token`)

4. **Limpeza de URL**
   - Remove token da URL após processar (segurança)
   - Usa `window.history.replaceState()`

5. **Interceptor Melhorado**
   - Documentação mais clara sobre por que é crítico
   - Exemplos de verificação no Network tab

---

**Última atualização**: 21 de Novembro de 2025  
**Versão**: 2.1.0 (Baseado em implementação funcional do Arruda Catalog Maker)  
**Status**: Pronto para Implementação ✅  
**Testado em**: Arruda Catalog Maker (100% funcional)

