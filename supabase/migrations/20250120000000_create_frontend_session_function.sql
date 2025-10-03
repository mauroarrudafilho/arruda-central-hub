-- Função para criar sessão de frontend
CREATE OR REPLACE FUNCTION create_frontend_session(
  _project_id UUID,
  _frontend_module TEXT,
  _frontend_origin TEXT
)
RETURNS TABLE (
  session_token TEXT,
  expires_at TIMESTAMPTZ,
  frontend_module TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _session_token TEXT;
  _expires_at TIMESTAMPTZ;
  _user_id UUID;
BEGIN
  -- Verificar se o usuário está autenticado
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Gerar token de sessão único
  _session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Definir expiração (2 horas)
  _expires_at := NOW() + INTERVAL '2 hours';

  -- Inserir/atualizar sessão do usuário
  INSERT INTO public.user_sessions (
    user_id,
    project_id,
    frontend_module,
    session_token,
    expires_at,
    frontend_origin,
    last_activity
  ) VALUES (
    _user_id,
    _project_id,
    _frontend_module,
    _session_token,
    _expires_at,
    _frontend_origin,
    NOW()
  )
  ON CONFLICT (user_id, frontend_module) 
  DO UPDATE SET
    session_token = EXCLUDED.session_token,
    expires_at = EXCLUDED.expires_at,
    frontend_origin = EXCLUDED.frontend_origin,
    last_activity = NOW(),
    updated_at = NOW();

  -- Retornar informações da sessão
  RETURN QUERY SELECT 
    _session_token,
    _expires_at,
    _frontend_module;
END;
$$;

-- Função para validar token de sessão
CREATE OR REPLACE FUNCTION validate_frontend_session(
  _session_token TEXT,
  _frontend_module TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  expires_at TIMESTAMPTZ,
  frontend_origin TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID;
  _expires_at TIMESTAMPTZ;
  _frontend_origin TEXT;
  _is_valid BOOLEAN := FALSE;
BEGIN
  -- Buscar sessão válida
  SELECT 
    us.user_id,
    us.expires_at,
    us.frontend_origin
  INTO 
    _user_id,
    _expires_at,
    _frontend_origin
  FROM public.user_sessions us
  WHERE us.session_token = _session_token
    AND us.frontend_module = _frontend_module
    AND us.expires_at > NOW()
    AND us.status = 'ativo';

  -- Verificar se encontrou sessão válida
  IF _user_id IS NOT NULL THEN
    _is_valid := TRUE;
    
    -- Atualizar última atividade
    UPDATE public.user_sessions 
    SET last_activity = NOW()
    WHERE session_token = _session_token 
      AND frontend_module = _frontend_module;
  END IF;

  -- Retornar resultado
  RETURN QUERY SELECT 
    _is_valid,
    _user_id,
    _expires_at,
    _frontend_origin;
END;
$$;

-- Função para encerrar sessão
CREATE OR REPLACE FUNCTION end_frontend_session(
  _session_token TEXT,
  _frontend_module TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Verificar se o usuário está autenticado
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Encerrar sessão
  UPDATE public.user_sessions 
  SET 
    status = 'encerrada',
    ended_at = NOW(),
    updated_at = NOW()
  WHERE session_token = _session_token 
    AND frontend_module = _frontend_module
    AND user_id = _user_id;

  RETURN TRUE;
END;
$$;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _cleaned_count INTEGER;
BEGIN
  -- Marcar sessões expiradas como encerradas
  UPDATE public.user_sessions 
  SET 
    status = 'expirada',
    ended_at = NOW(),
    updated_at = NOW()
  WHERE expires_at <= NOW() 
    AND status = 'ativo';

  GET DIAGNOSTICS _cleaned_count = ROW_COUNT;
  
  RETURN _cleaned_count;
END;
$$;

-- Comentários das funções
COMMENT ON FUNCTION create_frontend_session IS 'Cria uma nova sessão de frontend com token temporário';
COMMENT ON FUNCTION validate_frontend_session IS 'Valida um token de sessão de frontend';
COMMENT ON FUNCTION end_frontend_session IS 'Encerra uma sessão de frontend';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Limpa sessões expiradas do sistema';

