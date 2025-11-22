# 📘 Guia Completo de Migração: Módulo de Acordos para RPC SSO

## 🎯 Objetivo

Este guia fornece exemplos de código prontos para copiar e colar no módulo de acordos, atualizando todas as operações para usar funções RPC quando autenticado via SSO.

## ✅ Pré-requisitos

### No Hub Central (JÁ CONCLUÍDO):
- ✅ Todas as funções RPC criadas e aplicadas
- ✅ Funções auxiliares de permissão funcionando
- ✅ RLS policies migradas

### No Módulo de Acordos (A FAZER):
- ⚠️ Interceptor SSO configurado (`src/integrations/supabase/client.ts`)
- ⚠️ Variável `isSSO` disponível globalmente
- ⚠️ Objeto `ssoUser` com propriedade `email` disponível

---

## 📋 Padrão de Implementação

Todas as operações devem seguir este padrão:

```typescript
// Padrão universal para todas as operações
if (isSSO && ssoUser?.email) {
  // ✅ SSO: Usar função RPC
  const { data, error } = await supabase.rpc('nome_funcao_sso', {
    // parâmetros
    p_user_email: ssoUser.email // Opcional: se não fornecido, função lê do header
  });
  
  if (error) {
    console.error('❌ Erro ao executar operação via RPC:', error);
    throw error;
  }
  
  return data;
} else {
  // ✅ Supabase Auth: Usar queries diretas (RLS funciona automaticamente)
  const { data, error } = await supabase
    .from('acordos')
    .operation(...)
    .select();
  
  if (error) {
    console.error('❌ Erro ao executar operação:', error);
    throw error;
  }
  
  return data;
}
```

---

## 🔧 Exemplos de Código Prontos

### **1. Atualizar `updateAcordoStatus`**

**Localização:** `src/hooks/useAcordos.ts` (linha ~411-469)

**Código Completo:**

