# 🔧 Configuração SSO no Vercel

## ✅ O que já está configurado

1. **Funções no Supabase**: `generate_sso_token` e `validate_sso_token` estão criadas e funcionando
2. **Código no Hub**: O Hub já gera o token SSO e adiciona na URL ao clicar nos módulos
3. **Headers CORS**: Adicionados no `vercel.json` para permitir comunicação entre domínios

## 🔍 Como verificar se está funcionando

### 1. Verificar no Console do Hub

Quando você clica em um módulo, deve aparecer no console:

```
✅ Token SSO gerado e adicionado à URL: {
  project: "...",
  url: "https://modulo.vercel.app/?sso_token=TOKEN&from=arruda-hub",
  hasToken: true,
  tokenLength: 44,
  expiresAt: "2025-02-01T12:00:00Z"
}
```

### 2. Verificar na URL do módulo

Ao abrir o módulo, a URL deve conter:
```
https://modulo.vercel.app/?sso_token=TOKEN_AQUI&from=arruda-hub
```

### 3. Verificar se o módulo está validando

O módulo externo precisa implementar o hook `useSSO` para validar o token. Se não implementou, o token estará na URL mas não será usado.

## ⚠️ Problemas Comuns

### Problema 1: Token não aparece na URL

**Causa**: Erro ao gerar token ou usuário não autenticado

**Solução**: 
- Verifique o console do Hub para ver o erro
- Certifique-se de estar logado no Hub
- Verifique se o projeto tem `slug` correto no banco

### Problema 2: Token aparece mas módulo pede login

**Causa**: Módulo externo não implementou validação SSO

**Solução**: 
- O módulo precisa usar o hook `useSSO` (ver `examples/useSSO.ts`)
- O módulo precisa chamar `validate_sso_token` com o token da URL

### Problema 3: Erro de CORS

**Causa**: Headers CORS não configurados

**Solução**: 
- Já adicionamos headers CORS no `vercel.json`
- Faça novo deploy no Vercel para aplicar as mudanças

## 🚀 Próximos Passos

1. **Fazer deploy no Vercel** para aplicar os headers CORS:
   ```bash
   git add vercel.json
   git commit -m "Add CORS headers for SSO"
   git push
   ```

2. **Implementar SSO nos módulos externos**:
   - Copiar `examples/useSSO.ts` para cada módulo
   - Usar o hook no `App.tsx` de cada módulo

3. **Testar**:
   - Fazer login no Hub
   - Clicar em um módulo
   - Verificar se autentica automaticamente

## 📝 Notas Importantes

- O token SSO expira em **12 horas**
- O token é único por sessão e projeto
- O token é passado na URL, então não deve ser logado ou armazenado em logs
- Cada módulo precisa implementar a validação do token

