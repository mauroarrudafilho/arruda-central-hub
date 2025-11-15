-- Migration: Add Vercel URLs and icons to projects
-- Data: 2025-01-31
-- Descrição: Adiciona campos url_vercel e icone aos projetos e insere projetos com links do Vercel

-- ==============================================
-- ADICIONAR CAMPOS DE URL E ÍCONE AOS PROJETOS
-- ==============================================

ALTER TABLE public.rbac_projects 
ADD COLUMN IF NOT EXISTS url_vercel TEXT,
ADD COLUMN IF NOT EXISTS icone TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.rbac_projects.url_vercel IS 'URL do deploy no Vercel do projeto';
COMMENT ON COLUMN public.rbac_projects.icone IS 'Nome do ícone do projeto (lucide-react)';

-- ==============================================
-- INSERIR PROJETOS COM LINKS DO VERCEL
-- ==============================================

-- Inserir ou atualizar projetos
INSERT INTO public.rbac_projects (nome, descricao, slug, status, url_vercel, icone)
VALUES
  ('Acordos Comerciais', 'Gestão de acordos comerciais e contratos', 'acordos', 'ativo', 'https://acordo-flow.vercel.app/login', 'FileText'),
  ('Comercial+', 'Gestão comercial avançada e vendas', 'comercial-plus', 'ativo', 'https://arruda-sales-boost.vercel.app/auth', 'Building2'),
  ('Trade Marketing', 'Campanhas e promoções comerciais', 'trade-marketing', 'ativo', 'https://degusta-go.vercel.app/', 'BarChart3'),
  ('Financeiro', 'Controle financeiro e contabilidade', 'financeiro', 'ativo', 'https://arruda-flow-buddy.vercel.app/', 'DollarSign'),
  ('Meus Produtos', 'Repositório central de informações de produtos', 'meus-produtos', 'ativo', 'https://arruda-catalog-maker.vercel.app/', 'Package'),
  ('Meus Documentos', 'Ingestão e parse de NF-e, CT-e, boletos', 'meus-documentos', 'ativo', 'https://nfe-radar.vercel.app/auth', 'FileText'),
  ('Gestão de Usuários', 'Sistema principal de gestão de usuários e permissões', 'gestao-usuarios', 'ativo', NULL, 'Users')
ON CONFLICT (slug) 
DO UPDATE SET
  url_vercel = EXCLUDED.url_vercel,
  icone = EXCLUDED.icone,
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  updated_at = now();

-- ==============================================
-- ATUALIZAR FUNÇÃO get_user_projects
-- ==============================================

-- Dropar função existente antes de recriar com novos campos
DROP FUNCTION IF EXISTS public.get_user_projects(uuid);

CREATE OR REPLACE FUNCTION public.get_user_projects(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nome text,
  descricao text,
  slug text,
  status text,
  url_vercel text,
  icone text,
  nivel_acesso nivel_acesso
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome,
    p.descricao,
    p.slug,
    p.status,
    p.url_vercel,
    p.icone,
    COALESCE(upa.nivel_acesso, 'admin'::nivel_acesso) as nivel_acesso
  FROM rbac_projects p
  LEFT JOIN rbac_user_project_access upa ON upa.project_id = p.id AND upa.user_id = _user_id
  WHERE p.status = 'ativo' 
    AND (
      public.is_admin(_user_id) OR 
      upa.user_id IS NOT NULL
    )
  ORDER BY p.nome;
$$;