```typescript
const updateAcordoStatus = async (
  acordoId: string, 
  novoStatus: Acordo['status'], 
  comentario?: string
) => {
  console.log('🔄 Iniciando updateAcordoStatus:', { acordoId, novoStatus, comentario });

  // Verificar se já existe uma atualização em andamento
  const chaveAtualizacao = `${acordoId}-${novoStatus}`;
  const agora = Date.now();
  const ultimaAtualizacao = (window as any).lastStatusUpdate?.[chaveAtualizacao];

  if (ultimaAtualizacao && (agora - ultimaAtualizacao) < 2000) {
    console.log('⚠️ Atualização duplicada bloqueada:', chaveAtualizacao);
    return;
  }

  if (!(window as any).lastStatusUpdate) (window as any).lastStatusUpdate = {};
  (window as any).lastStatusUpdate[chaveAtualizacao] = agora;

  try {
    // ✅ NOVO: Verificar se é SSO e usar RPC
    if (isSSO && ssoUser?.email) {
      console.log('🔍 [SSO] Atualizando status via RPC:', { acordoId, novoStatus });

      // Buscar status atual via RPC
      const { data: acordoAtual, error: fetchError } = await supabase.rpc('get_acordo_sso', {
        p_acordo_id: acordoId,
        p_user_email: ssoUser.email
      });

      if (fetchError) {
        console.error('❌ Erro ao buscar acordo atual via RPC:', fetchError);
        throw fetchError;
      }

      if (!acordoAtual || acordoAtual.length === 0) {
        throw new Error('Acordo não encontrado');
      }

      const statusAnterior = acordoAtual[0].status || 'rascunho';
      console.log('📊 Status anterior:', statusAnterior, '→ Novo status:', novoStatus);

      // Atualizar via RPC
      const { data: success, error: updateError } = await supabase.rpc('update_acordo_status_sso', {
        p_acordo_id: acordoId,
        p_novo_status: novoStatus,
        p_user_email: ssoUser.email // Opcional: função pode ler do header
      });

      if (updateError) {
        console.error('❌ Erro ao atualizar status via RPC:', updateError);
        throw updateError;
      }

      if (!success) {
        throw new Error('Falha ao atualizar status do acordo');
      }

      console.log('✅ Status do acordo atualizado com sucesso via RPC');

      // Verificar se deve enviar notificação (mesma lógica)
      const acordoCriadoEm = new Date(acordoAtual[0].criado_em);
      const hoje = new Date();
      const diasDesdeCriacao = Math.floor((hoje.getTime() - acordoCriadoEm.getTime()) / (1000 * 60 * 60 * 24));

      if (statusAnterior === 'rascunho' && novoStatus === 'solicitar_aprovacao' && diasDesdeCriacao <= 7) {
        // Lógica de notificação (manter existente)
        console.log('📧 Enviando notificação...');
      }

      // Invalidar cache e refetch (manter existente)
      queryClient.invalidateQueries(['acordos']);
      queryClient.invalidateQueries(['acordo', acordoId]);

      return { success: true };

    } else {
      // ✅ MANTIDO: Supabase Auth - usar queries normais (RLS funciona)
      console.log('🔍 [Supabase Auth] Atualizando status via query direta');

      const { data: acordoAtual, error: fetchError } = await supabase
        .from('acordos')
        .select('status, criado_em')
        .eq('id', acordoId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar acordo atual:', fetchError);
        throw fetchError;
      }

      const statusAnterior = acordoAtual?.status || 'rascunho';
      console.log('📊 Status anterior:', statusAnterior, '→ Novo status:', novoStatus);

      const { error } = await supabase
        .from('acordos')
        .update({ status: novoStatus })
        .eq('id', acordoId);

      if (error) {
        console.error('❌ Erro ao atualizar status do acordo:', error);
        throw error;
      }

      console.log('✅ Status do acordo atualizado com sucesso');

      // Verificar se deve enviar notificação (mesma lógica)
      const acordoCriadoEm = new Date(acordoAtual.criado_em);
      const hoje = new Date();
      const diasDesdeCriacao = Math.floor((hoje.getTime() - acordoCriadoEm.getTime()) / (1000 * 60 * 60 * 24));

      if (statusAnterior === 'rascunho' && novoStatus === 'solicitar_aprovacao' && diasDesdeCriacao <= 7) {
        console.log('📧 Enviando notificação...');
      }

      // Invalidar cache e refetch (manter existente)
      queryClient.invalidateQueries(['acordos']);
      queryClient.invalidateQueries(['acordo', acordoId]);

      return { success: true };
    }

  } catch (err) {
    console.error('❌ Erro completo ao atualizar status:', err);
    throw err;
  }
};
```

---

### **2. Atualizar `updateAcordo`**

**Localização:** `src/hooks/useAcordos.ts` (linha ~686+)

**Código Completo:**

