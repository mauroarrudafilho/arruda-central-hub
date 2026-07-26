# 📍 Direcionamento Completo do Token SSO

## 🎯 Como o Token SSO é Enviado pelo Hub Central

Este documento explica **exatamente** como o token SSO é gerado e enviado para os módulos externos, para que todas as páginas possam usá-lo corretamente.

---

## 🔄 Fluxo Completo de Envio do Token

### 1. **Geração do Token (Hub Central)**

Quando o usuário clica em um módulo externo (ex: Comercial+), o Hub Central:

```typescript
// src/pages/Hub.tsx - linha 418-529
const handleProjectAccess = async (project: NormalizedProject) => {
  // 1. Verifica se é projeto externo
  const isExternal = /^https?:\/\//i.test(project.targetRoute);
  
  if (isExternal && user) {
    // 2. Busca token pré-gerado ou gera novo
    const { getSSOToken, generateSSOTokenForModule } = await import('@/lib/sso-token-manager');
    const existingToken = getSSOToken(project.slug);
    
    let ssoToken: string | null = null;
    
    if (existingToken) {
      // Token pré-gerado válido - usar imediatamente
      ssoToken = existingToken.token;
    } else {
      // Gerar novo token via RPC
      const tokenData = await generateSSOTokenForModule(project.slug);
      ssoToken = tokenData?.token || null;
    }
    
    // 3. Adiciona token à URL
    if (ssoToken) {
      const url = new URL(project.targetRoute);
      url.searchParams.set('sso_token', ssoToken);      // ⚠️ Token na URL
      url.searchParams.set('from', 'arruda-hub');        // ⚠️ Identificador do Hub
      url.searchParams.set('_t', Date.now().toString()); // ⚠️ Timestamp (anti-cache)
      
      // 4. Redireciona para o módulo externo
      window.location.href = url.toString();
    }
  }
};
```

---

## 📋 Formato Exato da URL com Token

### **Exemplo: Comercial+**

**URL Base (do banco de dados):**
```
https://arruda-sales-boost.vercel.app
```

**URL Final com Token:**
```
https://arruda-sales-boost.vercel.app?sso_token=<TOKEN_BASE64>&from=arruda-hub&_t=1736208000000
```

### **Estrutura dos Parâmetros:**

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `sso_token` | `string` (Base64) | Token SSO gerado pelo Supabase (ex: `dGhpc2lzYXRva2Vu...`) |
| `from` | `"arruda-hub"` | Identificador fixo indicando que veio do Hub Central |
| `_t` | `number` (timestamp) | Timestamp para evitar cache do navegador |

---

## 🔑 Características do Token

### **Formato do Token:**
- **Tipo:** String Base64
- **Tamanho:** ~44 caracteres (32 bytes codificados em Base64)
- **Validade:** 12 horas
- **Geração:** Função RPC `generate_sso_token` no Supabase

### **Exemplo de Token:**
```
dGhpc2lzYXRva2VudGhhdG5lZWRzdG9iZXZhbGlkYXRlZA==
```

⚠️ **IMPORTANTE:** O token pode conter caracteres especiais como `+`, `/`, `=` que precisam ser **decodificados** corretamente na URL.

---

## 📥 Como Receber o Token no Módulo Externo

### **1. Ler Token da URL (CORRETO)**

```typescript
// ✅ CORRETO: Decodificar e trimar o token
const urlParams = new URLSearchParams(window.location.search);
const ssoTokenRaw = urlParams.get('sso_token');
const fromHub = urlParams.get('from') === 'arruda-hub';

// ⚠️ CRÍTICO: Decodificar token (caracteres especiais como + viram espaço sem isso)
let ssoToken: string | null = null;
if (ssoTokenRaw) {
  try {
    ssoToken = decodeURIComponent(ssoTokenRaw).trim();
  } catch (e) {
    ssoToken = ssoTokenRaw.trim();
  }
}
```

### **2. Validar Token**

