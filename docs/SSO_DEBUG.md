# 🔍 Debug SSO - Token não aparece na URL

## Problema Identificado

Quando você clica em um módulo externo no Hub, a URL não contém o token SSO (`?sso_token=...&from=arruda-hub`).

## Possíveis Causas

### 1. Módulo externo redireciona antes de processar o token

**Sintoma**: URL mostra `/login` sem parâmetros

**Causa**: O módulo externo tem um guard/proteção de rota que redireciona para `/login` antes de verificar o token SSO na URL.

**Solução**: O módulo precisa verificar o token SSO **antes** de qualquer redirecionamento.

### 2. Token não está sendo gerado

**Como verificar**: Abra o console do navegador no Hub e clique em um módulo. Você deve ver:

```
✅ Token SSO gerado e adicionado à URL: { project: "...", url: "...", hasToken: true }
```

Se não aparecer essa mensagem ou aparecer `hasToken: false`, o token não está sendo gerado.

### 3. URL sendo construída incorretamente

**Como verificar**: No console do Hub, verifique se a URL completa contém os parâmetros:

```javascript
// No console do Hub, antes de clicar
// Depois de clicar, verifique a URL que foi aberta
```

## 🔧 Solução Passo a Passo

### Passo 1: Verificar se o token está sendo gerado no Hub

1. Abra o console do navegador no Hub
2. Clique em um módulo externo
3. Procure pela mensagem: `✅ Token SSO gerado e adicionado à URL`
4. Verifique se `hasToken: true` e se a URL contém `?sso_token=...`

### Passo 2: Verificar a URL que foi aberta

1. Na nova aba que abriu, verifique a URL na barra de endereços
2. Se a URL **não** contém `?sso_token=...`, o problema está no Hub
3. Se a URL **contém** `?sso_token=...` mas o módulo redireciona para `/login`, o problema está no módulo externo

### Passo 3: Implementar validação SSO no módulo externo

Se a URL contém o token mas o módulo redireciona para `/login`, você precisa:

1. **Verificar o token ANTES de qualquer redirecionamento**
2. Usar o hook `useSSO` fornecido em `examples/useSSO.ts`
3. Garantir que o guard de autenticação verifica o token SSO primeiro

## 📝 Exemplo de Implementação Correta

```typescript
// ❌ ERRADO - Redireciona antes de verificar SSO
function App() {
  const { user } = useAuth();
  
  if (!user) {
    navigate('/login'); // ❌ Isso remove os parâmetros da URL!
    return null;
  }
  
  return <YourApp />;
}

// ✅ CORRETO - Verifica SSO antes de redirecionar
function App() {
  const { user, loading, authenticated } = useSSO(); // Hook SSO primeiro!
  
  if (loading) return <Loading />;
  
  if (!authenticated) {
    return null; // Hook já redireciona automaticamente
  }
  
  // Agora pode usar o usuário autenticado via SSO
  return <YourApp user={user} />;
}
```

## 🐛 Debug no Console

### No Hub (antes de clicar no módulo):

```javascript
// Adicione um breakpoint ou log aqui
console.log('Clicando no módulo:', project.nome);
```

### No Módulo Externo (quando a página carrega):

```javascript
// Adicione no início do App.tsx do módulo externo
console.log('URL atual:', window.location.href);
console.log('Parâmetros:', new URLSearchParams(window.location.search).toString());
console.log('Token SSO:', new URLSearchParams(window.location.search).get('sso_token'));
```

## ✅ Checklist

- [ ] Console do Hub mostra `✅ Token SSO gerado`
- [ ] URL aberta contém `?sso_token=...&from=arruda-hub`
- [ ] Módulo externo verifica token **antes** de redirecionar
- [ ] Hook `useSSO` está implementado no módulo externo
- [ ] Não há redirecionamentos que removem os parâmetros da URL

## 📞 Próximos Passos

1. **Teste novamente** e verifique o console do Hub
2. **Verifique a URL** que foi aberta (deve conter o token)
3. **Se a URL tem o token**, o problema está no módulo externo - precisa implementar validação SSO
4. **Se a URL não tem o token**, o problema está no Hub - me avise e investigo mais

