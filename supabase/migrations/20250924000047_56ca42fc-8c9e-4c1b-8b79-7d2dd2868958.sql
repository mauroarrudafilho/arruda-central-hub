-- Função simples para buscar detalhes de um usuário
CREATE OR REPLACE FUNCTION public.get_user_basic_info(_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  nome text,
  email text,
  status text,
  ultimo_login timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ap.user_id,
    ap.nome,
    ap.email,
    ap.status,
    ap.ultimo_login,
    ap.created_at
  FROM auth_profile ap
  WHERE ap.user_id = _user_id;
$$;

-- Função para atualizar acesso de usuário a projeto
CREATE OR REPLACE FUNCTION public.update_user_project_access(
  _user_id uuid,
  _project_id uuid,
  _access_level nivel_acesso,
  _grant_access boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual tem permissão (admin ou gestor)
  IF NOT (is_admin() OR get_user_access_level() = 'gestor'::nivel_acesso) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins e gestores podem gerenciar acessos';
  END IF;

  IF _grant_access THEN
    -- Conceder acesso
    INSERT INTO user_project_access (user_id, project_id, nivel_acesso)
    VALUES (_user_id, _project_id, _access_level)
    ON CONFLICT (user_id, project_id) 
    DO UPDATE SET 
      nivel_acesso = _access_level,
      updated_at = now();
  ELSE
    -- Remover acesso
    DELETE FROM user_project_access 
    WHERE user_id = _user_id AND project_id = _project_id;
  END IF;

  RETURN true;
END;
$$;