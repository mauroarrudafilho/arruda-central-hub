-- Criar tabela de projetos
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de módulos por projeto
CREATE TABLE public.project_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  icone TEXT,
  rota TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, slug)
);

-- Criar tabela de acesso de usuários aos projetos
CREATE TABLE public.user_project_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nivel_acesso nivel_acesso NOT NULL DEFAULT 'visualizador',
  concedido_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_project_access ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projects
CREATE POLICY "Users can view projects they have access to" 
ON public.projects 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_project_access upa 
    WHERE upa.project_id = projects.id AND upa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage projects" 
ON public.projects 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Políticas RLS para project_modules
CREATE POLICY "Users can view modules of accessible projects" 
ON public.project_modules 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_project_access upa 
    WHERE upa.project_id = project_modules.project_id AND upa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage project modules" 
ON public.project_modules 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Políticas RLS para user_project_access
CREATE POLICY "Users can view their own project access" 
ON public.user_project_access 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage project access" 
ON public.user_project_access 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Função para verificar acesso a projeto
CREATE OR REPLACE FUNCTION public.user_has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_project_access
    WHERE user_id = _user_id 
      AND project_id = _project_id
  ) OR public.is_admin(_user_id);
$$;

-- Função para obter projetos do usuário
CREATE OR REPLACE FUNCTION public.get_user_projects(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nome text,
  descricao text,
  slug text,
  status text,
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
    COALESCE(upa.nivel_acesso, 'admin'::nivel_acesso) as nivel_acesso
  FROM public.projects p
  LEFT JOIN public.user_project_access upa ON upa.project_id = p.id AND upa.user_id = _user_id
  WHERE p.status = 'ativo' 
    AND (
      public.is_admin(_user_id) OR 
      upa.user_id IS NOT NULL
    )
  ORDER BY p.nome;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_modules_updated_at
  BEFORE UPDATE ON public.project_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_project_access_updated_at
  BEFORE UPDATE ON public.user_project_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir projeto padrão do sistema atual
INSERT INTO public.projects (nome, descricao, slug, status) VALUES
('Sistema de Gestão', 'Sistema principal de gestão de usuários e permissões', 'gestao', 'ativo');

-- Inserir módulos do projeto padrão
INSERT INTO public.project_modules (project_id, nome, slug, icone, rota, ordem) 
SELECT 
  p.id,
  modulo.nome,
  modulo.slug,
  modulo.icone,
  modulo.rota,
  modulo.ordem
FROM public.projects p
CROSS JOIN (VALUES
  ('Usuários', 'users', 'Users', '/users', 1),
  ('Papéis', 'roles', 'Shield', '/roles', 2),
  ('Auditoria', 'audit', 'FileText', '/audit', 3),
  ('Meu Perfil', 'profile', 'User', '/profile', 4)
) AS modulo(nome, slug, icone, rota, ordem)
WHERE p.slug = 'gestao';

-- Dar acesso automático aos admins para o projeto padrão
INSERT INTO public.user_project_access (user_id, project_id, nivel_acesso, concedido_por)
SELECT 
  aur.user_id,
  p.id,
  'admin'::nivel_acesso,
  aur.user_id
FROM public.auth_user_role aur
JOIN public.auth_role ar ON ar.id = aur.role_id
CROSS JOIN public.projects p
WHERE ar.nome = 'admin' 
  AND aur.ativo = true 
  AND ar.ativo = true
  AND p.slug = 'gestao'
ON CONFLICT (user_id, project_id) DO NOTHING;