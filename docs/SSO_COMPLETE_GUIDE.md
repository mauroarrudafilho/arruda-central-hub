# 🔐 Guia Completo SSO - Arruda Central Hub

**Documento único com todas as informações necessárias para implementar SSO nos módulos externos.**

---

## 📋 Visão Geral

O Arruda Central Hub gera tokens SSO quando usuários clicam em módulos externos. Este guia mostra como os módulos devem validar esses tokens e autenticar usuários automaticamente, **sem necessidade de login e senha**.

### ⚠️ Importante: Acesso Direto vs SSO

O hook `useSSO` suporta **dois modos de acesso**:

1. **Via SSO** (quando há token): Autentica automaticamente sem login
2. **Acesso Direto** (quando não há token): Permite que o módulo use seu próprio sistema de autenticação

**Por padrão, o hook NÃO redireciona** se não houver token SSO, permitindo que o módulo tenha seu próprio fluxo de login. Se você quiser forçar redirecionamento para o Hub quando não houver SSO, adicione essa lógica no seu App.

### Fluxo de Autenticação

```
1. Usuário faz login no Hub Central
   ↓
2. Usuário clica em um módulo externo
   ↓
3. Hub gera token SSO (válido por 12 horas) e redireciona: 
   https://modulo-externo.vercel.app/?sso_token=TOKEN&from=arruda-hub
   ↓
4. Módulo valida token usando validate_sso_token
   ↓
5. Módulo autentica usuário automaticamente
   ↓
6. Usuário acessa o módulo sem precisar fazer login
```

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

Crie `src/lib/supabase.ts` (ou ajuste o caminho conforme sua estrutura):

```typescript
import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Use estas credenciais (mesmas do Hub Central)
const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Passo 3: Criar Hook useSSO

Crie `src/hooks/useSSO.ts` com o seguinte código completo:

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
  hasSSOToken: boolean; // Indica se há token SSO (permite acesso direto se false)
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
      const fromHub = urlParams.get('from') === 'arruda-hub';

      if (ssoToken && fromHub) {
        console.log('🔑 Token SSO encontrado na URL, validando...');
        setHasSSOToken(true);
        
        // 2. Validar token SSO
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (validationError) {
          console.error('❌ Erro ao validar token SSO:', validationError);
          setError('Token SSO inválido');
          setHasSSOToken(false);
          // Não redireciona - permite acesso direto se SSO falhar
          return;
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
          console.error('❌ Token SSO inválido ou expirado');
          setError('Token SSO inválido ou expirado');
          setHasSSOToken(false);
          // Não redireciona - permite acesso direto se token inválido
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
          projectSlug: sessionData.project_slug,
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || [],
        };

        setUser(ssoUser);
        setAuthenticated(true);
        setHasSSOToken(true);
        
        // 4. Salvar para persistência (12 horas)
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken);
        localStorage.setItem('arruda_sso_expires', sessionData.expires_at);
        
        // 5. Limpar token da URL (segurança)
        window.history.replaceState({}, '', window.location.pathname);
        
      } else {
        // Verificar sessão salva no localStorage
        const savedUser = localStorage.getItem('arruda_sso_user');
        const savedToken = localStorage.getItem('arruda_sso_token');
        const savedExpires = localStorage.getItem('arruda_sso_expires');

        if (savedUser && savedToken && savedExpires) {
          // Verificar se não expirou
          const expiresAt = new Date(savedExpires);
          if (expiresAt > new Date()) {
            // Validar token novamente para garantir que ainda é válido
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
              setHasSSOToken(true);
              console.log('✅ Sessão restaurada do localStorage');
            } else {
              // Token inválido, limpar mas permitir acesso direto
              console.log('❌ Token salvo inválido, permitindo acesso direto...');
              localStorage.removeItem('arruda_sso_user');
              localStorage.removeItem('arruda_sso_token');
              localStorage.removeItem('arruda_sso_expires');
              setHasSSOToken(false);
            }
          } else {
            // Sessão expirada, limpar mas permitir acesso direto
            console.log('ℹ️ Sessão SSO expirada, permitindo acesso direto...');
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
            setHasSSOToken(false);
          }
        } else {
          // Sem token e sem sessão - permitir acesso direto (login próprio do módulo)
          console.log('ℹ️ Sem token SSO, permitindo acesso direto ao módulo');
          setHasSSOToken(false);
          // Não redireciona - permite que o módulo use seu próprio sistema de autenticação
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao verificar SSO:', err);
      setError(err.message || 'Erro ao autenticar');
      // Em caso de erro, permitir acesso direto ao invés de forçar redirecionamento
      setHasSSOToken(false);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, authenticated, error, redirectToHub, hasSSOToken };
};
```

