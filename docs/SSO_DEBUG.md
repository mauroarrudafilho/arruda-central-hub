# 🔍 Debug SSO - Token não está sendo armazenado corretamente

## ⚠️ Problema Identificado

O token SSO está sendo gerado e adicionado à URL, mas **não está sendo armazenado corretamente** na tabela `user_sessions` do banco de dados. Quando o módulo externo tenta validar o token usando `validate_sso_token`, ele não encontra a sessão porque:

1. **Falta constraint única**: A função `generate_sso_token` usa `ON CONFLICT (user_id, frontend_module)`, mas a tabela `user_sessions` não tinha essa constraint única, causando erro silencioso na inserção.

2. **Falta campo status**: A função tenta usar o campo `status` que não existia na tabela `user_sessions`.

## ✅ Solução Implementada

Foi criada uma migration (`20250204000000_fix_user_sessions_for_sso.sql`) que:
- Adiciona o campo `status` à tabela `user_sessions` (valores: 'ativo', 'inativo', 'expirado')
- Adiciona constraint única em `(user_id, frontend_module)` para permitir o `ON CONFLICT` funcionar corretamente

**⚠️ IMPORTANTE**: Execute a migration antes de testar novamente!

## 📋 Como o Sistema Funciona

O sistema SSO usa a tabela `user_sessions` (não `sso_sessions` como mencionado em alguns documentos):

1. **Hub Central** chama `generate_sso_token(_project_slug)` que:
   - Gera um token único
   - Insere/atualiza sessão na tabela `user_sessions`
   - Retorna o token para ser adicionado à URL

2. **Módulo Externo** recebe `?sso_token=TOKEN&from=arruda-hub` e chama `validate_sso_token(_token)` que:
   - Busca a sessão na tabela `user_sessions`
   - Valida se está ativa e não expirada
   - Retorna informações do usuário e permissões

## 🔧 Problemas Anteriores (Resolvidos)

### Problema 1: Token não aparece na URL

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

1. **Execute a migration** `20250204000000_fix_user_sessions_for_sso.sql` no banco de dados
2. **Teste novamente** e verifique o console do Hub
3. **Verifique a URL** que foi aberta (deve conter o token)
4. **Verifique no banco** se a sessão foi criada:
   ```sql
   SELECT * FROM user_sessions 
   WHERE session_token = 'TOKEN_AQUI'
   ORDER BY created_at DESC;
   ```
5. **Se a URL tem o token mas a validação falha**, verifique se a sessão existe no banco
6. **Se a URL não tem o token**, o problema está no Hub - verifique os logs do console

## 🗄️ Estrutura da Tabela user_sessions

A tabela `user_sessions` armazena as sessões SSO com os seguintes campos:
- `id`: UUID único
- `user_id`: ID do usuário autenticado
- `project_id`: ID do projeto/módulo
- `session_token`: Token único usado na URL (UNIQUE)
- `frontend_module`: Nome do módulo (ex: 'arruda-catalog-maker')
- `frontend_origin`: Origem do frontend
- `status`: Status da sessão ('ativo', 'inativo', 'expirado')
- `expires_at`: Data de expiração (12 horas após criação)
- `last_activity`: Última atividade
- `created_at`, `updated_at`: Timestamps

**Constraint única**: `(user_id, frontend_module)` - garante uma sessão ativa por usuário/módulo

