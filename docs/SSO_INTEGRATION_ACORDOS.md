# 🔐 Guia de Integração SSO - Módulo de Acordos Comerciais

**Documento oficial para integração do Single Sign-On (SSO) do Arruda Central Hub no módulo de Acordos Comerciais.**

---

## 📋 Visão Geral

Quando um usuário faz login no **Arruda Central Hub** e clica em **"Acordos Comerciais"**, o Hub gera automaticamente um token SSO temporário (válido por 12 horas) e redireciona o usuário para o módulo de Acordos **já autenticado**, sem necessidade de login e senha.

### Fluxo Completo

```
1. Usuário faz login no Hub Central
   ↓
2. Usuário clica em "Acordos Comerciais"
   ↓
3. Hub gera token SSO e redireciona:
   https://acordo-flow.vercel.app/?sso_token=TOKEN_AQUI&from=arruda-hub
   ↓
4. Módulo de Acordos valida o token
   ↓
5. Módulo autentica usuário automaticamente
   ↓
6. Módulo redireciona para dashboard/home
   ↓
7. Usuário acessa o módulo sem precisar fazer login
```

---

## 🎯 Formato da URL Recebida

Quando o usuário chega ao módulo de Acordos vindo do Hub, a URL será exatamente:

```
https://acordo-flow.vercel.app/?sso_token=TOKEN_BASE64&from=arruda-hub
```

### Parâmetros da URL

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `sso_token` | `string` (Base64) | Token SSO gerado pelo Hub (válido por 12 horas) |
| `from` | `arruda-hub` | Identificador do Hub Central (case-sensitive) |

⚠️ **IMPORTANTE**: O parâmetro `from` deve ser **exatamente** `arruda-hub` (case-sensitive). Qualquer variação será rejeitada.

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

### Passo 2: Configurar Cliente Supabase

Crie ou atualize `src/lib/supabase.ts` (ou ajuste o caminho conforme sua estrutura):

```typescript
import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Use estas credenciais (mesmas do Hub Central)
const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Passo 3: Criar Hook useSSO

Crie `src/hooks/useSSO.ts` com o seguinte código:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Ajuste o caminho conforme necessário

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

      // 1. Verificar token na URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub'; // ⚠️ Case-sensitive

      if (ssoToken && fromHub) {
        console.log('🔑 Token SSO encontrado na URL, validando...');
        setHasSSOToken(true);

        // 2. Validar token SSO via RPC
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (validationError) {
          console.error('❌ Erro ao validar token SSO:', validationError);
          setError('Token SSO inválido');
          setHasSSOToken(false);
          return;
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
          console.error('❌ Token SSO inválido ou expirado');
          setError('Token SSO inválido ou expirado');
          setHasSSOToken(false);
          return;
        }

        const sessionData = data[0];

        // 3. Criar objeto de usuário
        const ssoUser: SSOUser = {
          id: sessionData.user_id,
          email: sessionData.user_email,
          name: sessionData.user_name,
          projectId: sessionData.project_id,
          projectSlug: sessionData.project_slug,
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || [],
        };

        // 4. Salvar no localStorage
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken);
        localStorage.setItem('arruda_sso_expires', sessionData.expires_at);

        // 5. Limpar token da URL (segurança)
        window.history.replaceState({}, '', window.location.pathname);

        // 6. ⚠️ IMPORTANTE: Redirecionar para a página principal após autenticação
        // Se estiver na página de login, redirecionar para dashboard/home
        if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
          // Ajuste a rota conforme sua aplicação (ex: '/dashboard', '/home', '/app')
          window.location.href = '/dashboard'; // ou use navigate('/dashboard') com React Router
        }

        setUser(ssoUser);
        setAuthenticated(true);
        console.log('✅ SSO autenticado, usando usuário SSO:', ssoUser.email);
      } else {
        // Verificar se há sessão salva no localStorage
        const savedUser = localStorage.getItem('arruda_sso_user');
        const savedToken = localStorage.getItem('arruda_sso_token');
        const savedExpires = localStorage.getItem('arruda_sso_expires');

        if (savedUser && savedToken && savedExpires) {
          const expiresAt = new Date(savedExpires);
          if (expiresAt > new Date()) {
            // Sessão ainda válida
            setUser(JSON.parse(savedUser));
            setAuthenticated(true);
            setHasSSOToken(true);
            console.log('✅ Sessão SSO restaurada do localStorage');
          } else {
            // Sessão expirada
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
            setHasSSOToken(false);
          }
        } else {
          setHasSSOToken(false);
        }
      }
    } catch (err: any) {
      console.error('Erro ao verificar SSO:', err);
      setError(err.message || 'Erro ao verificar autenticação SSO');
      setHasSSOToken(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    authenticated,
    error,
    redirectToHub,
    hasSSOToken,
  };
};
```

