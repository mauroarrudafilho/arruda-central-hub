-- Migration: Create RLS-RPC Mapping Table
-- Data: 2025-02-06
-- Descrição: Cria tabela para mapear políticas RLS com funções RPC correspondentes
-- Facilita validação e auditoria de sincronização entre RLS e RPC

-- ==============================================
-- CRIAR TABELA DE MAPEAMENTO RLS ↔ RPC
-- ==============================================

CREATE TABLE IF NOT EXISTS public.rls_rpc_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  policy_command TEXT NOT NULL CHECK (policy_command IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  rpc_function_name TEXT NOT NULL,
  permission_function_name TEXT, -- Nome da função auxiliar de permissão usada
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  validation_status TEXT CHECK (validation_status IN ('pending', 'valid', 'invalid', 'warning')),
  validation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(table_name, policy_name, policy_command)
);

-- ==============================================
-- ÍNDICES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_rls_rpc_mapping_table_name ON public.rls_rpc_mapping(table_name);
CREATE INDEX IF NOT EXISTS idx_rls_rpc_mapping_rpc_function ON public.rls_rpc_mapping(rpc_function_name);
CREATE INDEX IF NOT EXISTS idx_rls_rpc_mapping_status ON public.rls_rpc_mapping(validation_status);
CREATE INDEX IF NOT EXISTS idx_rls_rpc_mapping_active ON public.rls_rpc_mapping(is_active) WHERE is_active = true;

-- ==============================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ==============================================

CREATE OR REPLACE FUNCTION public.update_rls_rpc_mapping_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_rls_rpc_mapping_updated_at
  BEFORE UPDATE ON public.rls_rpc_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rls_rpc_mapping_updated_at();

-- ==============================================
-- FUNÇÃO PARA REGISTRAR MAPEAMENTO
-- ==============================================

CREATE OR REPLACE FUNCTION public.register_rls_rpc_mapping(
  p_table_name TEXT,
  p_policy_name TEXT,
  p_policy_command TEXT,
  p_rpc_function_name TEXT,
  p_permission_function_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mapping_id UUID;
BEGIN
  INSERT INTO public.rls_rpc_mapping (
    table_name,
    policy_name,
    policy_command,
    rpc_function_name,
    permission_function_name,
    created_by
  ) VALUES (
    p_table_name,
    p_policy_name,
    p_policy_command,
    p_rpc_function_name,
    p_permission_function_name,
    auth.uid()
  )
  ON CONFLICT (table_name, policy_name, policy_command) 
  DO UPDATE SET
    rpc_function_name = EXCLUDED.rpc_function_name,
    permission_function_name = EXCLUDED.permission_function_name,
    updated_at = now(),
    updated_by = auth.uid()
  RETURNING id INTO _mapping_id;
  
  RETURN _mapping_id;
END;
$$;

-- ==============================================
-- FUNÇÃO PARA VALIDAR MAPEAMENTO
-- ==============================================

CREATE OR REPLACE FUNCTION public.validate_rls_rpc_mapping(
  p_mapping_id UUID
)
RETURNS TABLE(
  is_valid BOOLEAN,
  validation_message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mapping RECORD;
  _policy_exists BOOLEAN;
  _rpc_exists BOOLEAN;
  _permission_function_exists BOOLEAN;
BEGIN
  -- Buscar mapeamento
  SELECT * INTO _mapping
  FROM public.rls_rpc_mapping
  WHERE id = p_mapping_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Mapping not found'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar se policy existe
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = _mapping.table_name
      AND policyname = _mapping.policy_name
  ) INTO _policy_exists;
  
  -- Verificar se RPC function existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = _mapping.rpc_function_name
      AND pronamespace = 'public'::regnamespace
  ) INTO _rpc_exists;
  
  -- Verificar se função auxiliar de permissão existe (se especificada)
  IF _mapping.permission_function_name IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = _mapping.permission_function_name
        AND pronamespace = 'public'::regnamespace
    ) INTO _permission_function_exists;
  ELSE
    _permission_function_exists := TRUE; -- Não precisa verificar se não especificado
  END IF;
  
  -- Atualizar status de validação
  UPDATE public.rls_rpc_mapping
  SET 
    last_validated_at = now(),
    validation_status = CASE 
      WHEN _policy_exists AND _rpc_exists AND _permission_function_exists THEN 'valid'
      WHEN NOT _policy_exists AND NOT _rpc_exists THEN 'invalid'
      ELSE 'warning'
    END,
    validation_notes = CASE
      WHEN NOT _policy_exists THEN 'Policy does not exist'
      WHEN NOT _rpc_exists THEN 'RPC function does not exist'
      WHEN NOT _permission_function_exists THEN 'Permission function does not exist'
      ELSE NULL
    END
  WHERE id = p_mapping_id;
  
  -- Retornar resultado
  RETURN QUERY
  SELECT 
    (_policy_exists AND _rpc_exists AND _permission_function_exists)::BOOLEAN,
    CASE
      WHEN NOT _policy_exists THEN 'Policy does not exist'
      WHEN NOT _rpc_exists THEN 'RPC function does not exist'
      WHEN NOT _permission_function_exists THEN 'Permission function does not exist'
      ELSE 'Mapping is valid'
    END::TEXT;
END;
$$;

-- ==============================================
-- HABILITAR RLS
-- ==============================================

ALTER TABLE public.rls_rpc_mapping ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver mapeamentos
CREATE POLICY "Users can view rls_rpc_mappings" 
ON public.rls_rpc_mapping 
FOR SELECT 
TO authenticated
USING (true);

-- Política: Apenas admins podem criar/atualizar mapeamentos
CREATE POLICY "Admins can manage rls_rpc_mappings" 
ON public.rls_rpc_mapping 
FOR ALL 
TO authenticated
USING (public.is_admin_v2(auth.uid()))
WITH CHECK (public.is_admin_v2(auth.uid()));

-- ==============================================
-- PERMISSÕES
-- ==============================================

GRANT SELECT ON public.rls_rpc_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_rls_rpc_mapping(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_rls_rpc_mapping(UUID) TO authenticated;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON TABLE public.rls_rpc_mapping IS 
'Tabela para mapear políticas RLS com funções RPC correspondentes. 
Facilita validação e auditoria de sincronização entre RLS policies e RPC functions.
Garante que mudanças em RLS sejam refletidas em RPC correspondentes.';

COMMENT ON FUNCTION public.register_rls_rpc_mapping(TEXT, TEXT, TEXT, TEXT, TEXT) IS 
'Registra mapeamento entre uma policy RLS e função RPC correspondente.
Se mapeamento já existir, atualiza os dados.';

COMMENT ON FUNCTION public.validate_rls_rpc_mapping(UUID) IS 
'Valida um mapeamento RLS-RPC verificando se policy, RPC function e função auxiliar existem.
Atualiza status de validação na tabela.';
