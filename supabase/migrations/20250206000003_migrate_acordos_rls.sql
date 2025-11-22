-- Migration: Migrate Acordos RLS Policies to Use Auxiliary Functions
-- Data: 2025-02-06
-- Descrição: Migra políticas RLS da tabela acordos para usar funções auxiliares unificadas
-- Parte do sistema unificado RLS-RPC

-- ==============================================
-- REMOVER POLICIES ANTIGAS
-- ==============================================

-- Remover todas as policies antigas da tabela acordos
DROP POLICY IF EXISTS "Acordos access by role" ON public.acordos;
DROP POLICY IF EXISTS "Acordos create by role" ON public.acordos;
DROP POLICY IF EXISTS "Acordos update by role" ON public.acordos;
DROP POLICY IF EXISTS "Acordos delete by role" ON public.acordos;
DROP POLICY IF EXISTS "Users can view acordos they have access to" ON public.acordos;
DROP POLICY IF EXISTS "Users can create acordos if they have permission" ON public.acordos;
DROP POLICY IF EXISTS "Users can update acordos they have access to" ON public.acordos;
DROP POLICY IF EXISTS "Users can delete acordos they have access to" ON public.acordos;

-- Garantir que RLS está habilitado na tabela
ALTER TABLE public.acordos ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CRIAR NOVAS POLICIES USANDO FUNÇÕES AUXILIARES
-- ==============================================

-- Política de SELECT: Usuários podem ver acordos baseado em permissões
CREATE POLICY "acordos_select_unified" 
ON public.acordos 
FOR SELECT 
TO authenticated
USING (
  -- Usar função auxiliar que encapsula toda a lógica
  public.can_user_view_acordo(auth.uid(), NULL, id)
);

-- Política de INSERT: Usuários podem criar acordos baseado em permissões
CREATE POLICY "acordos_insert_unified" 
ON public.acordos 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Usar função auxiliar que verifica se usuário pode criar
  public.can_user_create_acordo(auth.uid(), NULL)
);

-- Política de UPDATE: Usuários podem atualizar acordos baseado em permissões
CREATE POLICY "acordos_update_unified" 
ON public.acordos 
FOR UPDATE 
TO authenticated
USING (
  -- Usar função auxiliar que verifica se usuário pode editar este acordo
  public.can_user_edit_acordo(auth.uid(), NULL, id)
)
WITH CHECK (
  -- Verificar novamente após atualização
  public.can_user_edit_acordo(auth.uid(), NULL, id)
);

-- Política de DELETE: Usuários podem deletar acordos baseado em permissões
CREATE POLICY "acordos_delete_unified" 
ON public.acordos 
FOR DELETE 
TO authenticated
USING (
  -- Usar função auxiliar que verifica se usuário pode deletar este acordo
  public.can_user_delete_acordo(auth.uid(), NULL, id)
);

-- ==============================================
-- REGISTRAR MAPEAMENTOS NA TABELA DE SINCRONIZAÇÃO
-- ==============================================

-- Registrar mapeamentos entre RLS policies e funções RPC futuras
-- Isso permite validação e auditoria de sincronização

DO $$
BEGIN
  -- Registrar mapeamento SELECT
  PERFORM public.register_rls_rpc_mapping(
    'acordos',
    'acordos_select_unified',
    'SELECT',
    'get_acordos_sso', -- Função RPC correspondente será criada na próxima migration
    'can_user_view_acordo'
  );
  
  -- Registrar mapeamento INSERT
  PERFORM public.register_rls_rpc_mapping(
    'acordos',
    'acordos_insert_unified',
    'INSERT',
    'get_acordos_sso', -- Para validação de criação, usar mesma função
    'can_user_create_acordo'
  );
  
  -- Registrar mapeamento UPDATE
  PERFORM public.register_rls_rpc_mapping(
    'acordos',
    'acordos_update_unified',
    'UPDATE',
    'get_acordos_sso',
    'can_user_edit_acordo'
  );
  
  -- Registrar mapeamento DELETE
  PERFORM public.register_rls_rpc_mapping(
    'acordos',
    'acordos_delete_unified',
    'DELETE',
    'get_acordos_sso',
    'can_user_delete_acordo'
  );
END $$;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON POLICY "acordos_select_unified" ON public.acordos IS 
'Política RLS unificada para SELECT em acordos. 
Usa função auxiliar can_user_view_acordo() que encapsula toda a lógica de permissão.
Esta é a fonte única de verdade compartilhada com RPC functions.';

COMMENT ON POLICY "acordos_insert_unified" ON public.acordos IS 
'Política RLS unificada para INSERT em acordos. 
Usa função auxiliar can_user_create_acordo() que encapsula toda a lógica de permissão.';

COMMENT ON POLICY "acordos_update_unified" ON public.acordos IS 
'Política RLS unificada para UPDATE em acordos. 
Usa função auxiliar can_user_edit_acordo() que encapsula toda a lógica de permissão.
Verifica permissão antes e depois da atualização.';

COMMENT ON POLICY "acordos_delete_unified" ON public.acordos IS 
'Política RLS unificada para DELETE em acordos. 
Usa função auxiliar can_user_delete_acordo() que encapsula toda a lógica de permissão.';