### Passo 4: Integrar no App Principal

No seu arquivo principal (ex: `src/App.tsx` ou `src/main.tsx`):

**Opção A: SSO Obrigatório (redireciona se não tiver SSO)**

```typescript
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated, hasSSOToken } = useSSO();

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

  // Se não tem SSO e não está autenticado, redirecionar para Hub
  if (!hasSSOToken && !authenticated) {
    window.location.href = 'https://arruda-central-hub.vercel.app/hub';
    return null;
  }

  // Se autenticado via SSO, usar dados do SSO
  if (authenticated && hasSSOToken) {
    return <YourApp user={user} />;
  }

  // Se não tem SSO, permitir login próprio do módulo
  return <YourLoginComponent />;
}

export default App;
```

**Opção B: SSO Opcional (permite acesso direto sempre)**

```typescript
import { useSSO } from './hooks/useSSO';
import { YourAuthProvider } from './contexts/AuthContext'; // Seu sistema de auth

function App() {
  const { user: ssoUser, loading, authenticated: ssoAuthenticated, hasSSOToken } = useSSO();

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

  // Se autenticado via SSO, usar dados do SSO
  if (ssoAuthenticated && hasSSOToken) {
    return <YourApp user={ssoUser} />;
  }

  // Se não tem SSO, usar sistema de autenticação próprio do módulo
  return (
    <YourAuthProvider>
      <YourApp />
    </YourAuthProvider>
  );
}

export default App;
```

### Passo 5: Usar Dados do Usuário

Agora você pode usar os dados do usuário autenticado em qualquer componente:

```typescript
import { useSSO } from './hooks/useSSO';

function Dashboard() {
  const { user, hasSSOToken } = useSSO();

  // Verificar se usuário veio via SSO ou login próprio
  const authMethod = hasSSOToken ? 'SSO' : 'Login Direto';

  return (
    <div>
      <h1>Bem-vindo, {user?.name || user?.email}!</h1>
      <p>Projeto: {user?.projectName}</p>
      <p>Permissões: {user?.permissions.length} permissões ativas</p>
      <p>Autenticado via: {authMethod}</p>
    </div>
  );
}
```

### Passo 6: Implementar Lógica de Acesso Duplo (Opcional)

Se você quer permitir tanto SSO quanto acesso direto:

```typescript
import { useSSO } from './hooks/useSSO';
import { useYourOwnAuth } from './hooks/useYourOwnAuth'; // Seu hook de auth próprio

function App() {
  const { user: ssoUser, authenticated: ssoAuth, hasSSOToken, loading: ssoLoading } = useSSO();
  const { user: localUser, authenticated: localAuth, loading: localLoading } = useYourOwnAuth();

  if (ssoLoading || localLoading) {
    return <Loading />;
  }

  // Prioridade: SSO primeiro, depois login próprio
  const user = ssoAuth && hasSSOToken ? ssoUser : localUser;
  const authenticated = ssoAuth || localAuth;

  if (!authenticated) {
    return <LoginPage />;
  }

  return <YourApp user={user} />;
}
```

---

## 📝 Estrutura de Dados

### SSOUser Interface

```typescript
interface SSOUser {
  id: string;                    // UUID do usuário
  email: string;                 // Email do usuário
  name: string;                  // Nome do usuário
  projectId: string;             // UUID do projeto
  projectSlug: string;           // Slug do projeto (ex: "acordos")
  projectName: string;           // Nome do projeto (ex: "Acordos Comerciais")
  permissions: Array<{           // Array de permissões
    permission: string;
    module: string;
    action: string;
    granted: boolean;
  }>;
}
```

### Resposta da Função validate_sso_token

```typescript
{
  is_valid: boolean;
  user_id: string;
  user_email: string;
  user_name: string;
  project_id: string;
  project_slug: string;
  project_name: string;
  expires_at: string;            // ISO 8601 timestamp
  permissions: Array<{...}>;     // Array de permissões
}
```

---

## 🔧 Configurações Importantes

### Credenciais Supabase

```
URL: https://kgzybpelluftexrewyke.supabase.co
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI
```

### URLs Importantes

- **Hub Central**: `https://arruda-central-hub.vercel.app/hub`
- **Função de Validação**: `validate_sso_token`
- **Token na URL**: `?sso_token=TOKEN&from=arruda-hub`

### Características do Token

- **Validade**: 12 horas
- **Formato**: Base64 string
- **Persistência**: Salvo no `localStorage`
- **Renovação**: Automática se ainda válido

