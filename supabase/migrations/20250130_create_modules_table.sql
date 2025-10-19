-- Migration: Create Modules Table
-- Data: 2025-01-30
-- Descrição: Cria tabela de módulos/telas para registrar os módulos implementados no sistema

-- ==============================================
-- CRIAR TABELA DE MÓDULOS
-- ==============================================

CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT, -- Nome do ícone (ex: 'Users', 'Building2', 'DollarSign')
  rota TEXT, -- Rota do módulo (ex: '/acordos', '/trade-marketing')
  url_externa TEXT, -- URL externa se for micro-frontend
  status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('disponivel', 'desenvolvimento', 'planejado', 'manutencao', 'descontinuado')),
  organizacao_id UUID REFERENCES public.organizations(id), -- Módulo específico de uma organização (null = global)
  categoria TEXT NOT NULL DEFAULT 'negocio' CHECK (categoria IN ('negocio', 'sistema', 'relatorio', 'integracao')),
  ordem INTEGER NOT NULL DEFAULT 0, -- Ordem de exibição no hub
  ativo BOOLEAN NOT NULL DEFAULT true,
  versao TEXT DEFAULT '1.0.0',
  desenvolvedor TEXT, -- Responsável pelo desenvolvimento
  data_lancamento TIMESTAMP WITH TIME ZONE,
  data_atualizacao TIMESTAMP WITH TIME ZONE,
  configuracoes JSONB DEFAULT '{}'::jsonb, -- Configurações específicas do módulo
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- INSERIR MÓDULOS EXISTENTES
-- ==============================================

-- Módulos Disponíveis
INSERT INTO public.modules (nome, slug, descricao, icone, rota, status, categoria, ordem, versao) VALUES 
('Gestão de Usuários', 'gestao-usuarios', 'Controle de usuários, permissões e acesso ao sistema', 'Users', '/users', 'disponivel', 'sistema', 1, '1.0.0'),
('Trade Marketing', 'trade-marketing', 'Campanhas e promoções comerciais', 'BarChart3', '/trade-marketing', 'disponivel', 'negocio', 2, '1.0.0'),
('Acordos Comerciais', 'acordos-comerciais', 'Gestão de acordos comerciais e contratos', 'FileText', '/acordos', 'disponivel', 'negocio', 3, '1.0.0'),
('Meus Documentos', 'meus-documentos', 'Ingestão e parse de NF-e, CT-e, boletos', 'FileText', '/documentos', 'disponivel', 'negocio', 4, '1.0.0');

-- Módulos em Desenvolvimento
INSERT INTO public.modules (nome, slug, descricao, icone, rota, status, categoria, ordem, versao) VALUES 
('Comercial+', 'comercial-plus', 'Gestão comercial avançada e vendas', 'Building2', '/comercial', 'desenvolvimento', 'negocio', 5, '0.8.0'),
('Financeiro', 'financeiro', 'Controle financeiro e contabilidade', 'DollarSign', '/financeiro', 'desenvolvimento', 'negocio', 6, '0.7.0'),
('Always On', 'always-on', 'Monitoramento 24/7 do sistema', 'Activity', '/monitoring', 'desenvolvimento', 'sistema', 7, '0.6.0'),
('Logística', 'logistica', 'Controle logístico e distribuição', 'Truck', '/logistica', 'desenvolvimento', 'negocio', 8, '0.5.0'),
('Reembolsos', 'reembolsos', 'Controle de reembolsos e devoluções', 'Gift', '/reembolsos', 'desenvolvimento', 'negocio', 9, '0.4.0');

