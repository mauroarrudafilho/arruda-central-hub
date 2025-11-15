# 🚀 Guia Rápido SSO - Implementação em 5 Minutos

Este guia mostra como implementar SSO nos módulos externos de forma rápida e simples.

## ⚡ Implementação Rápida

### Passo 1: Adicionar Hook de SSO no seu módulo

Crie um arquivo `src/hooks/useSSO.ts`:

```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';
const HUB_URL = 'https://arruda-central-hub.vercel.app/hub';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const useSSO = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkSSO();
  }, []);

  const checkSSO = async () => {
    try {
      // 1. Verificar token na URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      if (ssoToken && fromHub) {
        // 2. Validar token
        const { data, error } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (error || !data || !data[0]?.is_valid) {
          console.error('Token SSO inválido:', error);
          redirectToHub();
          return;
        }

        const sessionData = data[0];
        
        // 3. Criar sessão local
        setUser({
          id: sessionData.user_id,
          email: sessionData.user_email,
          name: sessionData.user_name,
          permissions: sessionData.permissions || [],
        });
        
        setAuthenticated(true);
        
        // 4. Limpar URL
        window.history.replaceState({}, '', window.location.pathname);
        
        // 5. Salvar para persistência
        localStorage.setItem('arruda_sso_user', JSON.stringify(sessionData));
        localStorage.setItem('arruda_sso_token', ssoToken);
      } else {
        // Verificar sessão salva
        const saved = localStorage.getItem('arruda_sso_user');
        if (saved) {
          const savedData = JSON.parse(saved);
          setUser(savedData);
          setAuthenticated(true);
        } else {
          redirectToHub();
        }
      }
    } catch (err) {
      console.error('Erro SSO:', err);
      redirectToHub();
    } finally {
      setLoading(false);
    }
  };

  const redirectToHub = () => {
    window.location.href = HUB_URL;
  };

  return { user, loading, authenticated, redirectToHub };
};
```

### Passo 2: Usar no componente principal

No seu `App.tsx` ou componente principal:

```typescript
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated, redirectToHub } = useSSO();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || !user) {
    redirectToHub();
    return null;
  }

  // Seu app aqui - usuário está autenticado!
  return (
    <div>
      <h1>Bem-vindo, {user.name}!</h1>
      {/* Resto do seu app */}
    </div>
  );
}
```

### Passo 3: Proteger rotas (opcional)

```typescript
const ProtectedRoute = ({ children, requiredPermission }: any) => {
  const { user } = useSSO();
  
  if (!user) return null;
  
  const hasPermission = user.permissions?.some(
    (p: any) => p.permission === requiredPermission && p.granted
  );
  
  if (!hasPermission) {
    return <div>Acesso negado</div>;
  }
  
  return children;
};
```

## ✅ Pronto!

Agora quando o usuário clicar no seu módulo no Hub, ele será autenticado automaticamente sem precisar fazer login novamente.

## 🔍 Debug

Se não estiver funcionando:

1. **Verificar se o token está na URL**: Abra o console do navegador e veja se `?sso_token=...&from=arruda-hub` aparece na URL
2. **Verificar erros no console**: Veja se há erros ao chamar `validate_sso_token`
3. **Verificar Supabase**: Confirme que as funções `generate_sso_token` e `validate_sso_token` existem no banco

## 📝 Notas

- O token expira em 24 horas
- Se o token expirar, o usuário será redirecionado para o Hub
- A sessão é salva no localStorage para persistência entre recarregamentos

