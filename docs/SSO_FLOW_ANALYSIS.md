# Análise Crítica do Fluxo SSO

## 📋 Resumo Executivo

Esta análise identifica **7 lacunas críticas** no fluxo de autenticação SSO que podem causar problemas em produção.

---

## ✅ Pontos Fortes (Funcionando Bem)

1. ✅ Validação do token sempre no servidor (via RPC)
2. ✅ Token removido da URL após salvar (segurança)
3. ✅ Verificação de expiração antes de usar
4. ✅ Revalidação do token em cada reload
5. ✅ Limpeza adequada no logout

---

## ⚠️ Lacunas Críticas Identificadas

### 1. **Token SSO não é usado em requisições subsequentes**

**Problema:**
- O token é salvo no `localStorage`, mas não é enviado como header em requisições subsequentes
- Após autenticar via SSO, as chamadas RPC/API do módulo externo não incluem o token SSO

**Impacto:**
- Módulos que precisam autenticar requisições não conseguem usar o token SSO
- Funcionalidade atual depende apenas da validação inicial

**Solução Sugerida:**
```typescript
// Criar interceptor para Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'x-sso-token': localStorage.getItem('arruda_sso_token') || '',
    },
  },
});
```

---

### 2. **Sem Refresh Automático do Token**

**Problema:**
- Token expira em 12 horas sem renovação automática
- Não há verificação proativa de expiração

**Impacto:**
- Usuário ativo pode ser deslogado subitamente após 12 horas
- Experiência ruim, especialmente para sessões longas

**Solução Sugerida:**
```typescript
// Verificar expiração periodicamente
useEffect(() => {
  const checkTokenExpiry = () => {
    const expires = localStorage.getItem('arruda_sso_expires');
    if (expires) {
      const expiresAt = new Date(expires);
      const now = new Date();
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
      
      // Renovar se faltar menos de 30 minutos
      if (minutesUntilExpiry < 30 && minutesUntilExpiry > 0) {
        refreshSSOToken();
      }
    }
  };
  
  const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // A cada 5 minutos
  return () => clearInterval(interval);
}, []);
```

---

### 3. **Sem Monitoramento de Expiração em Tempo Real**

**Problema:**
- Token só é verificado no reload da página ou na inicialização
- Durante uso ativo, não há verificação se o token ainda é válido

**Impacto:**
- Usuário pode estar usando a aplicação e o token expira sem aviso
- Falhas silenciosas em operações críticas

**Solução Sugerida:**
```typescript
// Verificar token antes de operações críticas
const performCriticalOperation = async () => {
  const token = localStorage.getItem('arruda_sso_token');
  if (token) {
    const { data } = await supabase.rpc('validate_sso_token', { _token: token });
    if (!data?.[0]?.is_valid) {
      // Token expirado, redirecionar ou renovar
      handleTokenExpired();
      return;
    }
  }
  // Continuar com operação...
};
```

---

### 4. **Sem Sincronização Entre Abas do Navegador**

**Problema:**
- Se o token é invalidado ou atualizado em uma aba, outras abas não são notificadas
- Estado inconsistente entre abas do mesmo domínio

**Impacto:**
- Usuário pode fazer logout em uma aba e continuar autenticado em outras
- Ou vice-versa: autenticar em uma aba e outras não saberem

**Solução Sugerida:**
```typescript
// Listener para mudanças no localStorage (outras abas)
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'arruda_sso_token' && e.newValue !== e.oldValue) {
      // Token mudou em outra aba
      if (!e.newValue) {
        // Token removido = logout
        handleLogout();
      } else {
        // Token atualizado = revalidar
        checkSSO();
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

---

### 5. **Dependência do Supabase Auth não está clara**

**Problema:**
- O módulo externo precisa do Supabase Auth configurado para chamar RPC `validate_sso_token`
- Mas não está claro se o módulo precisa estar autenticado no Supabase Auth para usar SSO

**Impacto:**
- Confusão na implementação
- Pode funcionar sem autenticação Supabase Auth (usando apenas SSO), mas isso não está documentado

**Clarificação Necessária:**
- Documentar que `validate_sso_token` é uma função `SECURITY DEFINER` que não requer autenticação Supabase Auth
- O SSO funciona de forma independente do Supabase Auth

---

### 6. **Falta Tratamento para Supabase Offline**

**Problema:**
- Se o Supabase estiver offline durante validação inicial, não há fallback claro
- O código apenas permite "acesso direto" mas não trata especificamente o caso offline

**Impacto:**
- Experiência ruim quando há problemas de rede
- Usuário pode ficar "preso" em estado de loading

**Solução Sugerida:**
```typescript
const checkSSO = async () => {
  try {
    // Tentar validar token
    const { data, error } = await supabase.rpc('validate_sso_token', { _token });
    
    if (error) {
      // Verificar se é erro de rede
      if (error.message.includes('network') || error.message.includes('fetch')) {
        // Supabase offline - usar cache se disponível
        const cachedUser = localStorage.getItem('arruda_sso_user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          setAuthenticated(true);
          // Mostrar aviso: "Modo offline - dados podem estar desatualizados"
          return;
        }
      }
      // Outros erros...
    }
  } catch (err) {
    // Tratamento de erro...
  }
};
```

---

### 7. **Possível Problema com Timezone na Verificação de Expiração**

**Problema:**
```typescript
const expiresAt = new Date(savedExpires); // Timestamp do servidor
if (expiresAt > new Date()) { // Data local do cliente
```
- Comparação entre timestamp do servidor (UTC) e data local do cliente
- Pode falhar dependendo do timezone

**Impacto:**
- Token válido pode ser considerado expirado (ou vice-versa)
- Especialmente problemático em fusos horários diferentes

**Solução Sugerida:**
```typescript
// Garantir comparação em UTC
const expiresAt = new Date(savedExpires); // Já está em UTC do servidor
const now = new Date(); // Também é UTC internamente

if (expiresAt.getTime() > now.getTime()) {
  // Token ainda válido
}
```

---

## 🎯 Priorização de Correções

### **Crítico (Corrigir Imediatamente)**
1. ⚠️ **Token não usado em requisições** - Se o módulo precisa autenticar API calls
2. ⚠️ **Problema de timezone** - Pode causar falsos positivos/negativos

### **Importante (Corrigir em Breve)**
3. 🔄 **Refresh automático** - Melhora significativa na UX
4. 🔄 **Monitoramento de expiração** - Evita falhas silenciosas
5. 🔄 **Sincronização entre abas** - Consistência de estado

### **Desejável (Melhorias)**
6. 📝 **Clarificar dependências** - Documentação
7. 🌐 **Tratamento offline** - Resilência

---

## 📊 Conclusão

O fluxo **funciona para casos básicos**, mas tem **lacunas importantes** que podem causar problemas em produção, especialmente:

1. Se módulos precisarem autenticar requisições subsequentes com o token SSO
2. Se usuários ficarem logados por mais de 12 horas
3. Se múltiplas abas forem usadas simultaneamente

**Recomendação:** Implementar pelo menos os itens **Críticos** e **Importantes** antes de considerar o fluxo "redondo" para produção.