```typescript
const updateAcordo = async (acordoId: string, dadosAtualizacao: Partial<Acordo>) => {
  console.log('🔄 Iniciando updateAcordo:', { acordoId, dadosAtualizacao });

  try {
    // ✅ NOVO: Verificar se é SSO e usar RPC
    if (isSSO && ssoUser?.email) {
      console.log('🔍 [SSO] Atualizando acordo via RPC:', { acordoId });

      // Converter dados para JSONB
      const dadosJsonb: any = {};
      
      if (dadosAtualizacao.cliente_id !== undefined) dadosJsonb.cliente_id = dadosAtualizacao.cliente_id;
      if (dadosAtualizacao.comprador_id !== undefined) dadosJsonb.comprador_id = dadosAtualizacao.comprador_id || null;
      if (dadosAtualizacao.tipo !== undefined) dadosJsonb.tipo = dadosAtualizacao.tipo;
      if (dadosAtualizacao.tipo_acordo_id !== undefined) dadosJsonb.tipo_acordo_id = dadosAtualizacao.tipo_acordo_id || null;
      if (dadosAtualizacao.valor !== undefined) dadosJsonb.valor = dadosAtualizacao.valor;
      if (dadosAtualizacao.data_negociacao !== undefined) dadosJsonb.data_negociacao = dadosAtualizacao.data_negociacao;
      if (dadosAtualizacao.mes_previsto_abatimento !== undefined) dadosJsonb.mes_previsto_abatimento = dadosAtualizacao.mes_previsto_abatimento;
      if (dadosAtualizacao.status !== undefined) dadosJsonb.status = dadosAtualizacao.status;
      if (dadosAtualizacao.justificativa !== undefined) dadosJsonb.justificativa = dadosAtualizacao.justificativa || null;
      if (dadosAtualizacao.numero_acordo !== undefined) dadosJsonb.numero_acordo = dadosAtualizacao.numero_acordo || null;
      if (dadosAtualizacao.anexo_url !== undefined) dadosJsonb.anexo_url = dadosAtualizacao.anexo_url || null;
      if (dadosAtualizacao.uf !== undefined) dadosJsonb.uf = dadosAtualizacao.uf || null;
      if (dadosAtualizacao.regional !== undefined) dadosJsonb.regional = dadosAtualizacao.regional || null;
      if (dadosAtualizacao.detalhes_acordo !== undefined) dadosJsonb.detalhes_acordo = dadosAtualizacao.detalhes_acordo || null;
      if (dadosAtualizacao.formato_abatimento !== undefined) dadosJsonb.formato_abatimento = dadosAtualizacao.formato_abatimento || null;

      const { data: success, error: updateError } = await supabase.rpc('update_acordo_sso', {
        p_acordo_id: acordoId,
        p_dados_acordo: dadosJsonb,
        p_user_email: ssoUser.email // Opcional
      });

      if (updateError) {
        console.error('❌ Erro ao atualizar acordo via RPC:', updateError);
        throw updateError;
      }

      if (!success) {
        throw new Error('Falha ao atualizar acordo');
      }

      console.log('✅ Acordo atualizado com sucesso via RPC');

      // Invalidar cache e refetch
      queryClient.invalidateQueries(['acordos']);
      queryClient.invalidateQueries(['acordo', acordoId]);

      return { success: true };

    } else {
      // ✅ MANTIDO: Supabase Auth - usar UPDATE direto (RLS funciona)
      console.log('🔍 [Supabase Auth] Atualizando acordo via query direta');

      const { error } = await supabase
        .from('acordos')
        .update(dadosAtualizacao)
        .eq('id', acordoId);

      if (error) {
        console.error('❌ Erro ao atualizar acordo:', error);
        throw error;
      }

      console.log('✅ Acordo atualizado com sucesso');

      // Invalidar cache e refetch
      queryClient.invalidateQueries(['acordos']);
      queryClient.invalidateQueries(['acordo', acordoId]);

      return { success: true };
    }

  } catch (err) {
    console.error('❌ Erro completo ao atualizar acordo:', err);
    throw err;
  }
};
```

---

### **3. Atualizar `deleteAcordo`**

**Localização:** `src/hooks/useAcordos.ts` (linha ~872+)

**Código Completo:**

