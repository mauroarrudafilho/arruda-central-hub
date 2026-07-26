# 🔧 Correção: Redirecionamento do Módulo de Acordos

## 🐛 Problema Identificado

O módulo de Acordos está redirecionando de volta para o Hub quando recebe o token SSO. Isso acontece porque:

1. **Token não está sendo decodificado corretamente** - caracteres especiais como `+` viram espaço
2. **Token não está sendo "trimmed"** - espaços extras causam falha na validação
3. **Redirecionamento muito agressivo** - redireciona mesmo quando deveria permitir acesso direto

---

## ✅ Solução: Código Corrigido para `useSSO.ts`

**Copie este código completo para o módulo de Acordos:**

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // ⚠️ Use o cliente com interceptor

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
  redirectToHub: () => void;
  hasSSOToken: boolean;
}

export const useSSO = (): UseSSOReturn => {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSSOToken, setHasSSOToken] = useState(false);

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

      // ⚠️ CRÍTICO: Verificar token na URL com decodificação e múltiplos nomes
      const urlParams = new URLSearchParams(window.location.search);
      const ssoTokenRaw = urlParams.get('sso_token') || 
                         urlParams.get('token') || 
                         urlParams.get('ssoToken');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      // ⚠️ CRÍTICO: Decodificar token (caracteres especiais como + viram espaço sem isso)
      let ssoToken: string | null = null;
      if (ssoTokenRaw) {
        try {
          ssoToken = decodeURIComponent(ssoTokenRaw).trim();
        } catch (e) {
          // Se falhar decodificação, usar direto mas sempre trim
          ssoToken = ssoTokenRaw.trim();
        }
      }

      console.log('🔍 [SSO Debug]', {
        hasToken: !!ssoToken,
        tokenLength: ssoToken?.length,
        fromHub,
        rawToken: ssoTokenRaw?.substring(0, 20) + '...',
        decodedToken: ssoToken?.substring(0, 20) + '...',
      });

      if (ssoToken && fromHub) {
        console.log('🔑 Token SSO encontrado na URL, validando...');
        setHasSSOToken(true);
        
        // ⚠️ CRÍTICO: Validar token SSO com parâmetro correto (_token, não p_token)
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken, // ⚠️ Já foi trimado acima
        });

        console.log('🔍 [SSO Validation]', {
          hasError: !!validationError,
          error: validationError,
          hasData: !!data,
          dataLength: data?.length,
          isValid: data?.[0]?.is_valid,
        });

        if (validationError) {
          console.error('❌ Erro ao validar token SSO:', validationError);
          setError('Erro ao validar token SSO: ' + validationError.message);
          setHasSSOToken(false);
          // ⚠️ NÃO redireciona - permite acesso direto se SSO falhar
          setLoading(false);
          return;
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
          console.error('❌ Token SSO inválido ou expirado', {
            hasData: !!data,
            dataLength: data?.length,
            isValid: data?.[0]?.is_valid,
          });
          setError('Token SSO inválido ou expirado');
          setHasSSOToken(false);
          // ⚠️ NÃO redireciona - permite acesso direto se token inválido
          setLoading(false);
          return;
        }

        const sessionData = data[0];
        console.log('✅ Token SSO válido!', { 
          user: sessionData.user_email, 
          project: sessionData.project_name 
        });
        
        // Criar objeto de usuário
        const ssoUser: SSOUser = {
          id: sessionData.user_id,
          email: sessionData.user_email,
          name: sessionData.user_name,
          projectId: sessionData.project_id,
          projectSlug: sessionData.project_slug,
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || [],
        };

        setUser(ssoUser);
        setAuthenticated(true);
        setHasSSOToken(true);
        
        // Salvar para persistência
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken); // ⚠️ Usado pelo interceptor
        localStorage.setItem('arruda_sso_expires', sessionData.expires_at);
        
        // ⚠️ CRÍTICO: Limpar token da URL (segurança)
        window.history.replaceState({}, '', window.location.pathname);
        
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
              _token: savedToken.trim(), // ⚠️ Sempre trim
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
              setHasSSOToken(true);
              console.log('✅ Sessão restaurada do localStorage');
            } else {
              // Token inválido - limpar mas NÃO redirecionar
              console.log('❌ Token salvo inválido, limpando...');
              localStorage.removeItem('arruda_sso_user');
              localStorage.removeItem('arruda_sso_token');
              localStorage.removeItem('arruda_sso_expires');
              setHasSSOToken(false);
            }
          } else {
            // Sessão expirada - limpar mas NÃO redirecionar
            console.log('ℹ️ Sessão SSO expirada, limpando...');
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
            setHasSSOToken(false);
          }
        } else {
          // Sem token e sem sessão - permitir acesso direto
          console.log('ℹ️ Sem token SSO, permitindo acesso direto ao módulo');
          setHasSSOToken(false);
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao verificar SSO:', err);
      setError(err.message || 'Erro ao autenticar');
      setHasSSOToken(false);
      // ⚠️ NÃO redireciona em caso de erro - permite acesso direto
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, authenticated, error, redirectToHub, hasSSOToken };
};
```

---

## ⚠️ Pontos Críticos de Correção

### 1. **Decodificação do Token (LINHA 161-169)**
```typescript
// ❌ ERRADO (causa o problema):
const ssoToken = urlParams.get('sso_token');

