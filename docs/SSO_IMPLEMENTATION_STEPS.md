# 🚀 Passos para Implementar SSO nos Módulos Externos

## ⚠️ Situação Atual

O Hub Central está gerando e passando o token SSO corretamente na URL, mas os módulos externos ainda não estão validando esse token. Por isso, os usuários ainda precisam fazer login manualmente.

## ✅ O que já está funcionando

- ✅ Hub gera token SSO quando usuário clica em um módulo
- ✅ Token é passado na URL: `?sso_token=TOKEN&from=arruda-hub`
- ✅ Funções `generate_sso_token` e `validate_sso_token` estão no banco

## 🔧 O que precisa ser feito

Cada módulo externo precisa implementar a validação do token SSO.

---

## 📋 Passo a Passo

### 1. Copiar arquivo `useSSO.ts`

Copie o arquivo `examples/useSSO.ts` para o seu projeto:

```bash
# No seu módulo externo
cp examples/useSSO.ts src/hooks/useSSO.ts
```

### 2. Ajustar constantes

Abra `src/hooks/useSSO.ts` e verifique se as constantes estão corretas:

```typescript
const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-aqui'; // ⚠️ Verifique se está correto
const HUB_URL = 'https://arruda-central-hub.vercel.app/hub';
```

### 3. Instalar dependência (se necessário)

```bash
npm install @supabase/supabase-js
# ou
yarn add @supabase/supabase-js
```

### 4. Usar no App.tsx

Substitua ou modifique seu `App.tsx`:

```typescript
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated } = useSSO();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return null; // Hook já redireciona automaticamente
  }

  // Usuário autenticado! Renderizar app normalmente
  return <YourApp user={user} />;
}
```

### 5. Testar

1. Faça login no Hub Central
2. Clique em um módulo externo
3. O módulo deve autenticar automaticamente sem pedir login

---

## 🔍 Debug

### Verificar se o token está na URL

Abra o console do navegador e verifique:

```javascript
// Deve mostrar o token
console.log(new URLSearchParams(window.location.search).get('sso_token'));
```

### Verificar erros no console

Se houver erros ao chamar `validate_sso_token`, verifique:

1. **Supabase URL/Key corretos?**
2. **Função existe no banco?** (já verificamos - existe ✅)
3. **Token está sendo passado?** (verificar URL)

### Logs do hook

O hook `useSSO` já inclui logs no console:
- `🔑 Token SSO encontrado na URL, validando...`
- `✅ Token SSO válido!`
- `❌ Token SSO inválido ou expirado`

---

## 📝 Módulos que precisam implementar

- [ ] **Acordos Comerciais** (`acordo-flow.vercel.app`)
- [ ] **Comercial Plus** (`arruda-sales-boost.vercel.app`)
- [ ] **Trade Marketing** (`degusta-go.vercel.app`)
- [ ] **Financeiro** (`arruda-flow-buddy.vercel.app`)
- [ ] **Meus Produtos** (`arruda-catalog-maker.vercel.app`)
- [ ] **Meus Documentos** (`nfe-radar.vercel.app`)

---

## 🎯 Exemplo Completo

Veja `examples/AppWithSSO.tsx` para um exemplo completo de implementação.

---

## ❓ Dúvidas?

Se tiver problemas, verifique:
1. Console do navegador para erros
2. Network tab para ver se a chamada RPC está sendo feita
3. Se o token está na URL quando o módulo carrega

