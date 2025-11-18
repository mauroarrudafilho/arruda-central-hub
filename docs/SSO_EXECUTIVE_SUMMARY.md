# 📄 Resumo Executivo - Integração SSO

## 🎯 Objetivo

Permitir que usuários autenticados no Arruda Central Hub acessem módulos externos **automaticamente**, sem necessidade de fazer login novamente.

## ✅ O que já está funcionando

- ✅ Hub Central gera token SSO ao clicar em módulos
- ✅ Token é passado na URL: `?sso_token=TOKEN&from=arruda-hub`
- ✅ Token válido por **12 horas**
- ✅ Funções `generate_sso_token` e `validate_sso_token` estão no banco

## 🔧 O que os módulos precisam fazer

### Passo 1: Instalar Supabase
```bash
npm install @supabase/supabase-js
```

### Passo 2: Copiar Hook
Copiar `examples/useSSO.ts` para `src/hooks/useSSO.ts` no módulo

### Passo 3: Usar no App
```typescript
import { useSSO } from './hooks/useSSO';

function App() {
  const { user, loading, authenticated } = useSSO();
  
  if (loading) return <Loading />;
  if (!authenticated) return null; // Redireciona automaticamente
  
  return <YourApp user={user} />;
}
```

## 📚 Documentação Completa

- **Guia Completo**: `docs/SSO_MODULE_INTEGRATION_GUIDE.md`
- **Comandos Prontos**: `docs/SSO_IMPLEMENTATION_COMMAND.md`
- **Exemplo de Código**: `examples/useSSO.ts`

## 🔑 Credenciais Supabase

```
URL: https://kgzybpelluftexrewyke.supabase.co
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI
```

## ⚡ Tempo de Implementação

- **Experiência**: ~15 minutos
- **Iniciante**: ~30 minutos

## 🎁 Benefícios

- ✅ Usuário não precisa fazer login em cada módulo
- ✅ Sessão persiste por 12 horas
- ✅ Redirecionamento automático se token expirar
- ✅ Dados do usuário e permissões disponíveis automaticamente

---

**Pronto para implementar?** Veja `docs/SSO_IMPLEMENTATION_COMMAND.md` para comandos copy & paste.

