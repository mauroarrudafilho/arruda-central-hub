-- Migration: Create Organizations Table
-- Data: 2025-01-30
-- Descrição: Cria tabela de organizações e migra dados de distribuidor para organizacao

-- ==============================================
-- CRIAR TABELA DE ORGANIZAÇÕES
-- ==============================================

CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir organizações existentes
INSERT INTO public.organizations (nome, slug, descricao) VALUES 
('Grupo Arruda', 'grupo-arruda', 'Organização principal do Grupo Arruda'),
('Vinícola Campestre', 'vinicola-campestre', 'Vinícola Campestre - Unidade de negócio');

-- ==============================================
-- ADICIONAR CAMPO ORGANIZACAO NA AUTH_PROFILE
-- ==============================================

-- Adicionar campo organizacao_id na tabela auth_profile
ALTER TABLE public.auth_profile 
ADD COLUMN organizacao_id UUID REFERENCES public.organizations(id);

-- ==============================================
-- MIGRAR DADOS EXISTENTES (se houver)
-- ==============================================

-- Se existirem dados de distribuidor, migrar para organizacao
-- Por enquanto, vamos assumir que todos os usuários pertencem ao Grupo Arruda
UPDATE public.auth_profile 
SET organizacao_id = (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda')
WHERE organizacao_id IS NULL;

-- ==============================================
-- ADICIONAR CAMPO ORGANIZACAO NA AUTH_ROLE
-- ==============================================

-- Adicionar campo organizacao_id na tabela auth_role
ALTER TABLE public.auth_role 
ADD COLUMN organizacao_id UUID REFERENCES public.organizations(id);

-- Migrar roles existentes para Grupo Arruda
UPDATE public.auth_role 
SET organizacao_id = (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda')
WHERE organizacao_id IS NULL;

-- ==============================================
-- CRIAR ÍNDICES
-- ==============================================

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_ativo ON public.organizations(ativo);
CREATE INDEX idx_auth_profile_organizacao_id ON public.auth_profile(organizacao_id);
CREATE INDEX idx_auth_role_organizacao_id ON public.auth_role(organizacao_id);

-- ==============================================
-- HABILITAR RLS
-- ==============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Política para organizações
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.auth_profile ap 
    WHERE ap.user_id = auth.uid() 
    AND ap.organizacao_id = organizations.id
  )
);

CREATE POLICY "Admins can manage organizations" 
ON public.organizations 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- ==============================================
-- FUNÇÕES AUXILIARES
-- ==============================================

-- Função para obter organização do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nome text,
  slug text,
  descricao text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.nome,
    o.slug,
    o.descricao
  FROM public.organizations o
  JOIN public.auth_profile ap ON ap.organizacao_id = o.id
  WHERE ap.user_id = _user_id;
$$;

-- Função para verificar se usuário pertence à organização
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(
  _user_id uuid,
  _organization_slug text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auth_profile ap
    JOIN public.organizations o ON o.id = ap.organizacao_id
    WHERE ap.user_id = _user_id 
    AND o.slug = _organization_slug
  );
$$;

-- ==============================================
-- TRIGGERS PARA UPDATED_AT
-- ==============================================

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
