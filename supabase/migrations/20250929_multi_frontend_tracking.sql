-- Migration: Multi-Frontend Session Tracking
-- Adiciona suporte para rastreamento de sessões entre múltiplos frontends

-- Tabela para rastrear sessões ativas entre frontends
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  frontend_origin TEXT NOT NULL, -- URL/identificador do frontend
  frontend_module TEXT NOT NULL, -- nome do módulo (acordos, trade-marketing, etc)
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear acessos a recursos específicos
CREATE TABLE public.resource_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL, -- 'page', 'api', 'action', etc
  resource_path TEXT NOT NULL, -- '/acordos/create', '/api/users', etc
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', etc
  success BOOLEAN NOT NULL DEFAULT true,
  response_time INTEGER, -- em ms
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações de módulos/frontends
CREATE TABLE public.frontend_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL, -- 'acordos', 'trade-marketing', etc
  display_name TEXT NOT NULL,
  frontend_url TEXT NOT NULL,
  api_key TEXT, -- para validação entre frontends
  allowed_origins TEXT[] DEFAULT '{}', -- URLs permitidas
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, module_name)
);

-- Índices para performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_project_id ON public.user_sessions(project_id);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity);
CREATE INDEX idx_user_sessions_frontend_module ON public.user_sessions(frontend_module);

CREATE INDEX idx_resource_access_log_user_id ON public.resource_access_log(user_id);
CREATE INDEX idx_resource_access_log_session_id ON public.resource_access_log(session_id);
CREATE INDEX idx_resource_access_log_created_at ON public.resource_access_log(created_at);
CREATE INDEX idx_resource_access_log_resource_type ON public.resource_access_log(resource_type);

CREATE INDEX idx_frontend_modules_project_id ON public.frontend_modules(project_id);
CREATE INDEX idx_frontend_modules_module_name ON public.frontend_modules(module_name);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "System can manage sessions" 
ON public.user_sessions 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own access logs" 
ON public.resource_access_log 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "System can create access logs" 
ON public.resource_access_log 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage frontend modules" 
ON public.frontend_modules 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view frontend modules they have access to" 
ON public.frontend_modules 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_project_access upa 
    WHERE upa.project_id = frontend_modules.project_id 
    AND upa.user_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_frontend_modules_updated_at
  BEFORE UPDATE ON public.frontend_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar/atualizar sessão de frontend
