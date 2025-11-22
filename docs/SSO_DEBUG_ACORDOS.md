# 🔍 Guia de Debug: SSO no Módulo de Acordos

## Problema
Ao clicar no card de Acordos Comerciais no Hub Central, o módulo de acordos abre mas redireciona de volta para o Hub ao invés de autenticar via SSO.

---

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar se o Token está na URL

Quando a página de acordos abrir, verifique a URL no navegador. Deve ter:
```
https://acordo-flow.vercel.app/?sso_token=TOKEN_AQUI&from=arruda-hub&_t=...
```

**Se não tiver o token na URL:**
- O problema está no Hub Central (não está passando o token)
- Verifique os logs do Hub Central para ver se `generate_sso_token` está funcionando

**Se tiver o token na URL:**
- Continue para o próximo passo

---

### 2. Verificar Logs do Console (Módulo de Acordos)

Abra o DevTools (F12) na página de acordos e verifique os logs:

#### ✅ Logs Esperados (Funcionando):
```
🔑 Token SSO encontrado na URL, validando...
✅ Token SSO válido! { user: "...", project: "..." }
✅ Sessão restaurada do localStorage
```

#### ❌ Logs de Erro (Problema):
```
❌ Token SSO inválido: [erro]
❌ Token SSO inválido ou expirado
ℹ️ Não há token SSO na URL ou parâmetro from incorreto
```

---

### 3. Verificar Implementação do Módulo de Acordos

O módulo de acordos DEVE ter:

#### ✅ Arquivo `src/lib/supabase.ts` com interceptor:
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon';

const getSSOToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('arruda_sso_token');
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Interceptor
const originalFetch = supabase.rest.fetch;
supabase.rest.fetch = async (url, options = {}) => {
  const ssoToken = getSSOToken();
  const headers = new Headers(options.headers);
  if (ssoToken) {
    headers.set('x-sso-token', ssoToken);
  }
  return originalFetch(url, { ...options, headers });
};
```

#### ✅ Hook `useSSO` implementado:
```typescript
import { useSSO } from '@/hooks/useSSO';

function App() {
  const { user, loading, authenticated, error } = useSSO();
  
  if (loading) return <div>Carregando...</div>;
  if (!authenticated) return <div>Redirecionando...</div>;
  
  return <div>Bem-vindo, {user?.name}!</div>;
}
```

---

### 4. Verificar Requisição de Validação

No DevTools, vá na aba **Network** e procure por:
- Requisição: `validate_sso_token`
- Método: `POST`
- Status: `200 OK`

**Se a requisição falhar (erro 400/500):**
- Verifique o erro retornado
- Pode ser problema no banco de dados ou na função RPC

**Se a requisição for bem-sucedida mas `is_valid: false`:**
- Token pode estar expirado
- Token pode não existir na tabela `user_sessions`
- Verifique se o token foi gerado corretamente no Hub Central

---

### 5. Verificar localStorage

No DevTools, vá em **Application > Local Storage** e verifique:

**Após validação bem-sucedida, deve ter:**
- `arruda_sso_user`: Objeto JSON com dados do usuário
- `arruda_sso_token`: Token SSO (string)
- `arruda_sso_expires`: Data de expiração

**Se não tiver esses itens:**
- A validação falhou
- O token não foi salvo
- Verifique os logs de erro

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Token SSO inválido ou expirado"

**Causa:** Token não existe na tabela `user_sessions` ou expirou

**Solução:**
1. Verificar se o token foi gerado corretamente no Hub Central
2. Verificar se o token existe no banco:
```sql
SELECT * FROM user_sessions 
WHERE session_token = 'SEU_TOKEN_AQUI' 
AND status = 'ativo' 
AND expires_at > NOW();
```

### Problema 2: "Não há token SSO na URL"

**Causa:** O módulo não está encontrando o token na URL

**Solução:**
1. Verificar se a URL tem `?sso_token=...&from=arruda-hub`
2. Verificar se o código está lendo a URL corretamente:
```typescript
const urlParams = new URLSearchParams(window.location.search);
const ssoToken = urlParams.get('sso_token');
const fromHub = urlParams.get('from') === 'arruda-hub';
```

### Problema 3: Redireciona mesmo com token válido

**Causa:** Lógica de redirecionamento está sendo executada antes da validação

**Solução:**
1. Verificar se `checkSSO()` está sendo chamado no `useEffect`
2. Verificar se não há redirecionamento automático no `App.tsx` ou `AuthGuard`
3. Verificar se `authenticated` está sendo verificado corretamente

### Problema 4: "User not authenticated" em outras funções RPC

**Causa:** Interceptor não está enviando o header `x-sso-token`

**Solução:**
1. Verificar se o interceptor está implementado corretamente
2. Verificar se o token está no localStorage antes de fazer requisições
3. Verificar no Network tab se o header `x-sso-token` está presente

---

## 📋 Checklist de Verificação

- [ ] Token está presente na URL quando a página abre
- [ ] Logs mostram "Token SSO encontrado na URL"
- [ ] Requisição `validate_sso_token` retorna `200 OK`
- [ ] Resposta tem `is_valid: true`
- [ ] localStorage tem `arruda_sso_user`, `arruda_sso_token`, `arruda_sso_expires`
- [ ] Não há redirecionamento automático para `/login` ou `/hub`
- [ ] Hook `useSSO` está sendo usado no componente principal
- [ ] Cliente Supabase tem interceptor configurado
- [ ] `persistSession: false` no cliente Supabase

---

## 🔧 Próximos Passos

1. **Verificar logs do console** na página de acordos quando ela abre
2. **Verificar Network tab** para ver a requisição `validate_sso_token`
3. **Verificar localStorage** para ver se o token foi salvo
4. **Compartilhar os logs** para diagnóstico mais preciso

---

## 📞 Informações para Debug

Quando reportar o problema, inclua:

1. **URL completa** quando a página de acordos abre
2. **Logs do console** (todos os logs relacionados a SSO)
3. **Requisição Network** da chamada `validate_sso_token` (status, resposta)
4. **Conteúdo do localStorage** (apenas as chaves, não os valores completos)
5. **Código do `useSSO`** usado no módulo de acordos (se possível)