-- Módulos Planejados
INSERT INTO public.modules (nome, slug, descricao, icone, rota, status, categoria, ordem, versao) VALUES 
('Gestor de Comissão', 'gestor-comissao', 'Motor de cálculo, repasse e extratos de comissão', 'Calculator', '/comissoes', 'planejado', 'negocio', 10, '0.0.0'),
('Gestor de Pricing', 'gestor-pricing', 'Histórico de preços, lógica de tabela, promoções e rebaixas', 'TrendingUp', '/pricing', 'planejado', 'negocio', 11, '0.0.0'),
('Analytics', 'analytics', 'Motor de performance, relatórios estilo Tableau, tela de insights', 'BarChart3', '/analytics', 'planejado', 'relatorio', 12, '0.0.0'),
('Flex Tracker', 'flex-tracker', 'Monitoramento de savings em negociações', 'Target', '/flex-tracker', 'planejado', 'negocio', 13, '0.0.0'),
('LMS', 'lms', 'Treinamentos, trilhas, certificações', 'GraduationCap', '/lms', 'planejado', 'sistema', 14, '0.0.0'),
('Meus Produtos', 'meus-produtos', 'Repositório central de informações de produtos', 'Package', '/produtos', 'planejado', 'negocio', 15, '0.0.0'),
('Cliente 360º', 'cliente-360', 'Visão unificada e detalhada do cliente', 'Users', '/cliente-360', 'planejado', 'negocio', 16, '0.0.0');

-- ==============================================
-- CRIAR TABELA DE ACESSO A MÓDULOS POR USUÁRIO
-- ==============================================

CREATE TABLE public.user_module_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  nivel_acesso TEXT NOT NULL DEFAULT 'visualizador' CHECK (nivel_acesso IN ('admin', 'gestor', 'visualizador')),
  concedido_por UUID REFERENCES auth.users(id),
  data_concessao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- ==============================================
-- CRIAR TABELA DE ESTATÍSTICAS DE MÓDULOS
-- ==============================================

CREATE TABLE public.module_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  acessos INTEGER NOT NULL DEFAULT 0,
  usuarios_unicos INTEGER NOT NULL DEFAULT 0,
  tempo_medio_sessao INTEGER, -- em segundos
  erros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_id, data)
);

-- ==============================================
-- CRIAR ÍNDICES
-- ==============================================

CREATE INDEX idx_modules_slug ON public.modules(slug);
CREATE INDEX idx_modules_status ON public.modules(status);
CREATE INDEX idx_modules_organizacao_id ON public.modules(organizacao_id);
CREATE INDEX idx_modules_categoria ON public.modules(categoria);
CREATE INDEX idx_modules_ativo ON public.modules(ativo);
CREATE INDEX idx_modules_ordem ON public.modules(ordem);

CREATE INDEX idx_user_module_access_user_id ON public.user_module_access(user_id);
CREATE INDEX idx_user_module_access_module_id ON public.user_module_access(module_id);
CREATE INDEX idx_user_module_access_ativo ON public.user_module_access(ativo);

CREATE INDEX idx_module_stats_module_id ON public.module_stats(module_id);
CREATE INDEX idx_module_stats_data ON public.module_stats(data);

-- ==============================================
-- HABILITAR RLS
-- ==============================================

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para modules
CREATE POLICY "Users can view modules they have access to" 
ON public.modules 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_module_access uma 
    WHERE uma.module_id = modules.id 
    AND uma.user_id = auth.uid() 
    AND uma.ativo = true
  ) OR
  modules.status = 'disponivel'
);

CREATE POLICY "Admins can manage modules" 
ON public.modules 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Políticas RLS para user_module_access
CREATE POLICY "Users can view their own module access" 
ON public.user_module_access 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage module access" 
ON public.user_module_access 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Políticas RLS para module_stats
CREATE POLICY "Users can view module stats for accessible modules" 
ON public.module_stats 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_module_access uma 
    WHERE uma.module_id = module_stats.module_id 
    AND uma.user_id = auth.uid() 
    AND uma.ativo = true
  )
);

CREATE POLICY "Admins can manage module stats" 
ON public.module_stats 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- ==============================================
-- FUNÇÕES AUXILIARES
-- ==============================================

