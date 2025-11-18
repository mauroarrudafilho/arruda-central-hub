# 🔧 Correção: Redirecionamento Automático Após SSO

## ❌ Problema

O módulo externo está validando o token SSO corretamente e salvando os dados no `localStorage`, mas **não está redirecionando automaticamente** para dentro da aplicação após a autenticação. O usuário fica na página de login mesmo após ser autenticado via SSO.

## ✅ Solução

Após validar o token SSO e salvar os dados, o módulo **deve redirecionar automaticamente** para a página principal da aplicação.

---

## 📝 Ajuste Necessário no Módulo Externo

### Opção 1: Redirecionamento Imediato (Recomendado)

No seu hook `useSSO` ou no componente que processa o SSO, adicione o redirecionamento após a autenticação bem-sucedida:

```typescript
// src/hooks/useSSO.ts ou src/contexts/AuthContext.tsx

const checkSSO = async () => {
  try {
    // ... código existente de validação ...

    if (ssoToken && fromHub) {
      // Validar token SSO
      const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
        _token: ssoToken,
      });

      if (validationError || !data || data.length === 0 || !data[0].is_valid) {
        // Token inválido - permitir login próprio
        return;
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
        permissions: sessionData.permissions || [],
      };

      // Salvar no localStorage
      localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
      localStorage.setItem('arruda_sso_token', ssoToken);
      localStorage.setItem('arruda_sso_expires', sessionData.expires_at);

      // ✅ ADICIONAR ESTE REDIRECIONAMENTO
      // Redirecionar para a página principal da aplicação
      // Ajuste a rota conforme sua aplicação (ex: '/dashboard', '/home', '/')
      window.location.href = '/dashboard'; // ou use navigate('/dashboard') se estiver usando React Router
      
      // OU se estiver na página de login, redirecionar para a rota principal
      if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
        window.location.href = '/dashboard'; // Ajuste conforme sua rota principal
      }
    }
  } catch (err) {
    console.error('Erro ao verificar SSO:', err);
  }
};
```

### Opção 2: Usando React Router (Se aplicável)

Se você estiver usando React Router, use `navigate` ao invés de `window.location.href`:

```typescript
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const { user, authenticated, loading } = useSSO();

  useEffect(() => {
    // Se autenticado via SSO e está na página de login, redirecionar
    if (!loading && authenticated && user) {
      if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
        navigate('/dashboard'); // Ajuste conforme sua rota principal
      }
    }
  }, [authenticated, user, loading, navigate]);

  // ... resto do código
}
```

### Opção 3: Verificação no Componente de Login

Se você tem um componente de login separado, adicione uma verificação no início:

```typescript
// src/pages/Login.tsx ou src/components/LoginForm.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSSO } from '@/hooks/useSSO';

function Login() {
  const navigate = useNavigate();
  const { user, authenticated, loading, hasSSOToken } = useSSO();

  useEffect(() => {
    // Se já está autenticado via SSO, redirecionar para dashboard
    if (!loading && authenticated && hasSSOToken && user) {
      console.log('✅ Usuário autenticado via SSO, redirecionando...');
      navigate('/dashboard'); // Ajuste conforme sua rota principal
    }
  }, [authenticated, user, loading, hasSSOToken, navigate]);

  // Se ainda está carregando, mostrar loading
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

  // Se já está autenticado, não mostrar formulário de login
  if (authenticated && hasSSOToken) {
    return null; // O useEffect vai redirecionar
  }

  // Mostrar formulário de login normal
  return (
    <div>
      {/* Seu formulário de login aqui */}
    </div>
  );
}
```

---

## 🔍 Verificação do Problema

Para verificar se o problema está no redirecionamento, abra o console do navegador no módulo externo e procure por:

1. ✅ `✅ Token SSO válido!` - Token foi validado
2. ✅ `✅ SSO autenticado, usando usuário SSO: ...` - Usuário foi autenticado
3. ❌ **Falta**: Redirecionamento para a página principal

Se você vê os logs 1 e 2 mas não há redirecionamento, o problema é exatamente o que estamos corrigindo.

---

## 📋 Checklist de Implementação

- [ ] Adicionar redirecionamento após `setAuthenticated(true)` no hook `useSSO`
- [ ] Verificar se a rota de destino está correta (ex: `/dashboard`, `/home`, `/`)
- [ ] Testar o fluxo completo:
  - [ ] Login no Hub Central
  - [ ] Clicar em módulo externo
  - [ ] Verificar se token está na URL
  - [ ] Verificar se token é validado
  - [ ] **Verificar se redireciona automaticamente para a página principal**
  - [ ] Verificar se usuário está autenticado na página principal

---

## 🎯 Exemplo Completo de Implementação

Aqui está um exemplo completo de como deve ficar o `App.tsx` ou componente principal:

```typescript
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSSO } from './hooks/useSSO';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authenticated, loading, hasSSOToken } = useSSO();

  useEffect(() => {
    // Se autenticado via SSO e está em página de login/auth, redirecionar
    if (!loading && authenticated && hasSSOToken && user) {
      const isLoginPage = location.pathname === '/login' || 
                          location.pathname === '/auth' || 
                          location.pathname === '/';
      
      if (isLoginPage) {
        console.log('✅ Redirecionando usuário autenticado via SSO para dashboard...');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authenticated, user, loading, hasSSOToken, location.pathname, navigate]);

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

  // Se autenticado via SSO, mostrar aplicação
  if (authenticated && hasSSOToken && user) {
    return <YourApp user={user} />;
  }

  // Se não autenticado, mostrar login
  return <LoginPage />;
}

export default App;
```

---

## ⚠️ Importante

- **Ajuste a rota de destino** conforme sua aplicação (pode ser `/dashboard`, `/home`, `/app`, etc.)
- **Use `replace: true`** no `navigate` para evitar que o usuário volte para a página de login com o botão "voltar"
- **Teste em produção** após implementar, pois o comportamento pode ser diferente do desenvolvimento

---

**Última atualização**: 18 de Novembro de 2025