// ✅ CORRETO:
let ssoToken: string | null = null;
if (ssoTokenRaw) {
  try {
    ssoToken = decodeURIComponent(ssoTokenRaw).trim();
  } catch (e) {
    ssoToken = ssoTokenRaw.trim();
  }
}
```

**Por quê?** Tokens podem ter caracteres especiais (ex: `+`) que viram espaço na URL. Sem `decodeURIComponent()`, o token fica inválido.

### 2. **Parâmetro Correto na RPC (LINHA 177)**
```typescript
// ❌ ERRADO:
await supabase.rpc('validate_sso_token', { p_token: ssoToken });

// ✅ CORRETO:
await supabase.rpc('validate_sso_token', { _token: ssoToken });
```

**Por quê?** A função espera `_token`, não `p_token`.

### 3. **NÃO Redirecionar Quando Falha (LINHAS 188-195)**
```typescript
// ❌ ERRADO (causa redirecionamento):
if (validationError || !data || !data[0].is_valid) {
  redirectToHub(); // ❌ Isso causa o loop de redirecionamento!
  return;
}

// ✅ CORRETO:
if (validationError || !data || !data[0].is_valid) {
  setError('Token SSO inválido');
  setHasSSOToken(false);
  setLoading(false); // ⚠️ Importante: desabilitar loading
  return; // ⚠️ NÃO redireciona - permite acesso direto
}
```

**Por quê?** Se o token falhar, o módulo deve permitir acesso direto (login próprio), não forçar redirecionamento.

---

## 🔍 Verificação: Cliente Supabase com Interceptor

**Certifique-se de que o módulo de Acordos tem o interceptor configurado:**

```typescript
// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // ⚠️ Desabilitar quando SSO ativo
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// ⚠️ INTERCEPTOR OBRIGATÓRIO: Adiciona token em TODAS as requisições
const originalFetch = supabase.rest.fetch;
supabase.rest.fetch = async (url, options = {}) => {
  const ssoToken = localStorage.getItem('arruda_sso_token');
  
  const headers = new Headers(options.headers);
  if (ssoToken) {
    headers.set('x-sso-token', ssoToken); // ⚠️ Header enviado automaticamente
  }
  
  return originalFetch(url, {
    ...options,
    headers,
  });
};
```

---

## 🧪 Como Testar

1. **Abra o DevTools Console** no módulo de Acordos
2. **Verifique os logs de debug:**
   ```
   🔍 [SSO Debug] { hasToken: true, tokenLength: 44, fromHub: true, ... }
   🔍 [SSO Validation] { hasError: false, isValid: true, ... }
   ✅ Token SSO válido!
   ```
3. **Verifique o Network tab:**
   - Todas as requisições ao Supabase devem ter header `x-sso-token`
4. **Verifique o localStorage:**
   - `arruda_sso_user`: Dados do usuário
   - `arruda_sso_token`: Token SSO
   - `arruda_sso_expires`: Data de expiração

---

## 📋 Checklist de Implementação

- [ ] Copiar código corrigido de `useSSO.ts`
- [ ] Verificar que `decodeURIComponent()` está sendo usado
- [ ] Verificar que `.trim()` está sendo usado
- [ ] Verificar que parâmetro `_token` está correto
- [ ] Verificar que NÃO está redirecionando quando token falha
- [ ] Verificar que interceptor está configurado no `supabase.ts`
- [ ] Testar: token na URL funciona?
- [ ] Testar: token no localStorage funciona?
- [ ] Testar: sem token, permite acesso direto?

---

## 🆘 Se Ainda Não Funcionar

### Verificar no Console do Módulo de Acordos:

1. **Token está na URL?**
   ```javascript
   new URLSearchParams(window.location.search).get('sso_token')
   ```

2. **Token está sendo decodificado?**
   ```javascript
   const raw = new URLSearchParams(window.location.search).get('sso_token');
   const decoded = decodeURIComponent(raw);
   console.log('Raw:', raw);
   console.log('Decoded:', decoded);
   ```

3. **Validação está funcionando?**
   ```javascript
   // No console do módulo de Acordos
   const token = localStorage.getItem('arruda_sso_token');
   const { data, error } = await supabase.rpc('validate_sso_token', { _token: token });
   console.log('Validation:', { data, error });
   ```

4. **Interceptor está funcionando?**
   - Abra Network tab
   - Faça uma requisição qualquer
   - Verifique se header `x-sso-token` está presente

---

**Última atualização:** 2025-11-24  
**Status:** ✅ Pronto para implementação  
**Testado em:** Baseado em `examples/useSSO.ts` (versão funcional)