```typescript
const deleteAcordo = async (acordoId: string) => {
  console.log('🔄 Iniciando deleteAcordo:', { acordoId });

  try {
    // ✅ NOVO: Verificar se é SSO e usar RPC
    if (isSSO && ssoUser?.email) {
      console.log('🔍 [SSO] Excluindo acordo via RPC:', { acordoId });

      const { data: success, error: deleteError } = await supabase.rpc('delete_acordo_sso', {
        p_acordo_id: acordoId,
        p_user_email: ssoUser.email // Opcional
      });

      if (deleteError) {
        console.error('❌ Erro ao excluir acordo via RPC:', deleteError);
        throw deleteError;
      }

      if (!success) {
        throw new Error('Falha ao excluir acordo ou permissão negada');
      }

      console.log('✅ Acordo excluído com sucesso via RPC');

      // Invalidar cache e refetch
      queryClient.invalidateQueries(['acordos']);

      return { success: true };

    } else {
      // ✅ MANTIDO: Supabase Auth - usar DELETE direto (RLS funciona)
      console.log('🔍 [Supabase Auth] Excluindo acordo via query direta');

      const { error } = await supabase
        .from('acordos')
        .delete()
        .eq('id', acordoId);

      if (error) {
        console.error('❌ Erro ao excluir acordo:', error);
        throw error;
      }

      console.log('✅ Acordo excluído com sucesso');

      // Invalidar cache e refetch
      queryClient.invalidateQueries(['acordos']);

      return { success: true };
    }

  } catch (err) {
    console.error('❌ Erro completo ao excluir acordo:', err);
    throw err;
  }
};
```

---

### **4. Atualizar `createAcordo`**

**Localização:** `src/hooks/useAcordos.ts` (linha ~902+)

**Código Completo:**

```typescript
const createAcordo = async (
  dadosAcordo: Omit<Acordo, 'id' | 'criado_em' | 'atualizado_em'>,
  // ... outros parâmetros se necessário
) => {
  console.log('🔄 Iniciando createAcordo:', { dadosAcordo });

  try {
    // ... validações iniciais (manter existente)

    // ✅ NOVO: Verificar se é SSO e usar RPC
    if (isSSO && ssoUser?.email) {
      console.log('🔍 [SSO] Criando acordo via RPC');

      // Obter ID do usuário em usuarios_acordos (ou usar _user_data.id do RPC)
      // Nota: A função create_acordo_sso() já busca o user_id automaticamente
      // Se você precisar de vendedor_id específico, pode buscar aqui

      // Converter dados para JSONB conforme estrutura da função RPC
      const dadosJsonb: any = {
        cliente_id: dadosAcordo.cliente_id,
        vendedor_id: dadosAcordo.vendedor_id || null, // Se null, função usa user_id
        comprador_id: dadosAcordo.comprador_id || null,
        tipo: dadosAcordo.tipo,
        tipo_acordo_id: dadosAcordo.tipo_acordo_id || null,
        valor: dadosAcordo.valor,
        data_negociacao: dadosAcordo.data_negociacao,
        mes_previsto_abatimento: dadosAcordo.mes_previsto_abatimento,
        status: dadosAcordo.status || 'rascunho',
        justificativa: dadosAcordo.justificativa || null,
        numero_acordo: dadosAcordo.numero_acordo || null,
        anexo_url: dadosAcordo.anexo_url || null,
        uf: dadosAcordo.uf || null,
        regional: dadosAcordo.regional || null,
        detalhes_acordo: dadosAcordo.detalhes_acordo || null,
        formato_abatimento: dadosAcordo.formato_abatimento || null,
        tenant_id: null // Opcional: função usa organizacao_id do usuário se não fornecido
      };

      const { data: acordoId, error: createError } = await supabase.rpc('create_acordo_sso', {
        p_dados_acordo: dadosJsonb,
        p_user_email: ssoUser.email // Opcional
      });

      if (createError) {
        console.error('❌ Erro ao criar acordo via RPC:', createError);
        throw createError;
      }

      if (!acordoId) {
        throw new Error('Falha ao criar acordo');
      }

      console.log('✅ Acordo criado via RPC:', acordoId);

      // Processar arquivos e histórico (manter lógica existente)
      // ...

      // Invalidar cache e refetch
      queryClient.invalidateQueries(['acordos']);

      return acordoId;

    } else {
      // ✅ MANTIDO: Supabase Auth - usar INSERT direto (RLS funciona)
      console.log('🔍 [Supabase Auth] Criando acordo via query direta');

      const { data: acordo, error } = await supabase
        .from('acordos')
        .insert({
          cliente_id: dadosAcordo.cliente_id,
          vendedor_id: dadosAcordo.vendedor_id,
          comprador_id: dadosAcordo.comprador_id,
          tipo: dadosAcordo.tipo,
          tipo_acordo_id: dadosAcordo.tipo_acordo_id,
          valor: dadosAcordo.valor,
          data_negociacao: dadosAcordo.data_negociacao,
          mes_previsto_abatimento: dadosAcordo.mes_previsto_abatimento,
          status: dadosAcordo.status || 'rascunho',
          justificativa: dadosAcordo.justificativa,
          numero_acordo: dadosAcordo.numero_acordo,
          anexo_url: dadosAcordo.anexo_url,
          uf: dadosAcordo.uf,
          regional: dadosAcordo.regional,
          detalhes_acordo: dadosAcordo.detalhes_acordo,
          formato_abatimento: dadosAcordo.formato_abatimento
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erro ao criar acordo:', error);
        throw error;
      }

      console.log('✅ Acordo criado:', acordo.id);

      // Processar arquivos e histórico (manter lógica existente)
      // ...

      // Invalidar cache e refetch
      queryClient.invalidateQueries(['acordos']);

      return acordo.id;
    }

  } catch (err) {
    console.error('❌ Erro completo ao criar acordo:', err);
    throw err;
  }
};
```