-- Função para obter módulos do usuário
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nome text,
  slug text,
  descricao text,
  icone text,
  rota text,
  url_externa text,
  status text,
  categoria text,
  ordem integer,
  nivel_acesso text,
  versao text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.nome,
    m.slug,
    m.descricao,
    m.icone,
    m.rota,
    m.url_externa,
    m.status,
    m.categoria,
    m.ordem,
    COALESCE(uma.nivel_acesso, 'visualizador'::text) as nivel_acesso,
    m.versao
  FROM public.modules m
  LEFT JOIN public.user_module_access uma ON uma.module_id = m.id AND uma.user_id = _user_id AND uma.ativo = true
  WHERE m.ativo = true 
    AND (
      public.is_admin(_user_id) OR 
      uma.user_id IS NOT NULL OR
      m.status = 'disponivel'
    )
  ORDER BY m.ordem, m.nome;
$$;

-- Função para verificar acesso a módulo
CREATE OR REPLACE FUNCTION public.user_has_module_access(
  _user_id uuid,
  _module_slug text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.modules m
    LEFT JOIN public.user_module_access uma ON uma.module_id = m.id AND uma.user_id = _user_id AND uma.ativo = true
    WHERE m.slug = _module_slug 
    AND m.ativo = true
    AND (
      public.is_admin(_user_id) OR 
      uma.user_id IS NOT NULL OR
      m.status = 'disponivel'
    )
  );
$$;

-- Função para registrar acesso a módulo
CREATE OR REPLACE FUNCTION public.record_module_access(
  _module_slug text,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _module_id uuid;
BEGIN
  -- Obter ID do módulo
  SELECT id INTO _module_id 
  FROM public.modules 
  WHERE slug = _module_slug AND ativo = true;
  
  IF _module_id IS NULL THEN
    RAISE EXCEPTION 'Módulo não encontrado: %', _module_slug;
  END IF;
  
  -- Inserir ou atualizar estatística do dia
  INSERT INTO public.module_stats (module_id, data, acessos, usuarios_unicos)
  VALUES (_module_id, CURRENT_DATE, 1, 1)
  ON CONFLICT (module_id, data) 
  DO UPDATE SET 
    acessos = module_stats.acessos + 1,
    usuarios_unicos = CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM public.module_stats ms2 
        WHERE ms2.module_id = _module_id 
        AND ms2.data = CURRENT_DATE 
        AND ms2.user_id = _user_id
      ) THEN module_stats.usuarios_unicos + 1
      ELSE module_stats.usuarios_unicos
    END;
END;
$$;

-- ==============================================
-- TRIGGERS PARA UPDATED_AT
-- ==============================================

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_module_access_updated_at
  BEFORE UPDATE ON public.user_module_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE public.modules IS 'Tabela de módulos/telas do sistema Arruda Hub';
COMMENT ON COLUMN public.modules.slug IS 'Slug único do módulo (ex: gestao-usuarios, trade-marketing)';
COMMENT ON COLUMN public.modules.status IS 'Status do módulo: disponivel, desenvolvimento, planejado, manutencao, descontinuado';
COMMENT ON COLUMN public.modules.categoria IS 'Categoria do módulo: negocio, sistema, relatorio, integracao';
COMMENT ON COLUMN public.modules.organizacao_id IS 'Módulo específico de uma organização (null = global)';
COMMENT ON COLUMN public.modules.configuracoes IS 'Configurações específicas do módulo em formato JSON';

COMMENT ON TABLE public.user_module_access IS 'Controle de acesso de usuários aos módulos';
COMMENT ON TABLE public.module_stats IS 'Estatísticas de uso dos módulos por dia';

COMMENT ON FUNCTION public.get_user_modules IS 'Retorna os módulos acessíveis pelo usuário';
COMMENT ON FUNCTION public.user_has_module_access IS 'Verifica se usuário tem acesso ao módulo';
COMMENT ON FUNCTION public.record_module_access IS 'Registra acesso do usuário ao módulo';
