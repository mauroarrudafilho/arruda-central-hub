# 🔍 Script de Diagnóstico SSO - Módulo de Acordos

## Como Usar

1. Abra a página de acordos que foi redirecionada do Hub Central
2. Abra o DevTools (F12)
3. Vá na aba **Console**
4. Cole e execute o script abaixo

---

## Script de Diagnóstico

```javascript
// Script de Diagnóstico SSO para Módulo de Acordos
console.log('🔍 === DIAGNÓSTICO SSO ===');

// 1. Verificar URL
console.log('\n1️⃣ Verificando URL...');
const urlParams = new URLSearchParams(window.location.search);
const ssoToken = urlParams.get('sso_token');
const fromHub = urlParams.get('from');
console.log('📍 URL completa:', window.location.href);
console.log('🔑 Token na URL:', ssoToken ? '✅ Encontrado' : '❌ Não encontrado');
console.log('🏠 Parâmetro from:', fromHub);
console.log('✅ from === arruda-hub:', fromHub === 'arruda-hub');

// 2. Verificar localStorage
console.log('\n2️⃣ Verificando localStorage...');
const savedUser = localStorage.getItem('arruda_sso_user');
const savedToken = localStorage.getItem('arruda_sso_token');
const savedExpires = localStorage.getItem('arruda_sso_expires');
console.log('👤 arruda_sso_user:', savedUser ? '✅ Existe' : '❌ Não existe');
console.log('🔑 arruda_sso_token:', savedToken ? '✅ Existe' : '❌ Não existe');
console.log('⏰ arruda_sso_expires:', savedExpires ? `✅ ${savedExpires}` : '❌ Não existe');

if (savedExpires) {
  const expiresAt = new Date(savedExpires);
  const now = new Date();
  console.log('⏰ Token expira em:', expiresAt.toLocaleString());
  console.log('⏰ Agora:', now.toLocaleString());
  console.log('⏰ Token válido:', expiresAt > now ? '✅ Sim' : '❌ Não (expirado)');
}

// 3. Verificar se Supabase está disponível
console.log('\n3️⃣ Verificando Supabase...');
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase está disponível');
  
  // Tentar validar token se estiver na URL
  if (ssoToken) {
    console.log('\n4️⃣ Testando validação do token...');
    supabase.rpc('validate_sso_token', { _token: ssoToken })
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Erro ao validar token:', error);
        } else if (data && data.length > 0) {
          const result = data[0];
          console.log('📊 Resultado da validação:');
          console.log('  - is_valid:', result.is_valid ? '✅ Sim' : '❌ Não');
          console.log('  - user_id:', result.user_id || 'null');
          console.log('  - user_email:', result.user_email || 'null');
          console.log('  - project_slug:', result.project_slug || 'null');
          console.log('  - expires_at:', result.expires_at || 'null');
          
          if (result.is_valid) {
            console.log('\n✅ Token é VÁLIDO! O problema pode estar na lógica de redirecionamento.');
          } else {
            console.log('\n❌ Token é INVÁLIDO! Verifique se o token existe no banco de dados.');
          }
        } else {
          console.error('❌ Resposta vazia da validação');
        }
      })
      .catch(err => {
        console.error('❌ Erro ao chamar validate_sso_token:', err);
      });
  } else {
    console.log('⚠️ Não há token na URL para validar');
  }
} else {
  console.log('❌ Supabase não está disponível globalmente');
  console.log('💡 Verifique se o cliente Supabase está exportado corretamente');
}

// 5. Verificar se há redirecionamentos automáticos
console.log('\n5️⃣ Verificando redirecionamentos...');
const currentPath = window.location.pathname;
console.log('📍 Caminho atual:', currentPath);
if (currentPath === '/login' || currentPath.includes('login')) {
  console.log('⚠️ Página está em /login - pode haver redirecionamento automático');
}
if (currentPath === '/hub' || currentPath.includes('hub')) {
  console.log('⚠️ Página está em /hub - foi redirecionado de volta');
}

// 6. Resumo
console.log('\n📋 === RESUMO DO DIAGNÓSTICO ===');
console.log('Token na URL:', ssoToken ? '✅' : '❌');
console.log('Token no localStorage:', savedToken ? '✅' : '❌');
console.log('Token válido (se expira):', savedExpires ? (new Date(savedExpires) > new Date() ? '✅' : '❌') : 'N/A');
console.log('\n💡 Se o token está na URL mas a página redireciona:');
console.log('   - Verifique se useSSO está sendo usado no App.tsx');
console.log('   - Verifique se há redirecionamento automático no AuthGuard');
console.log('   - Verifique os logs do console para erros de validação');
```

---

## O que o Script Verifica

1. ✅ **Token na URL**: Se o token está presente quando a página abre
2. ✅ **localStorage**: Se o token foi salvo após validação
3. ✅ **Validação do Token**: Testa se o token é válido no banco
4. ✅ **Redirecionamentos**: Verifica se há redirecionamento automático
5. ✅ **Supabase**: Verifica se o cliente Supabase está disponível

---

## Como Interpretar os Resultados

### ✅ Tudo OK:
- Token na URL: ✅
- Token no localStorage: ✅
- Validação: is_valid: true
- **Ação**: O problema está na lógica de redirecionamento do módulo

### ❌ Token não encontrado:
- Token na URL: ❌
- **Ação**: Problema no Hub Central - não está passando o token

### ❌ Token inválido:
- Token na URL: ✅
- Validação: is_valid: false
- **Ação**: Verificar se o token existe no banco de dados

### ❌ Token expirado:
- Token no localStorage: ✅
- Token válido: ❌ (expirado)
- **Ação**: Token expirou, precisa gerar novo token

---

## Próximos Passos

Execute o script e compartilhe os resultados para diagnóstico mais preciso!

