-- Schema para Sistema de Gestão de Usuários Arruda Hub

-- Tabela de perfis de usuário
CREATE TABLE public.auth_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  telefone TEXT,
  cargo TEXT,
  departamento TEXT,
  distribuidor TEXT,
  time_id TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  api_tokens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de papéis/roles
CREATE TABLE public.auth_role (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT DEFAULT '#6366f1',
  sistema BOOLEAN NOT NULL DEFAULT false, -- roles do sistema não podem ser deletados
  distribuidor TEXT, -- null = global, string = específico do distribuidor
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de permissões
CREATE TABLE public.auth_permission (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  modulo TEXT NOT NULL,
  acao TEXT NOT NULL,
  descricao TEXT,
  sistema BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relação papéis x permissões
CREATE TABLE public.auth_role_permission (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.auth_role(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.auth_permission(id) ON DELETE CASCADE,
  concedida BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Tabela de relação usuários x papéis
CREATE TABLE public.auth_user_role (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.auth_role(id) ON DELETE CASCADE,
  concedido_por UUID REFERENCES auth.users(id),
  data_concessao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Tabela de auditoria
CREATE TABLE public.auth_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  recurso_tipo TEXT,
  recurso_id TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  origem TEXT NOT NULL DEFAULT 'web', -- web, api, mobile
  nivel TEXT NOT NULL DEFAULT 'info' CHECK (nivel IN ('debug', 'info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_auth_profile_user_id ON public.auth_profile(user_id);
CREATE INDEX idx_auth_profile_distribuidor ON public.auth_profile(distribuidor);
CREATE INDEX idx_auth_profile_status ON public.auth_profile(status);
CREATE INDEX idx_auth_role_distribuidor ON public.auth_role(distribuidor);
CREATE INDEX idx_auth_role_ativo ON public.auth_role(ativo);
CREATE INDEX idx_auth_user_role_user_id ON public.auth_user_role(user_id);
CREATE INDEX idx_auth_user_role_role_id ON public.auth_user_role(role_id);
CREATE INDEX idx_auth_user_role_ativo ON public.auth_user_role(ativo);
CREATE INDEX idx_auth_audit_user_id ON public.auth_audit(user_id);
CREATE INDEX idx_auth_audit_acao ON public.auth_audit(acao);
CREATE INDEX idx_auth_audit_created_at ON public.auth_audit(created_at);

-- Enable RLS
ALTER TABLE public.auth_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_role_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit ENABLE ROW LEVEL SECURITY;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auth_profile_updated_at 
  BEFORE UPDATE ON public.auth_profile 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auth_role_updated_at 
  BEFORE UPDATE ON public.auth_role 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auth_permission_updated_at 
  BEFORE UPDATE ON public.auth_permission 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth_user_role aur
    JOIN auth_role ar ON ar.id = aur.role_id
    JOIN auth_role_permission arp ON arp.role_id = ar.id
    JOIN auth_permission ap ON ap.id = arp.permission_id
    WHERE aur.user_id = $1 
      AND ap.nome = $2
      AND aur.ativo = true 
      AND ar.ativo = true
      AND arp.concedida = true
      AND (aur.data_expiracao IS NULL OR aur.data_expiracao > now())
  );
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth_user_role aur
    JOIN auth_role ar ON ar.id = aur.role_id
    WHERE aur.user_id = COALESCE($1, auth.uid())
      AND ar.nome = 'admin'
      AND aur.ativo = true 
      AND ar.ativo = true
      AND (aur.data_expiracao IS NULL OR aur.data_expiracao > now())
  );
$$;