### Passo 4: Integrar no App Principal

#### Opção A: SSO Obrigatório (Recomendado)

Se o módulo **só deve ser acessado via SSO**:

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSSO } from './hooks/useSSO';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, authenticated, hasSSOToken } = useSSO();

  // ⚠️ IMPORTANTE: Redirecionar automaticamente após autenticação SSO
  useEffect(() => {
    if (!loading && authenticated && hasSSOToken && user) {
      // Se está na página de login e foi autenticado via SSO, redirecionar
      if (location.pathname === '/login' || location.pathname === '/auth') {
        navigate('/dashboard', { replace: true }); // Ajuste a rota conforme sua aplicação
      }
    }
  }, [loading, authenticated, hasSSOToken, user, location.pathname, navigate]);

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

  if (!authenticated || !hasSSOToken) {
    // Se não veio via SSO, redirecionar para o Hub
    window.location.href = 'https://arruda-central-hub.vercel.app/hub';
    return null;
  }

  // Renderizar aplicação principal
  return <YourApp user={user} />;
}

export default App;
```

#### Opção B: SSO Opcional (Permite Acesso Direto)

Se o módulo **permite acesso direto** (sem SSO):

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSSO } from './hooks/useSSO';
import { YourAuthProvider } from './contexts/AuthContext'; // Seu sistema de auth

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: ssoUser, loading, authenticated: ssoAuthenticated, hasSSOToken } = useSSO();

  // ⚠️ IMPORTANTE: Redirecionar automaticamente após autenticação SSO
  useEffect(() => {
    if (!loading && ssoAuthenticated && hasSSOToken && ssoUser) {
      // Se está na página de login e foi autenticado via SSO, redirecionar
      if (location.pathname === '/login' || location.pathname === '/auth') {
        navigate('/dashboard', { replace: true }); // Ajuste a rota conforme sua aplicação
      }
    }
  }, [loading, ssoAuthenticated, hasSSOToken, ssoUser, location.pathname, navigate]);

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

  // Se veio via SSO, usar usuário SSO
  if (ssoAuthenticated && hasSSOToken && ssoUser) {
    return <YourApp user={ssoUser} />;
  }

  // Se não veio via SSO, usar sistema de auth próprio
  return (
    <YourAuthProvider>
      <YourApp />
    </YourAuthProvider>
  );
}

export default App;
```

---

## 📊 Estrutura de Dados

### Resposta da Função `validate_sso_token`

A função RPC `validate_sso_token` retorna um array com um objeto contendo:

```typescript
{
  is_valid: boolean;           // true se token é válido
  user_id: string;             // UUID do usuário
  user_email: string;          // Email do usuário
  user_name: string;           // Nome do usuário
  project_id: string;         // UUID do projeto (Acordos Comerciais)
  project_slug: string;       // 'acordo-flow'
  project_name: string;       // 'Acordos Comerciais'
  expires_at: string;          // ISO 8601 timestamp (ex: '2025-11-19T10:00:00Z')
  permissions: Array<{         // Array de permissões do usuário
    permission: string;
    module: string;
    action: string;
    granted: boolean;
  }>;
}
```

### Objeto SSOUser

O hook `useSSO` retorna um objeto `SSOUser` com:

```typescript
{
  id: string;                 // UUID do usuário
  email: string;              // Email do usuário
  name: string;               // Nome do usuário
  projectId: string;          // UUID do projeto
  projectSlug: string;        // 'acordo-flow'
  projectName: string;        // 'Acordos Comerciais'
  permissions: Array<{        // Permissões do usuário
    permission: string;
    module: string;
    action: string;
    granted: boolean;
  }>;
}
```

---

## 🔧 Funcionalidades Opcionais

### Voltar ao Hub (Sem Logout)

Permite que o usuário retorne ao Hub para trocar de módulo sem fazer logout:

```typescript
import { useSSO } from './hooks/useSSO';
import { ArrowLeft } from 'lucide-react';

function BackToHubButton() {
  const { redirectToHub, hasSSOToken } = useSSO();

  // Só mostrar se veio via SSO
  if (!hasSSOToken) {
    return null;
  }

  return (
    <button 
      onClick={redirectToHub}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar ao Hub
    </button>
  );
}
```

### Logout (Redireciona para Login do Hub)

Implementa logout completo que limpa a sessão SSO e redireciona para a tela de login do Hub:

