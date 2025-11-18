# 📋 Comandos para Implementar SSO nos Módulos Externos

Este documento fornece comandos prontos para copiar e colar nos módulos externos, facilitando a implementação do SSO.

## 🚀 Implementação Rápida (Copy & Paste)

### 1. Instalar Dependência

```bash
npm install @supabase/supabase-js
```

### 2. Criar Arquivo de Configuração Supabase

Crie `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 3. Criar Hook useSSO

Crie `src/hooks/useSSO.ts` e copie o conteúdo completo de `examples/useSSO.ts` do repositório do Hub Central, ou use este código:

```typescript
import { useEffect, useState } from 'react';
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

      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      if (ssoToken && fromHub) {
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (validationError || !data || !data[0]?.is_valid) {
          setError('Token SSO inválido');
          redirectToHub();
          return;
        }

        const sessionData = data[0];
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
        
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken);
        localStorage.setItem('arruda_sso_expires', sessionData.expires_at);
        
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        const savedUser = localStorage.getItem('arruda_sso_user');
        const savedToken = localStorage.getItem('arruda_sso_token');
        const savedExpires = localStorage.getItem('arruda_sso_expires');

        if (savedUser && savedToken && savedExpires) {
          const expiresAt = new Date(savedExpires);
          if (expiresAt > new Date()) {
            const { data: validationData, error: validationError } = await supabase.rpc('validate_sso_token', {
              _token: savedToken,
            });

            if (!validationError && validationData?.[0]?.is_valid) {
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
            } else {
              localStorage.removeItem('arruda_sso_user');
              localStorage.removeItem('arruda_sso_token');
              localStorage.removeItem('arruda_sso_expires');
              redirectToHub();
            }
          } else {
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
            redirectToHub();
          }
        } else {
          redirectToHub();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
      redirectToHub();
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, authenticated, error, redirectToHub };
};
```

### 4. Integrar no App.tsx

Substitua ou modifique seu `src/App.tsx`:

```typescript
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated } = useSSO();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Hook já redireciona automaticamente
  }

  // Usuário autenticado! Renderizar app normalmente
  return <YourApp user={user} />;
}

export default App;
```

---

## ✅ Teste Rápido

Após implementar, teste:

1. Faça login no Hub Central: https://arruda-central-hub.vercel.app/hub
2. Clique em um módulo externo
3. O módulo deve autenticar automaticamente sem pedir login

---

## 📝 Notas Importantes

- O token SSO expira em **12 horas**
- O token é passado na URL: `?sso_token=TOKEN&from=arruda-hub`
- A sessão é salva no `localStorage` para persistência
- Se o token expirar ou for inválido, o usuário é redirecionado automaticamente para o Hub

---

**Para documentação completa, veja**: `docs/SSO_MODULE_INTEGRATION_GUIDE.md`