---

### **5. Atualizar Busca de Acordo Específico**

**Código para substituir queries diretas que buscam acordo específico:**

```typescript
const fetchAcordoById = async (acordoId: string) => {
  console.log('🔍 Buscando acordo:', acordoId);

  try {
    // ✅ NOVO: Verificar se é SSO e usar RPC
    if (isSSO && ssoUser?.email) {
      console.log('🔍 [SSO] Buscando acordo via RPC:', { acordoId });

      const { data, error } = await supabase.rpc('get_acordo_sso', {
        p_acordo_id: acordoId,
        p_user_email: ssoUser.email // Opcional
      });

      if (error) {
        console.error('❌ Erro ao buscar acordo via RPC:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Acordo não encontrado ou sem permissão');
      }

      return data[0];

    } else {
      // ✅ MANTIDO: Supabase Auth - usar query direta (RLS funciona)
      console.log('🔍 [Supabase Auth] Buscando acordo via query direta');

      const { data, error } = await supabase
        .from('acordos')
        .select('*')
        .eq('id', acordoId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar acordo:', error);
        throw error;
      }

      return data;
    }

  } catch (err) {
    console.error('❌ Erro completo ao buscar acordo:', err);
    throw err;
  }
};
```

---

### **6. Helper para Detectar SSO**

**Criar helper para facilitar verificação:**

```typescript
// src/utils/sso.ts ou similar
export const isSSOAuth = (): boolean => {
  // Verificar se há token SSO na URL ou localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('sso_token') || localStorage.getItem('sso_token');
  
  return !!ssoToken;
};

export const getSSOUser = (): { email: string } | null => {
  // Obter email do usuário SSO (ajustar conforme implementação)
  const ssoToken = new URLSearchParams(window.location.search).get('sso_token') 
    || localStorage.getItem('sso_token');
  
  if (!ssoToken) return null;

  // Decodificar token ou buscar do estado da aplicação
  // Ajustar conforme sua implementação
  const userEmail = localStorage.getItem('sso_user_email');
  
  return userEmail ? { email: userEmail } : null;
};
```

**Uso no hook:**

```typescript
import { isSSOAuth, getSSOUser } from '@/utils/sso';

const isSSO = isSSOAuth();
const ssoUser = getSSOUser();
```

---

## 🔍 Verificações Necessárias

### **1. Verificar Interceptor SSO**

**Arquivo:** `src/integrations/supabase/client.ts`