CREATE OR REPLACE FUNCTION public.create_frontend_session(
  _project_id uuid,
  _frontend_module text,
  _frontend_origin text,
  _session_token text DEFAULT null
)
RETURNS TABLE(
  session_id uuid,
  session_token text,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _token text;
  _session_id uuid;
  _expires_at timestamp with time zone;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Verificar se o usuário tem acesso ao projeto
  IF NOT user_has_project_access(_user_id, _project_id) THEN
    RAISE EXCEPTION 'User does not have access to this project';
  END IF;

  -- Gerar token se não fornecido
  _token := COALESCE(_session_token, encode(gen_random_bytes(32), 'base64'));
  _expires_at := now() + interval '24 hours';

  -- Inserir ou atualizar sessão
  INSERT INTO user_sessions (
    user_id, 
    project_id, 
    session_token, 
    frontend_origin, 
    frontend_module,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    _user_id,
    _project_id,
    _token,
    _frontend_origin,
    _frontend_module,
    _expires_at,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  )
  ON CONFLICT (session_token) 
  DO UPDATE SET 
    last_activity = now(),
    expires_at = _expires_at,
    updated_at = now()
  RETURNING id INTO _session_id;

  -- Limpar sessões expiradas
  DELETE FROM user_sessions 
  WHERE user_id = _user_id 
  AND expires_at < now();

  RETURN QUERY SELECT _session_id, _token, _expires_at;
END;
$$;

-- Função para validar sessão entre frontends
CREATE OR REPLACE FUNCTION public.validate_frontend_session(_session_token text)
RETURNS TABLE(
  user_id uuid,
  project_id uuid,
  frontend_module text,
  permissions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session user_sessions%ROWTYPE;
  _user_permissions jsonb := '[]'::jsonb;
BEGIN
  -- Buscar sessão ativa
  SELECT * INTO _session
  FROM user_sessions
  WHERE session_token = _session_token
  AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;

  -- Atualizar última atividade
  UPDATE user_sessions 
  SET last_activity = now(),
      updated_at = now()
  WHERE id = _session.id;

  -- Buscar permissões do usuário para o projeto
  SELECT jsonb_agg(
    jsonb_build_object(
      'permission', ap.nome,
      'module', ap.modulo,
      'action', ap.acao,
      'granted', arp.concedida
    )
  ) INTO _user_permissions
  FROM auth_user_role aur
  JOIN auth_role ar ON ar.id = aur.role_id
  JOIN auth_role_permission arp ON arp.role_id = ar.id
  JOIN auth_permission ap ON ap.id = arp.permission_id
  WHERE aur.user_id = _session.user_id
  AND aur.ativo = true
  AND ar.ativo = true
  AND arp.concedida = true;

  RETURN QUERY SELECT 
    _session.user_id,
    _session.project_id,
    _session.frontend_module,
    COALESCE(_user_permissions, '[]'::jsonb);
END;
$$;

-- Função para log de acesso a recursos
CREATE OR REPLACE FUNCTION public.log_resource_access(
  _session_token text,
  _resource_type text,
  _resource_path text,
  _action text,
  _success boolean DEFAULT true,
  _response_time integer DEFAULT null,
  _error_message text DEFAULT null,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session user_sessions%ROWTYPE;
BEGIN
  -- Buscar sessão
  SELECT * INTO _session
  FROM user_sessions
  WHERE session_token = _session_token
  AND expires_at > now();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Inserir log
  INSERT INTO resource_access_log (
    user_id,
    session_id,
    project_id,
    resource_type,
    resource_path,
    action,
    success,
    response_time,
    error_message,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    _session.user_id,
    _session.id,
    _session.project_id,
    _resource_type,
    _resource_path,
    _action,
    _success,
    _response_time,
    _error_message,
    _metadata,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  RETURN true;
END;
$$;

-- Inserir módulos padrão
INSERT INTO public.frontend_modules (project_id, module_name, display_name, frontend_url, status)
SELECT 
  p.id,
  modulo.name,
  modulo.display_name,
  modulo.url,
  'ativo'
FROM public.projects p
CROSS JOIN (VALUES
  ('rbac', 'Sistema RBAC', 'http://localhost:8083', 'ativo'),
  ('acordos', 'Acordos Comerciais', 'https://acordo-flow.lovable.app', 'ativo'),
  ('degustacao', 'Degustação & Trade', 'https://degusta-go.lovable.app', 'ativo')
) AS modulo(name, display_name, url, status)
WHERE p.slug = 'gestao'
ON CONFLICT (project_id, module_name) DO NOTHING;

-- Criar permissões específicas para módulos
INSERT INTO public.auth_permission (nome, modulo, acao, descricao, sistema)
VALUES
  ('module.acordos.access', 'acordos', 'access', 'Acesso ao módulo de acordos comerciais', true),
  ('module.acordos.create', 'acordos', 'create', 'Criar acordos comerciais', true),
  ('module.acordos.edit', 'acordos', 'edit', 'Editar acordos comerciais', true),
  ('module.acordos.delete', 'acordos', 'delete', 'Deletar acordos comerciais', true),
  ('module.acordos.approve', 'acordos', 'approve', 'Aprovar acordos comerciais', true),
  ('module.degustacao.access', 'degustacao', 'access', 'Acesso ao módulo de degustação', true),
  ('module.degustacao.create', 'degustacao', 'create', 'Criar campanhas de degustação', true),
  ('module.degustacao.edit', 'degustacao', 'edit', 'Editar campanhas de degustação', true),
  ('module.degustacao.delete', 'degustacao', 'delete', 'Deletar campanhas de degustação', true),
  ('module.degustacao.manage', 'degustacao', 'manage', 'Gerenciar degustadoras', true)
ON CONFLICT (nome) DO NOTHING;

-- Conceder permissões de módulos para admin
INSERT INTO public.auth_role_permission (role_id, permission_id, concedida)
SELECT 
  ar.id,
  ap.id,
  true
FROM public.auth_role ar
CROSS JOIN public.auth_permission ap
WHERE ar.nome = 'admin'
AND ap.modulo IN ('acordos', 'degustacao')
ON CONFLICT (role_id, permission_id) DO NOTHING;