```typescript
import { useSSO } from './hooks/useSSO';
import { LogOut } from 'lucide-react';

function LogoutButton() {
  const { hasSSOToken } = useSSO();

  const handleLogout = () => {
    // Limpar dados locais do SSO
    localStorage.removeItem('arruda_sso_user');
    localStorage.removeItem('arruda_sso_token');
    localStorage.removeItem('arruda_sso_expires');
    
    // Redirecionar para login do Hub
    if (hasSSOToken) {
      window.location.href = 'https://arruda-central-hub.vercel.app/auth';
    } else {
      // Se não veio via SSO, fazer logout do sistema próprio
      // (implementar sua lógica de logout local aqui)
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  );
}
```

---

## 🐛 Troubleshooting

### Problema: Token não aparece na URL

**Sintomas**: A URL não contém `?sso_token=...&from=arruda-hub`

**Soluções**:
1. Verificar se o Hub está gerando o token corretamente
2. Verificar se a URL do módulo está correta no Hub
3. Verificar logs do console do Hub

### Problema: Token inválido ou expirado

**Sintomas**: `validate_sso_token` retorna `is_valid: false`

**Soluções**:
1. Verificar se o token não expirou (válido por 12 horas)
2. Verificar se o token está sendo passado corretamente na URL
3. Verificar se a função RPC `validate_sso_token` existe no Supabase

### Problema: Parâmetro `from` não reconhecido

**Sintomas**: O código não detecta que veio do Hub

**Soluções**:
1. Verificar se o parâmetro é exatamente `from=arruda-hub` (case-sensitive)
2. Verificar se não há espaços ou caracteres especiais
3. Adicionar logs para debug:
   ```typescript
   const fromParam = urlParams.get('from');
   console.log('From param:', fromParam);
   console.log('From === arruda-hub:', fromParam === 'arruda-hub');
   ```

### Problema: Usuário não redireciona após autenticação

**Sintomas**: Token é validado mas usuário fica na página de login

**Soluções**:
1. Verificar se o redirecionamento está implementado (Passo 6 do `useSSO`)
2. Verificar se a rota de destino está correta (`/dashboard`, `/home`, etc.)
3. Verificar se está usando `window.location.href` ou `navigate()` corretamente

### Problema: Erro ao chamar `validate_sso_token`

**Sintomas**: Erro na chamada RPC

**Soluções**:
1. Verificar se a função existe no Supabase
2. Verificar se as credenciais do Supabase estão corretas
3. Verificar permissões RLS no Supabase
4. Verificar logs do console para detalhes do erro

---

## 📋 Checklist de Implementação

- [ ] Instalar `@supabase/supabase-js`
- [ ] Configurar cliente Supabase com credenciais corretas
- [ ] Criar hook `useSSO` com validação de token
- [ ] Implementar redirecionamento automático após autenticação SSO
- [ ] Integrar `useSSO` no `App.tsx` ou componente principal
- [ ] Testar fluxo completo:
  - [ ] Login no Hub Central
  - [ ] Clicar em "Acordos Comerciais"
  - [ ] Verificar se token está na URL
  - [ ] Verificar se token é validado
  - [ ] Verificar se redireciona automaticamente para dashboard/home
  - [ ] Verificar se usuário está autenticado na página principal
- [ ] (Opcional) Implementar botão "Voltar ao Hub"
- [ ] (Opcional) Implementar botão "Sair" com redirecionamento para Hub

---

## 🔍 Como Testar

### 1. Teste Manual

1. Acesse o Hub Central: https://arruda-central-hub.vercel.app
2. Faça login com suas credenciais
3. Clique em "Acordos Comerciais"
4. Verifique no console do navegador:
   - ✅ `🔑 Token SSO encontrado na URL, validando...`
   - ✅ `✅ SSO autenticado, usando usuário SSO: ...`
   - ✅ Redirecionamento para dashboard/home

### 2. Verificar URL

A URL deve conter:
```
https://acordo-flow.vercel.app/?sso_token=TOKEN_BASE64&from=arruda-hub
```

### 3. Verificar localStorage

Após autenticação, verifique no DevTools > Application > Local Storage:
- `arruda_sso_user`: Objeto JSON com dados do usuário
- `arruda_sso_token`: Token SSO
- `arruda_sso_expires`: Timestamp de expiração

---

## 📞 Suporte

Se encontrar problemas durante a implementação:

1. Verifique os logs do console do navegador
2. Verifique se o token está sendo gerado corretamente no Hub
3. Verifique se a função `validate_sso_token` está acessível no Supabase
4. Entre em contato com a equipe do Hub Central

---

## 📚 Recursos Adicionais

- **Exemplo Completo**: Veja `examples/useSSO.ts` no repositório do Hub Central
- **Documentação Detalhada**: Veja `docs/SSO_COMPLETE_GUIDE.md`
- **Guia de Redirecionamento**: Veja `docs/SSO_FIX_REDIRECT.md`

---

**Última atualização**: 18 de Novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ Implementação completa e testada