```typescript
if (ssoToken && fromHub) {
  // Validar token via RPC
  const { data, error } = await supabase.rpc('validate_sso_token', {
    _token: ssoToken, // ⚠️ Já foi trimado acima
  });
  
  if (data && data[0]?.is_valid) {
    // Token válido - autenticar usuário
    const sessionData = data[0];
    // ... processar dados do usuário
  }
}
```

---

## 🗺️ Mapeamento Completo de Projetos

### **Tabela de Projetos e URLs**

| Nome do Projeto | Slug | URL Base | URL Final com Token |
|----------------|------|----------|---------------------|
| **Comercial+** | `arruda-sales-boost` | `https://arruda-sales-boost.vercel.app` | `https://arruda-sales-boost.vercel.app?sso_token=<TOKEN>&from=arruda-hub&_t=<TIMESTAMP>` |
| **Acordos Comerciais** | `acordo-flow` | `https://acordo-flow.vercel.app` | `https://acordo-flow.vercel.app?sso_token=<TOKEN>&from=arruda-hub&_t=<TIMESTAMP>` |
| **Financeiro** | `arruda-flow-buddy` | `https://arruda-flow-buddy.vercel.app/` | `https://arruda-flow-buddy.vercel.app/?sso_token=<TOKEN>&from=arruda-hub&_t=<TIMESTAMP>` |
| **Meus Produtos** | `arruda-catalog-maker` | `https://arruda-catalog-maker.vercel.app` | `https://arruda-catalog-maker.vercel.app?sso_token=<TOKEN>&from=arruda-hub&_t=<TIMESTAMP>` |
| **Trade Marketing** | `degusta-go-app` | `https://degusta-go.vercel.app/` | `https://degusta-go.vercel.app/?sso_token=<TOKEN>&from=arruda-hub&_t=<TIMESTAMP>` |
| **Meus Documentos** | `nfe-radar` | `https://nfe-radar.vercel.app/auth` | `https://nfe-radar.vercel.app/auth?sso_token=<TOKEN>&from=arruda-hub&_t=<TIMESTAMP>` |
| **Gestão de Usuários** | `arruda-rbac-master` | `https://arruda-rbac-master.vercel.app/auth` | `https://arruda-rbac-master.vercel.app/auth?sso_token=<TOKEN>&from=arruda-hub&_t=<TIMESTAMP>` |

---

## ⚠️ Pontos Críticos de Implementação

### **1. Decodificação do Token (OBRIGATÓRIO)**

```typescript
// ❌ ERRADO: Token pode ter caracteres especiais corrompidos
const ssoToken = urlParams.get('sso_token');

// ✅ CORRETO: Decodificar e trimar
let ssoToken: string | null = null;
if (ssoTokenRaw) {
  try {
    ssoToken = decodeURIComponent(ssoTokenRaw).trim();
  } catch (e) {
    ssoToken = ssoTokenRaw.trim();
  }
}
```

**Por quê?** Tokens Base64 podem conter `+`, `/`, `=` que são codificados na URL. Sem `decodeURIComponent()`, o token fica inválido.

### **2. Verificar Parâmetro `from` (SEGURANÇA)**

```typescript
// ⚠️ IMPORTANTE: Verificar origem do token
const fromHub = urlParams.get('from') === 'arruda-hub';

if (ssoToken && fromHub) {
  // Processar token SSO
}
```

**Por quê?** Garante que o token veio do Hub Central, não de outra fonte.

### **3. Parâmetro Correto na RPC**

```typescript
// ❌ ERRADO:
await supabase.rpc('validate_sso_token', { p_token: ssoToken });

// ✅ CORRETO:
await supabase.rpc('validate_sso_token', { _token: ssoToken });
```

**Por quê?** A função RPC espera `_token`, não `p_token`.

### **4. Limpar Token da URL Após Validação**

