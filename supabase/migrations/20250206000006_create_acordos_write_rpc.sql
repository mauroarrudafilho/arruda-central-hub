-- Migration: Create Acordos Write RPC Functions (SSO)
-- Data: 2025-02-06
-- Descrição: Cria funções RPC SSO para operações de escrita (INSERT, UPDATE, DELETE) em acordos
-- Parte do sistema unificado RLS-RPC

-- ==============================================
-- FUNÇÃO RPC SSO PARA ATUALIZAR STATUS DO ACORDO
-- ==============================================

CREATE OR REPLACE FUNCTION public.update_acordo_status_sso(
  p_acordo_id UUID,
  p_novo_status status_acordo,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_email_to_use TEXT;
  _user_data RECORD;
  _acordo_status TEXT;
BEGIN
  -- Obter email (do parâmetro ou header)
  IF p_user_email IS NOT NULL AND p_user_email != '' THEN
    _user_email_to_use := p_user_email;
  ELSE
    SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
    IF _sso_user.is_valid THEN
      _user_email_to_use := _sso_user.user_email;
    ELSE
      RAISE EXCEPTION 'User not authenticated via SSO. Provide p_user_email or valid SSO token in header.';
    END IF;
  END IF;

  -- Buscar dados do usuário usando função unificada
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(NULL, _user_email_to_use)
  LIMIT 1;

  IF NOT FOUND OR NOT _user_data.ativo THEN
    RAISE EXCEPTION 'Usuário não encontrado ou inativo';
  END IF;

  -- Buscar status atual do acordo
  SELECT status::TEXT INTO _acordo_status
  FROM acordos
  WHERE id = p_acordo_id
  LIMIT 1;

  IF _acordo_status IS NULL THEN
    RAISE EXCEPTION 'Acordo não encontrado';
  END IF;

  -- Verificar permissão de edição usando função auxiliar
  IF NOT public.can_user_edit_acordo(NULL, _user_email_to_use, p_acordo_id) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para editar este acordo';
  END IF;

  -- Atualizar status
  UPDATE acordos
  SET status = p_novo_status, atualizado_em = NOW()
  WHERE id = p_acordo_id;

  RETURN FOUND;
END;
$$;

-- ==============================================
-- FUNÇÃO RPC SSO PARA ATUALIZAR ACORDO COMPLETO
-- ==============================================

CREATE OR REPLACE FUNCTION public.update_acordo_sso(
  p_acordo_id UUID,
  p_dados_acordo JSONB,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_email_to_use TEXT;
  _user_data RECORD;
BEGIN
  -- Obter email (do parâmetro ou header)
  IF p_user_email IS NOT NULL AND p_user_email != '' THEN
    _user_email_to_use := p_user_email;
  ELSE
    SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
    IF _sso_user.is_valid THEN
      _user_email_to_use := _sso_user.user_email;
    ELSE
      RAISE EXCEPTION 'User not authenticated via SSO. Provide p_user_email or valid SSO token in header.';
    END IF;
  END IF;

  -- Buscar dados do usuário usando função unificada
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(NULL, _user_email_to_use)
  LIMIT 1;

  IF NOT FOUND OR NOT _user_data.ativo THEN
    RAISE EXCEPTION 'Usuário não encontrado ou inativo';
  END IF;

  -- Verificar se acordo existe
  IF NOT EXISTS (SELECT 1 FROM acordos WHERE id = p_acordo_id) THEN
    RAISE EXCEPTION 'Acordo não encontrado';
  END IF;

  -- Verificar permissão de edição usando função auxiliar
  IF NOT public.can_user_edit_acordo(NULL, _user_email_to_use, p_acordo_id) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para editar este acordo';
  END IF;

  -- Atualizar acordo
  UPDATE acordos
  SET
    cliente_id = COALESCE((p_dados_acordo->>'cliente_id')::UUID, cliente_id),
    comprador_id = CASE 
      WHEN p_dados_acordo->>'comprador_id' IS NULL THEN comprador_id
      WHEN p_dados_acordo->>'comprador_id' = 'null' OR p_dados_acordo->>'comprador_id' = '' THEN NULL
      ELSE (p_dados_acordo->>'comprador_id')::UUID
    END,
    tipo = COALESCE((p_dados_acordo->>'tipo')::tipo_acordo, tipo),
    tipo_acordo_id = CASE 
      WHEN p_dados_acordo->>'tipo_acordo_id' IS NULL THEN tipo_acordo_id
      WHEN p_dados_acordo->>'tipo_acordo_id' = 'null' OR p_dados_acordo->>'tipo_acordo_id' = '' THEN NULL
      ELSE (p_dados_acordo->>'tipo_acordo_id')::UUID
    END,
    valor = COALESCE((p_dados_acordo->>'valor')::NUMERIC, valor),
    data_negociacao = COALESCE((p_dados_acordo->>'data_negociacao')::DATE, data_negociacao),
    mes_previsto_abatimento = COALESCE(
      CASE 
        WHEN p_dados_acordo->>'mes_previsto_abatimento' ~ '^\d{4}-\d{2}-\d{2}' THEN 
          (p_dados_acordo->>'mes_previsto_abatimento')::TEXT
        ELSE 
          p_dados_acordo->>'mes_previsto_abatimento'
      END,
      mes_previsto_abatimento
    ),
    status = COALESCE((p_dados_acordo->>'status')::status_acordo, status),
    justificativa = COALESCE(NULLIF(p_dados_acordo->>'justificativa', ''), NULLIF(p_dados_acordo->>'justificativa', 'null'), justificativa),
    numero_acordo = COALESCE(NULLIF(p_dados_acordo->>'numero_acordo', ''), NULLIF(p_dados_acordo->>'numero_acordo', 'null'), numero_acordo),
    anexo_url = COALESCE(NULLIF(p_dados_acordo->>'anexo_url', ''), NULLIF(p_dados_acordo->>'anexo_url', 'null'), anexo_url),
    uf = COALESCE(NULLIF(p_dados_acordo->>'uf', ''), NULLIF(p_dados_acordo->>'uf', 'null'), uf),
    regional = COALESCE(NULLIF(p_dados_acordo->>'regional', ''), NULLIF(p_dados_acordo->>'regional', 'null'), regional),
    detalhes_acordo = COALESCE(NULLIF(p_dados_acordo->>'detalhes_acordo', ''), NULLIF(p_dados_acordo->>'detalhes_acordo', 'null'), detalhes_acordo),
    formato_abatimento = COALESCE(NULLIF(p_dados_acordo->>'formato_abatimento', ''), NULLIF(p_dados_acordo->>'formato_abatimento', 'null'), formato_abatimento),
    atualizado_em = NOW()
  WHERE id = p_acordo_id;

  RETURN FOUND;
END;
$$;

-- ==============================================
-- FUNÇÃO RPC SSO PARA CRIAR ACORDO
-- ==============================================

CREATE OR REPLACE FUNCTION public.create_acordo_sso(
  p_dados_acordo JSONB,
  p_user_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_email_to_use TEXT;
  _user_data RECORD;
  _acordo_id UUID;
BEGIN
  -- Obter email (do parâmetro ou header)
  IF p_user_email IS NOT NULL AND p_user_email != '' THEN
    _user_email_to_use := p_user_email;
  ELSE
    SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
    IF _sso_user.is_valid THEN
      _user_email_to_use := _sso_user.user_email;
    ELSE
      RAISE EXCEPTION 'User not authenticated via SSO. Provide p_user_email or valid SSO token in header.';
    END IF;
  END IF;

  -- Buscar dados do usuário usando função unificada
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(NULL, _user_email_to_use)
  LIMIT 1;

  IF NOT FOUND OR NOT _user_data.ativo THEN
    RAISE EXCEPTION 'Usuário não encontrado ou inativo';
  END IF;

  -- Verificar permissão de criação usando função auxiliar
  IF NOT public.can_user_create_acordo(NULL, _user_email_to_use) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para criar acordos';
  END IF;

  -- Validar que vendedor_id corresponde ao usuário (se for vendedor)
  -- Se papel é vendedor e vendedor_id foi fornecido, deve corresponder ao ID do usuário
  IF _user_data.papel = 'vendedor' THEN
    IF (p_dados_acordo->>'vendedor_id')::UUID IS NOT NULL 
       AND (p_dados_acordo->>'vendedor_id')::UUID != _user_data.id THEN
      RAISE EXCEPTION 'Vendedores só podem criar acordos para si mesmos';
    END IF;
  END IF;

  -- Inserir acordo
  INSERT INTO acordos (
    cliente_id,
    vendedor_id,
    comprador_id,
    tipo,
    tipo_acordo_id,
    valor,
    data_negociacao,
    mes_previsto_abatimento,
    status,
    justificativa,
    numero_acordo,
    anexo_url,
    uf,
    regional,
    detalhes_acordo,
    formato_abatimento,
    tenant_id
  )
  VALUES (
    (p_dados_acordo->>'cliente_id')::UUID,
    COALESCE((p_dados_acordo->>'vendedor_id')::UUID, _user_data.id),
    NULLIF(p_dados_acordo->>'comprador_id', 'null')::UUID,
    (p_dados_acordo->>'tipo')::tipo_acordo,
    NULLIF(p_dados_acordo->>'tipo_acordo_id', 'null')::UUID,
    (p_dados_acordo->>'valor')::NUMERIC,
    (p_dados_acordo->>'data_negociacao')::DATE,
    p_dados_acordo->>'mes_previsto_abatimento',
    COALESCE((p_dados_acordo->>'status')::status_acordo, 'rascunho'::status_acordo),
    NULLIF(p_dados_acordo->>'justificativa', 'null'),
    NULLIF(p_dados_acordo->>'numero_acordo', 'null'),
    NULLIF(p_dados_acordo->>'anexo_url', 'null'),
    NULLIF(p_dados_acordo->>'uf', 'null'),
    NULLIF(p_dados_acordo->>'regional', 'null'),
    NULLIF(p_dados_acordo->>'detalhes_acordo', 'null'),
    NULLIF(p_dados_acordo->>'formato_abatimento', 'null'),
    COALESCE((p_dados_acordo->>'tenant_id')::UUID, _user_data.organizacao_id)
  )
  RETURNING id INTO _acordo_id;

  RETURN _acordo_id;
END;
$$;

-- ==============================================
-- FUNÇÃO RPC SSO PARA EXCLUIR ACORDO
-- ==============================================

CREATE OR REPLACE FUNCTION public.delete_acordo_sso(
  p_acordo_id UUID,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_email_to_use TEXT;
  _user_data RECORD;
BEGIN
  -- Obter email (do parâmetro ou header)
  IF p_user_email IS NOT NULL AND p_user_email != '' THEN
    _user_email_to_use := p_user_email;
  ELSE
    SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
    IF _sso_user.is_valid THEN
      _user_email_to_use := _sso_user.user_email;
    ELSE
      RAISE EXCEPTION 'User not authenticated via SSO. Provide p_user_email or valid SSO token in header.';
    END IF;
  END IF;

  -- Buscar dados do usuário usando função unificada
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(NULL, _user_email_to_use)
  LIMIT 1;

  IF NOT FOUND OR NOT _user_data.ativo THEN
    RAISE EXCEPTION 'Usuário não encontrado ou inativo';
  END IF;

  -- Verificar se acordo existe
  IF NOT EXISTS (SELECT 1 FROM acordos WHERE id = p_acordo_id) THEN
    RAISE EXCEPTION 'Acordo não encontrado';
  END IF;

  -- Verificar permissão de exclusão usando função auxiliar
  IF NOT public.can_user_delete_acordo(NULL, _user_email_to_use, p_acordo_id) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para excluir este acordo';
  END IF;

  -- Excluir acordo
  DELETE FROM acordos
  WHERE id = p_acordo_id;

  RETURN FOUND;
END;
$$;

-- ==============================================
-- PERMISSÕES
-- ==============================================

GRANT EXECUTE ON FUNCTION public.update_acordo_status_sso(UUID, status_acordo, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_acordo_status_sso(UUID, status_acordo, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_acordo_sso(UUID, JSONB, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_acordo_sso(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_acordo_sso(JSONB, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_acordo_sso(JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_acordo_sso(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_acordo_sso(UUID, TEXT) TO authenticated;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON FUNCTION public.update_acordo_status_sso(UUID, status_acordo, TEXT) IS 
'Função RPC SSO para atualizar status de um acordo. 
Verifica permissão usando função auxiliar can_user_edit_acordo().
Usa mesma lógica das RLS policies através de funções auxiliares.';

COMMENT ON FUNCTION public.update_acordo_sso(UUID, JSONB, TEXT) IS 
'Função RPC SSO para atualizar um acordo completo. 
Verifica permissão usando função auxiliar can_user_edit_acordo().
Aceita JSONB com campos opcionais para atualização parcial.';

COMMENT ON FUNCTION public.create_acordo_sso(JSONB, TEXT) IS 
'Função RPC SSO para criar um novo acordo. 
Verifica permissão usando função auxiliar can_user_create_acordo().
Valida que vendedores só podem criar acordos para si mesmos.';

COMMENT ON FUNCTION public.delete_acordo_sso(UUID, TEXT) IS 
'Função RPC SSO para excluir um acordo. 
Verifica permissão usando função auxiliar can_user_delete_acordo().
Apenas admin e gestor podem excluir acordos.';

