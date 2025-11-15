# 🔐 Guia de Integração SSO - Arruda Hub

Este documento explica como integrar o Single Sign-On (SSO) do Arruda Hub nos módulos externos.

## 📋 Visão Geral

Quando um usuário faz login no Hub Central e clica em um módulo externo, o Hub gera um token SSO temporário e o passa na URL. O módulo externo deve validar esse token e autenticar o usuário automaticamente.

## 🔑 Fluxo de Autenticação

1. **Usuário faz login no Hub Central** → Sessão criada no Supabase
2. **Usuário clica em um módulo externo** → Hub gera token SSO
3. **Hub redireciona com token** → `https://modulo-externo.vercel.app/?sso_token=TOKEN&from=arruda-hub`
4. **Módulo valida token** → Chama função RPC `validate_sso_token`
5. **Módulo autentica usuário** → Cria sessão local se necessário

## 🛠️ Implementação no Módulo Externo

### Passo 1: Verificar Token na URL

```typescript
// No componente principal do módulo (ex: App.tsx ou main.tsx)
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-aqui';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSSOToken();
  }, []);

  const checkSSOToken = async () => {
    // Verificar se há token SSO na URL
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('sso_token');
    const fromHub = urlParams.get('from') === 'arruda-hub';

    if (ssoToken && fromHub) {
      // Validar token SSO
      const { data, error } = await supabase.rpc('validate_sso_token', {
        _token: ssoToken,
      });

      if (error || !data || data.length === 0 || !data[0].is_valid) {
        console.error('Token SSO inválido:', error);
        // Redirecionar para login ou mostrar erro
        redirectToLogin();
        return;
      }

      const sessionData = data[0];
      
      // Criar sessão local do Supabase com o usuário
      // Opção 1: Se você tem acesso ao JWT do usuário, pode criar sessão diretamente
      // Opção 2: Usar o user_id para buscar dados do usuário e criar sessão local
      
      // Exemplo: Buscar dados do usuário e criar sessão
      const { data: profile } = await supabase
        .from('rbac_auth_profile')
        .select('*')
        .eq('user_id', sessionData.user_id)
        .single();

      if (profile) {
        // Criar sessão local (ajuste conforme sua implementação)
        await createLocalSession(sessionData, profile);
        
        // Limpar token da URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // Verificar se já existe sessão local
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        redirectToLogin();
      }
    }

    setLoading(false);
  };

  const createLocalSession = async (sessionData: any, profile: any) => {
    // Implementar criação de sessão local conforme sua necessidade
    // Pode usar localStorage, context, ou estado global
    setUser({
      id: sessionData.user_id,
      email: sessionData.user_email,
      name: sessionData.user_name,
      permissions: sessionData.permissions,
      project: {
        id: sessionData.project_id,
        slug: sessionData.project_slug,
        name: sessionData.project_name,
      },
    });
  };

  const redirectToLogin = () => {
    // Redirecionar para página de login ou Hub Central
    window.location.href = 'https://arruda-central-hub.vercel.app/auth';
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Redirecionando para login...</div>;
  }

  return (
    <div>
      {/* Seu app aqui */}
    </div>
  );
}
```

### Passo 2: Validar Permissões

```typescript
// Hook para verificar permissões
const usePermissions = () => {
  const checkPermission = (permission: string, module?: string, action?: string) => {
    // Verificar nas permissões retornadas pelo validate_sso_token
    return user?.permissions?.some((p: any) => {
      if (module && p.module !== module) return false;
      if (action && p.action !== action) return false;
      return p.permission === permission && p.granted;
    }) ?? false;
  };

  return { checkPermission };
};
```

### Passo 3: Proteger Rotas

```typescript
// Componente de rota protegida
const ProtectedRoute = ({ children, requiredPermission }: any) => {
  const { checkPermission } = usePermissions();

  if (!checkPermission(requiredPermission)) {
    return <div>Acesso negado</div>;
  }

  return children;
};
```

## 🔒 Segurança

### Boas Práticas

1. **Sempre validar o token no servidor** - Não confie apenas no frontend
2. **Remover token da URL após uso** - Evitar exposição em logs/histórico
3. **Validar expiração** - Tokens expiram em 24 horas
4. **Verificar origem** - Validar que o token veio do Hub Central
5. **Usar HTTPS** - Sempre em produção

### Validação Adicional

```typescript
// Validar que o token não foi usado antes (opcional)
const validateTokenFreshness = async (token: string) => {
  const { data } = await supabase
    .from('user_sessions')
    .select('last_activity')
    .eq('session_token', token)
    .single();

  // Se last_activity é muito recente, pode ser reuso suspeito
  const lastActivity = new Date(data.last_activity);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActivity.getTime()) / 1000 / 60;

  return diffMinutes < 5; // Token usado nos últimos 5 minutos
};
```

## 📝 Exemplo Completo

Veja o arquivo `examples/acordos-frontend-integration.tsx` para um exemplo completo de integração.

## 🐛 Troubleshooting

### Token inválido ou expirado
- Verificar se o token foi gerado recentemente
- Verificar se o usuário ainda tem acesso ao projeto
- Verificar se a sessão não foi encerrada manualmente

### Usuário não autenticado
- Verificar se o token está sendo passado corretamente na URL
- Verificar se a função `validate_sso_token` está retornando dados corretos
- Verificar logs do Supabase para erros

### Permissões não funcionando
- Verificar se as permissões estão sendo retornadas corretamente
- Verificar se o usuário tem as permissões necessárias no banco
- Verificar se a estrutura de permissões está correta

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do Supabase ou entre em contato com a equipe de desenvolvimento.