**O interceptor deve:**
- ✅ Adicionar header `x-sso-token` automaticamente
- ✅ Detectar se login é via SSO
- ✅ Expor variável `isSSO` globalmente
- ✅ Expor objeto `ssoUser` com propriedade `email`

**Exemplo esperado:**

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  global: {
    headers: {
      // Interceptor adiciona x-sso-token automaticamente quando SSO
    }
  },
  auth: {
    // ...
  }
});

// Exportar para uso global
export const isSSO = /* lógica de detecção */;
export const ssoUser = /* objeto com email */;
export default supabase;
```

### **2. Verificar `fetchAcordos`**

**Arquivo:** `src/hooks/useAcordos.ts` (linha ~112 conforme plano)

**Deve estar assim:**

```typescript
const fetchAcordos = async () => {
  if (isSSO && ssoUser?.email) {
    // ✅ JÁ DEVE ESTAR IMPLEMENTADO
    const { data, error } = await supabase.rpc('get_acordos_sso', {
      p_user_email: ssoUser.email
    });
    // ...
  } else {
    // Supabase Auth
    const { data, error } = await supabase
      .from('acordos')
      .select('*');
    // ...
  }
};
```

---

## ✅ Checklist de Migração

### **No Módulo de Acordos:**

- [ ] Verificar se interceptor SSO está funcionando
- [ ] Verificar se `isSSO` e `ssoUser` estão disponíveis
- [ ] Atualizar `updateAcordoStatus` - Adicionar branch SSO
- [ ] Atualizar `updateAcordo` - Adicionar branch SSO
- [ ] Atualizar `deleteAcordo` - Adicionar branch SSO
- [ ] Atualizar `createAcordo` - Adicionar branch SSO
- [ ] Atualizar buscas de acordo específico - Usar `get_acordo_sso()`
- [ ] Verificar `useFinanceiro` - Operações de escrita
- [ ] Verificar `useAnalytics` - Outras operações
- [ ] Verificar `useVendedores` - Uso de RPC
- [ ] Verificar `useClientes` - Uso de RPC
- [ ] Verificar `useImportacao` - Criação via importação

### **Testes:**

- [ ] Testar `updateAcordoStatus` com SSO
- [ ] Testar `updateAcordoStatus` com Supabase Auth
- [ ] Testar `updateAcordo` com SSO
- [ ] Testar `updateAcordo` com Supabase Auth
- [ ] Testar `createAcordo` com SSO
- [ ] Testar `createAcordo` com Supabase Auth
- [ ] Testar `deleteAcordo` com SSO
- [ ] Testar `deleteAcordo` com Supabase Auth
- [ ] Testar permissões (vendedor só pode editar próprios acordos)
- [ ] Testar fluxo completo end-to-end

---

## 🚀 Próximos Passos

1. **No Módulo de Acordos:**
   - Copiar exemplos de código acima
   - Ajustar conforme estrutura específica do módulo
   - Testar cada operação após migração

2. **Validação:**
   - Testar com usuários de diferentes papéis
   - Testar com SSO e Supabase Auth
   - Validar permissões funcionam corretamente

3. **Documentação:**
   - Documentar padrão estabelecido
   - Atualizar README do módulo se necessário

---

## 📝 Notas Importantes

1. **Sempre manter branch Supabase Auth:** Não remover código existente, apenas adicionar branch SSO
2. **Header x-sso-token:** Funções RPC podem ler automaticamente, mas é melhor passar `p_user_email` quando disponível
3. **Estrutura JSONB:** Ajustar campos conforme estrutura real da tabela `acordos` no seu banco
4. **Tratamento de erros:** Manter tratamento de erros existente e adicionar logs para RPC

---

## 🎯 Conclusão

Este guia fornece todos os exemplos de código necessários para migrar o módulo de acordos para usar funções RPC quando autenticado via SSO, mantendo compatibilidade total com Supabase Auth.

**Todas as funções RPC estão criadas e prontas no Hub Central!** 🚀