---

## 🔍 Debug e Troubleshooting

### Verificar se o Token está na URL

```typescript
// No console do navegador
const urlParams = new URLSearchParams(window.location.search);
console.log('Token SSO:', urlParams.get('sso_token'));
console.log('From Hub:', urlParams.get('from'));
```

### Verificar Sessão Salva

```typescript
// No console do navegador
console.log('User:', localStorage.getItem('arruda_sso_user'));
console.log('Token:', localStorage.getItem('arruda_sso_token'));
console.log('Expires:', localStorage.getItem('arruda_sso_expires'));
```

### Erros Comuns e Soluções

#### 1. "Token SSO inválido"
- ✅ Verifique se o token está na URL: `?sso_token=...&from=arruda-hub`
- ✅ Verifique se o token não expirou (válido por 12 horas)
- ✅ Verifique se as credenciais do Supabase estão corretas

#### 2. "Redirecionando para Hub"
- ✅ Isso é normal se não houver token SSO
- ✅ O usuário será redirecionado automaticamente para fazer login no Hub

#### 3. "Erro ao validar token SSO"
- ✅ Verifique a conexão com o Supabase
- ✅ Verifique se a função `validate_sso_token` existe no banco
- ✅ Verifique os logs do console para mais detalhes

#### 4. Token não aparece na URL
- ✅ Verifique se o usuário está logado no Hub
- ✅ Verifique se o projeto tem `slug` correto no banco
- ✅ Verifique o console do Hub para erros

---

## ✅ Checklist de Implementação

- [ ] Instalar `@supabase/supabase-js`
- [ ] Configurar cliente Supabase com credenciais corretas
- [ ] Criar hook `useSSO.ts`
- [ ] Integrar hook no `App.tsx` ou componente principal
- [ ] Testar fluxo completo:
  - [ ] Login no Hub Central
  - [ ] Clicar em módulo externo
  - [ ] Verificar se token está na URL
  - [ ] Verificar se usuário é autenticado automaticamente
  - [ ] Verificar se sessão persiste após refresh
- [ ] Implementar logout (opcional)
- [ ] Testar expiração de token (12 horas)

---

## 🎯 Funcionalidades Opcionais

### Logout

Para implementar logout que redireciona de volta ao Hub:

```typescript
import { useSSO } from './hooks/useSSO';

function LogoutButton() {
  const { redirectToHub } = useSSO();

  const handleLogout = () => {
    // Limpar dados locais
    localStorage.removeItem('arruda_sso_user');
    localStorage.removeItem('arruda_sso_token');
    localStorage.removeItem('arruda_sso_expires');
    
    // Redirecionar para Hub
    redirectToHub();
  };

  return (
    <button onClick={handleLogout}>
      Sair
    </button>
  );
}
```

### Verificar Permissões

```typescript
import { useSSO } from './hooks/useSSO';

function ProtectedComponent() {
  const { user } = useSSO();
  
  const hasPermission = (permission: string) => {
    return user?.permissions.some(
      p => p.permission === permission && p.granted
    ) ?? false;
  };

  if (!hasPermission('read')) {
    return <div>Acesso negado</div>;
  }

  return <div>Conteúdo protegido</div>;
}
```

---

## 📊 Resumo Técnico

### Como Funciona

1. **Hub Central gera token**: Quando usuário clica em módulo, o Hub chama `generate_sso_token` no Supabase
2. **Token na URL**: Token é adicionado como parâmetro: `?sso_token=TOKEN&from=arruda-hub`
3. **Módulo valida**: Módulo chama `validate_sso_token` com o token
4. **Autenticação**: Se válido, módulo autentica usuário automaticamente
5. **Persistência**: Token é salvo no `localStorage` por 12 horas

### Segurança

- ✅ Token único por usuário e módulo
- ✅ Token expira em 12 horas
- ✅ Validação no servidor (Supabase)
- ✅ Token removido da URL após validação
- ✅ Redirecionamento automático se inválido

---

## 🆘 Suporte

Se encontrar problemas durante a implementação:

1. Verifique os logs do console do navegador
2. Verifique se o token está sendo gerado corretamente no Hub
3. Verifique se a função `validate_sso_token` está acessível no Supabase
4. Entre em contato com a equipe do Hub Central

---

## 📚 Recursos Adicionais

- **Exemplo Completo**: Veja `examples/useSSO.ts` no repositório do Hub Central
- **Documentação Detalhada**: Veja outros documentos em `docs/SSO_*.md`

---

**Última atualização**: 15 de Novembro de 2025  
**Versão**: 1.0.0

