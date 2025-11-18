# 🔐 Guia de Integração SSO - Para Módulos Externos

Este documento fornece instruções completas para integrar o sistema de Single Sign-On (SSO) do Arruda Central Hub nos módulos externos, permitindo que usuários acessem automaticamente sem necessidade de login e senha.

## 📋 Visão Geral

Quando um usuário faz login no Arruda Central Hub e clica em um módulo externo, o Hub gera um token SSO temporário (válido por 12 horas) e o passa na URL. O módulo externo deve validar esse token e autenticar o usuário automaticamente.

### Fluxo de Autenticação

```
1. Usuário faz login no Hub Central
   ↓
2. Usuário clica em um módulo externo
   ↓
3. Hub gera token SSO e redireciona: 
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

Certifique-se de ter o cliente Supabase instalado:

```bash
npm install @supabase/supabase-js
# ou
yarn add @supabase/supabase-js
# ou
pnpm add @supabase/supabase-js
```

### Passo 2: Configurar Cliente Supabase

Crie um arquivo de configuração do Supabase (ex: `src/lib/supabase.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Use as mesmas credenciais do Hub Central
const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Passo 3: Criar Hook de SSO

Crie o arquivo `src/hooks/useSSO.ts`:

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
        
        // 2. Validar token SSO
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (validationError) {
          console.error('❌ Erro ao validar token SSO:', validationError);
          setError('Token SSO inválido');
          redirectToHub();
          return;
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
          console.error('❌ Token SSO inválido ou expirado');
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
          projectSlug: sessionData.project_slug,
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || [],
        };

        setUser(ssoUser);
        setAuthenticated(true);
        
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
              console.log('✅ Sessão restaurada do localStorage');
            } else {
              // Token inválido, limpar e redirecionar
              console.log('❌ Token salvo inválido, redirecionando...');
              localStorage.removeItem('arruda_sso_user');
              localStorage.removeItem('arruda_sso_token');
              localStorage.removeItem('arruda_sso_expires');
              redirectToHub();
            }
          } else {
            // Sessão expirada
            console.log('❌ Sessão expirada, redirecionando...');
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
            redirectToHub();
          }
        } else {
          // Sem token e sem sessão - redirecionar para Hub
          console.log('❌ Sem token SSO, redirecionando para Hub...');
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

### Passo 4: Integrar no App Principal

No seu arquivo principal (ex: `src/App.tsx` ou `src/main.tsx`):

```typescript
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated, error } = useSSO();

  // Mostrar loading enquanto verifica SSO
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

  // Se não autenticado, o hook já redireciona automaticamente
  // Mas você pode mostrar uma mensagem enquanto redireciona
  if (!authenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Redirecionando para o Hub...</p>
        </div>
      </div>
    );
  }

  // Usuário autenticado! Renderizar app normalmente
  return (
    <YourApp user={user} />
  );
}

export default App;
```

### Passo 5: Usar Dados do Usuário

Agora você pode usar os dados do usuário autenticado em qualquer componente:

```typescript
import { useSSO } from './hooks/useSSO';

function Dashboard() {
  const { user } = useSSO();

  return (
    <div>
      <h1>Bem-vindo, {user?.name || user?.email}!</h1>
      <p>Projeto: {user?.projectName}</p>
      <p>Permissões: {user?.permissions.length} permissões ativas</p>
    </div>
  );
}
```

---

## 🔧 Configurações Adicionais

### Opcional: Criar Sessão Supabase Local

Se você quiser criar uma sessão Supabase local para usar outras funcionalidades do Supabase:

```typescript
import { supabase } from '@/lib/supabase';

// Após validar o token SSO
const { data: sessionData } = await supabase.rpc('validate_sso_token', {
  _token: ssoToken,
});

// Criar sessão local (opcional)
// Nota: Isso requer configuração adicional no Supabase
// Por padrão, o token SSO já fornece todas as informações necessárias
```

### Opcional: Logout

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

### Erros Comuns

1. **"Token SSO inválido"**
   - Verifique se o token está na URL: `?sso_token=...&from=arruda-hub`
   - Verifique se o token não expirou (válido por 12 horas)
   - Verifique se as credenciais do Supabase estão corretas

2. **"Redirecionando para Hub"**
   - Isso é normal se não houver token SSO
   - O usuário será redirecionado automaticamente para fazer login no Hub

3. **"Erro ao validar token SSO"**
   - Verifique a conexão com o Supabase
   - Verifique se a função `validate_sso_token` existe no banco
   - Verifique os logs do console para mais detalhes

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

## 📚 Recursos Adicionais

- **Exemplo Completo**: Veja `examples/useSSO.ts` no repositório do Hub Central
- **Documentação SSO**: Veja `docs/SSO_INTEGRATION.md` para mais detalhes
- **Guia Rápido**: Veja `docs/SSO_QUICK_START.md` para implementação rápida

---

## 🆘 Suporte

Se encontrar problemas durante a implementação:

1. Verifique os logs do console do navegador
2. Verifique se o token está sendo gerado corretamente no Hub
3. Verifique se a função `validate_sso_token` está acessível no Supabase
4. Entre em contato com a equipe do Hub Central

---

**Última atualização**: 15 de Novembro de 2025
**Versão**: 1.0.0

