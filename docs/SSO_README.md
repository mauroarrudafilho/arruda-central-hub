# 🔐 Documentação SSO - Arruda Central Hub

Bem-vindo à documentação completa do sistema de Single Sign-On (SSO) do Arruda Central Hub.

> ⭐ **⭐ DOCUMENTO PRINCIPAL E DEFINITIVO ⭐**  
> **[SSO_GLOBAL_SOLUTION.md](./SSO_GLOBAL_SOLUTION.md)** - Solução global e completa para todos os problemas de SSO, incluindo:
> - Envio automático de token em requisições
> - Validação entre telas
> - Renovação automática
> - Sincronização entre abas
> - Tratamento de erros
> 
> **Use este documento para implementação completa em qualquer módulo externo.**

## 📚 Documentos Disponíveis

### 🚀 Para Começar Rápido

1. **[Resumo Executivo](SSO_EXECUTIVE_SUMMARY.md)** ⭐
   - Visão geral rápida
   - O que já funciona
   - O que precisa ser feito
   - Tempo estimado de implementação

2. **[Comandos Prontos](SSO_IMPLEMENTATION_COMMAND.md)** ⭐
   - Copy & paste direto
   - Código pronto para usar
   - Implementação em 15-30 minutos

3. **[Guia Rápido](SSO_QUICK_START.md)**
   - Implementação em 5 minutos
   - Passos essenciais

### 📖 Documentação Completa

4. **[Guia de Integração Completo](SSO_MODULE_INTEGRATION_GUIDE.md)** ⭐⭐⭐
   - Documentação detalhada
   - Explicação de cada passo
   - Exemplos de código
   - Troubleshooting
   - Checklist completo

5. **[Integração SSO](SSO_INTEGRATION.md)**
   - Visão técnica do sistema
   - Fluxo de autenticação
   - Arquitetura

6. **[Passos de Implementação](SSO_IMPLEMENTATION_STEPS.md)**
   - Passo a passo detalhado
   - O que já está funcionando
   - O que precisa ser feito

### 🔧 Configuração e Troubleshooting

7. **[Configuração Vercel](SSO_VERCEL_SETUP.md)**
   - Headers CORS
   - Configuração de deploy
   - Problemas comuns

8. **[Debug SSO](SSO_DEBUG.md)**
   - Como debugar problemas
   - Logs e mensagens de erro
   - Soluções comuns

### 💻 Exemplos de Código

- **`examples/useSSO.ts`** - Hook completo pronto para usar
- **`examples/AppWithSSO.tsx`** - Exemplo de integração no App
- **`examples/sso-integration-example.tsx`** - Exemplo completo

---

## 🎯 Qual Documento Usar?

### ⭐ Para implementação completa e resolver TODOS os problemas:
👉 **[SSO_GLOBAL_SOLUTION.md](SSO_GLOBAL_SOLUTION.md)** ⭐ **RECOMENDADO**

### Se você quer implementar rápido (versão básica):
👉 **[SSO_IMPLEMENTATION_COMMAND.md](SSO_IMPLEMENTATION_COMMAND.md)**

### Se você quer entender COMO funciona:
👉 **[SSO_MODULE_INTEGRATION_GUIDE.md](SSO_MODULE_INTEGRATION_GUIDE.md)**

### Se você tem problemas específicos:
👉 **[SSO_DEBUG.md](SSO_DEBUG.md)**  
👉 **[SSO_FIX_CATALOG_MAKER_AUTH.md](SSO_FIX_CATALOG_MAKER_AUTH.md)** (erro "User not authenticated")

### Se você quer uma visão geral:
👉 **[SSO_EXECUTIVE_SUMMARY.md](SSO_EXECUTIVE_SUMMARY.md)**

---

## ⚡ Implementação Rápida (TL;DR)

```bash
# 1. Instalar
npm install @supabase/supabase-js

# 2. Copiar hook
cp examples/useSSO.ts src/hooks/useSSO.ts

# 3. Usar no App.tsx
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated } = useSSO();
  if (loading) return <Loading />;
  if (!authenticated) return null;
  return <YourApp user={user} />;
}
```

**Pronto!** 🎉

---

## 🔑 Informações Importantes

- **Token SSO**: Válido por **12 horas**
- **URL do Hub**: `https://arruda-central-hub.vercel.app/hub`
- **Supabase URL**: `https://kgzybpelluftexrewyke.supabase.co`
- **Função de Validação**: `validate_sso_token`

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console do navegador
2. Consulte [SSO_DEBUG.md](SSO_DEBUG.md)
3. Verifique se o token está na URL: `?sso_token=...&from=arruda-hub`
4. Entre em contato com a equipe do Hub Central

---

**Última atualização**: 05 de Fevereiro de 2025  
**Documento Principal**: [SSO_GLOBAL_SOLUTION.md](./SSO_GLOBAL_SOLUTION.md)

