# 🚀 Quick Start - Integração SSO Módulo de Acordos

**Guia rápido para implementar SSO no módulo de Acordos Comerciais.**

---

## ⚡ Implementação Rápida (5 minutos)

### 1. Instalar Dependência

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Supabase

Crie `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 3. Copiar Hook useSSO

Copie o arquivo `examples/useSSO.ts` do repositório do Hub Central para `src/hooks/useSSO.ts` no seu projeto.

### 4. Integrar no App.tsx

```typescript
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSSO } from './hooks/useSSO';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, authenticated, hasSSOToken } = useSSO();

  // ⚠️ IMPORTANTE: Redirecionar após autenticação SSO
  useEffect(() => {
    if (!loading && authenticated && hasSSOToken && user) {
      if (location.pathname === '/login' || location.pathname === '/auth') {
        navigate('/dashboard', { replace: true }); // Ajuste a rota
      }
    }
  }, [loading, authenticated, hasSSOToken, user, location.pathname, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated || !hasSSOToken) {
    window.location.href = 'https://arruda-central-hub.vercel.app/hub';
    return null;
  }

  return <YourApp user={user} />;
}
```

---

## 📋 O Que o Hub Envia

Quando o usuário clica em "Acordos Comerciais" no Hub, ele é redirecionado para:

```
https://acordo-flow.vercel.app/?sso_token=TOKEN&from=arruda-hub
```

**Parâmetros:**
- `sso_token`: Token SSO (válido por 12 horas)
- `from`: `arruda-hub` (case-sensitive)

---

## ✅ Checklist Mínimo

- [ ] Instalar `@supabase/supabase-js`
- [ ] Configurar cliente Supabase
- [ ] Copiar hook `useSSO`
- [ ] Integrar no `App.tsx` com redirecionamento automático
- [ ] Testar: Login no Hub → Clicar em Acordos → Deve redirecionar automaticamente

---

## 📚 Documentação Completa

Para detalhes completos, veja: **`docs/SSO_INTEGRATION_ACORDOS.md`**

---

**Última atualização**: 18 de Novembro de 2025