```typescript
// ⚠️ SEGURANÇA: Remover token da URL após processar
if (ssoToken && fromHub) {
  // Validar e processar token...
  
  // Limpar token da URL
  window.history.replaceState({}, '', window.location.pathname);
}
```

**Por quê?** Evita que o token fique exposto na barra de endereços ou seja compartilhado acidentalmente.

---

## 🔍 Exemplo Completo de Implementação

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useSSO = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSSO();
  }, []);

  const checkSSO = async () => {
    try {
      setLoading(true);

      // 1. Ler token da URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoTokenRaw = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      // 2. Decodificar token (CRÍTICO)
      let ssoToken: string | null = null;
      if (ssoTokenRaw) {
        try {
          ssoToken = decodeURIComponent(ssoTokenRaw).trim();
        } catch (e) {
          ssoToken = ssoTokenRaw.trim();
        }
      }

      // 3. Validar token se veio do Hub
      if (ssoToken && fromHub) {
        const { data, error } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (!error && data && data[0]?.is_valid) {
          const sessionData = data[0];
          
          // 4. Salvar dados do usuário
          setUser({
            id: sessionData.user_id,
            email: sessionData.user_email,
            name: sessionData.user_name,
            projectId: sessionData.project_id,
            projectSlug: sessionData.project_slug,
            projectName: sessionData.project_name,
            permissions: sessionData.permissions || [],
          });

          // 5. Salvar no localStorage para persistência
          localStorage.setItem('arruda_sso_user', JSON.stringify(sessionData));
          localStorage.setItem('arruda_sso_token', ssoToken);
          localStorage.setItem('arruda_sso_expires', sessionData.expires_at);

          // 6. Limpar token da URL (segurança)
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar SSO:', err);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading };
};
```

---

## 🧪 Como Testar

### **1. Verificar Token na URL**

Abra o console do navegador no módulo externo e execute:

```javascript
// Verificar parâmetros da URL
const urlParams = new URLSearchParams(window.location.search);
console.log('Token:', urlParams.get('sso_token'));
console.log('From:', urlParams.get('from'));
console.log('Timestamp:', urlParams.get('_t'));
```

### **2. Verificar Decodificação**

```javascript
const raw = urlParams.get('sso_token');
const decoded = decodeURIComponent(raw);
console.log('Raw:', raw);
console.log('Decoded:', decoded);
console.log('São iguais?', raw === decoded);
```

### **3. Validar Token Manualmente**

```javascript
const token = decodeURIComponent(urlParams.get('sso_token')).trim();
const { data, error } = await supabase.rpc('validate_sso_token', { _token: token });
console.log('Validation:', { data, error, isValid: data?.[0]?.is_valid });
```

---

## 📊 Fluxograma do Token SSO

```
┌─────────────────┐
│  Hub Central    │
│  (Usuário clica)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gerar Token SSO │
│ (RPC Supabase)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Construir URL   │
│ com parâmetros: │
│ - sso_token     │
│ - from          │
│ - _t            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirecionar    │
│ para módulo     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Módulo Externo  │
│ Recebe URL      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Decodificar     │
│ Token (decode   │
│ URIComponent)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validar Token   │
│ (RPC Supabase)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Autenticar      │
│ Usuário         │
└─────────────────┘
```

---

## 🔗 Referências

- **Código do Hub:** `src/pages/Hub.tsx` (linha 418-529)
- **Gerenciador de Tokens:** `src/lib/sso-token-manager.ts`
- **Função RPC de Geração:** `supabase/migrations/20250201000000_create_sso_token_function.sql`
- **Função RPC de Validação:** `supabase/migrations/20250201000000_create_sso_token_function.sql` (linha 134-231)
- **Guia de Correção Comercial+:** `docs/SSO_FIX_COMERCIAL_PLUS.md`
- **Guia de Correção Acordos:** `docs/SSO_FIX_ACORDOS_REDIRECT.md`

---

**Última atualização:** 2025-02-06  
**Status:** ✅ Documentação completa e atualizada


