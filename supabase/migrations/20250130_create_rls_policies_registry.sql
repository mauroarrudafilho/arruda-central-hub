-- Migration: Create RLS Policies Registry System
-- Data: 2025-01-30
-- Descrição: Sistema para registrar e gerenciar políticas RLS por roles de cada projeto

-- ==============================================
-- CRIAR TABELA DE REGISTRO DE POLÍTICAS RLS
-- ==============================================

CREATE TABLE public.rbac_rls_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL, -- Nome da política (ex: "Users can view acordos")
  tabela TEXT NOT NULL, -- Nome da tabela (ex: "acordos")
  operacao TEXT NOT NULL CHECK (operacao IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')), -- Operação da política
  condicao_using TEXT, -- Condição USING da política
  condicao_with_check TEXT, -- Condição WITH CHECK da política
  projeto_id UUID REFERENCES public.rbac_projects(id), -- Projeto específico (null = global)
  modulo_id UUID REFERENCES public.rbac_modules(id), -- Módulo específico (null = global)
  organizacao_id UUID REFERENCES public.rbac_organizations(id), -- Organização específica (null = global)
  role_id UUID REFERENCES public.rbac_auth_role(id), -- Role específico (null = aplica a todos)
  prioridade INTEGER NOT NULL DEFAULT 0, -- Prioridade da política (maior = mais específica)
  ativo BOOLEAN NOT NULL DEFAULT true,
  descricao TEXT,
  tags TEXT[], -- Tags para categorização
  configuracoes JSONB DEFAULT '{}'::jsonb, -- Configurações específicas da política
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ==============================================
-- CRIAR TABELA DE HISTÓRICO DE POLÍTICAS
-- ==============================================

CREATE TABLE public.rbac_rls_policy_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.rbac_rls_policies(id) ON DELETE CASCADE,
  acao TEXT NOT NULL CHECK (acao IN ('created', 'updated', 'activated', 'deactivated', 'deleted')),
  dados_anteriores JSONB,
  dados_novos JSONB,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ==============================================
-- CRIAR TABELA DE APLICAÇÃO DE POLÍTICAS
-- ==============================================

CREATE TABLE public.rbac_rls_policy_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.rbac_rls_policies(id) ON DELETE CASCADE,
  tabela TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'failed', 'rolled_back')),
  erro TEXT,
  aplicado_em TIMESTAMP WITH TIME ZONE,
  aplicado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- CRIAR ÍNDICES
-- ==============================================

CREATE INDEX idx_rbac_rls_policies_tabela ON public.rbac_rls_policies(tabela);
CREATE INDEX idx_rbac_rls_policies_operacao ON public.rbac_rls_policies(operacao);
CREATE INDEX idx_rbac_rls_policies_projeto_id ON public.rbac_rls_policies(projeto_id);
CREATE INDEX idx_rbac_rls_policies_modulo_id ON public.rbac_rls_policies(modulo_id);
CREATE INDEX idx_rbac_rls_policies_organizacao_id ON public.rbac_rls_policies(organizacao_id);
CREATE INDEX idx_rbac_rls_policies_role_id ON public.rbac_rls_policies(role_id);
CREATE INDEX idx_rbac_rls_policies_ativo ON public.rbac_rls_policies(ativo);
CREATE INDEX idx_rbac_rls_policies_prioridade ON public.rbac_rls_policies(prioridade);

CREATE INDEX idx_rbac_rls_policy_history_policy_id ON public.rbac_rls_policy_history(policy_id);
CREATE INDEX idx_rbac_rls_policy_history_created_at ON public.rbac_rls_policy_history(created_at);

CREATE INDEX idx_rbac_rls_policy_applications_policy_id ON public.rbac_rls_policy_applications(policy_id);
CREATE INDEX idx_rbac_rls_policy_applications_status ON public.rbac_rls_policy_applications(status);

-- ==============================================
-- HABILITAR RLS
-- ==============================================

ALTER TABLE public.rbac_rls_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_rls_policy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_rls_policy_applications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rbac_rls_policies
CREATE POLICY "Users can view policies they have access to" 
ON public.rbac_rls_policies 
FOR SELECT 
USING (
  is_admin() OR 
  (
    organizacao_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM rbac_auth_profile ap 
      WHERE ap.user_id = auth.uid() 
      AND ap.organizacao_id = rbac_rls_policies.organizacao_id
    )
  ) AND
  (
    projeto_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM rbac_user_project_access upa 
      WHERE upa.user_id = auth.uid() 
      AND upa.project_id = rbac_rls_policies.projeto_id
    )
  )
);

CREATE POLICY "Admins can manage policies" 
ON public.rbac_rls_policies 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Políticas RLS para rbac_rls_policy_history
CREATE POLICY "Users can view policy history for accessible policies" 
ON public.rbac_rls_policy_history 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM rbac_rls_policies p 
    WHERE p.id = rbac_rls_policy_history.policy_id
    AND (
      p.organizacao_id IS NULL OR 
      EXISTS (
        SELECT 1 FROM rbac_auth_profile ap 
        WHERE ap.user_id = auth.uid() 
        AND ap.organizacao_id = p.organizacao_id
      )
    )
  )
);

CREATE POLICY "Admins can manage policy history" 
ON public.rbac_rls_policy_history 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Políticas RLS para rbac_rls_policy_applications
CREATE POLICY "Users can view policy applications for accessible policies" 
ON public.rbac_rls_policy_applications 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM rbac_rls_policies p 
    WHERE p.id = rbac_rls_policy_applications.policy_id
    AND (
      p.organizacao_id IS NULL OR 
      EXISTS (
        SELECT 1 FROM rbac_auth_profile ap 
        WHERE ap.user_id = auth.uid() 
        AND ap.organizacao_id = p.organizacao_id
      )
    )
  )
);

CREATE POLICY "Admins can manage policy applications" 
ON public.rbac_rls_policy_applications 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- ==============================================
-- FUNÇÕES AUXILIARES
-- ==============================================

-- Função para aplicar política RLS
CREATE OR REPLACE FUNCTION public.apply_rls_policy(_policy_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _policy RECORD;
  _policy_name TEXT;
  _sql TEXT;
BEGIN
  -- Buscar política
  SELECT * INTO _policy 
  FROM rbac_rls_policies 
  WHERE id = _policy_id AND ativo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Política não encontrada ou inativa: %', _policy_id;
  END IF;
  
  -- Construir nome da política
  _policy_name := format('%s_%s_%s', _policy.tabela, _policy.operacao, _policy.id::text);
  
  -- Construir SQL da política
  IF _policy.operacao = 'ALL' THEN
    _sql := format('
      CREATE POLICY "%s" 
      ON public.%I 
      FOR ALL 
      USING (%s)
      WITH CHECK (%s)', 
      _policy_name, 
      _policy.tabela, 
      COALESCE(_policy.condicao_using, 'true'),
      COALESCE(_policy.condicao_with_check, 'true')
    );
  ELSE
    _sql := format('
      CREATE POLICY "%s" 
      ON public.%I 
      FOR %s 
      USING (%s)
      WITH CHECK (%s)', 
      _policy_name, 
      _policy.tabela, 
      _policy.operacao,
      COALESCE(_policy.condicao_using, 'true'),
      COALESCE(_policy.condicao_with_check, 'true')
    );
  END IF;
  
  -- Aplicar política
  BEGIN
    EXECUTE _sql;
    
    -- Registrar aplicação
    INSERT INTO rbac_rls_policy_applications (
      policy_id, 
      tabela, 
      status, 
      aplicado_em, 
      aplicado_por
    ) VALUES (
      _policy_id, 
      _policy.tabela, 
      'applied', 
      now(), 
      auth.uid()
    );
    
    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    -- Registrar erro
    INSERT INTO rbac_rls_policy_applications (
      policy_id, 
      tabela, 
      status, 
      erro, 
      aplicado_em, 
      aplicado_por
    ) VALUES (
      _policy_id, 
      _policy.tabela, 
      'failed', 
      SQLERRM, 
      now(), 
      auth.uid()
    );
    
    RETURN false;
  END;
END;
$$;

-- Função para remover política RLS
CREATE OR REPLACE FUNCTION public.remove_rls_policy(_policy_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _policy RECORD;
  _policy_name TEXT;
BEGIN
  -- Buscar política
  SELECT * INTO _policy 
  FROM rbac_rls_policies 
  WHERE id = _policy_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Política não encontrada: %', _policy_id;
  END IF;
  
  -- Construir nome da política
  _policy_name := format('%s_%s_%s', _policy.tabela, _policy.operacao, _policy.id::text);
  
  -- Remover política
  BEGIN
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', _policy_name, _policy.tabela);
    
    -- Registrar aplicação
    INSERT INTO rbac_rls_policy_applications (
      policy_id, 
      tabela, 
      status, 
      aplicado_em, 
      aplicado_por
    ) VALUES (
      _policy_id, 
      _policy.tabela, 
      'applied', 
      now(), 
      auth.uid()
    );
    
    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    -- Registrar erro
    INSERT INTO rbac_rls_policy_applications (
      policy_id, 
      tabela, 
      status, 
      erro, 
      aplicado_em, 
      aplicado_por
    ) VALUES (
      _policy_id, 
      _policy.tabela, 
      'failed', 
      SQLERRM, 
      now(), 
      auth.uid()
    );
    
    RETURN false;
  END;
END;
$$;

-- Função para listar políticas aplicáveis
CREATE OR REPLACE FUNCTION public.get_applicable_rls_policies(
  _tabela text,
  _user_id uuid DEFAULT auth.uid(),
  _organizacao_id uuid DEFAULT NULL,
  _projeto_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  nome text,
  operacao text,
  condicao_using text,
  condicao_with_check text,
  prioridade integer,
  role_id uuid,
  role_nome text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome,
    p.operacao,
    p.condicao_using,
    p.condicao_with_check,
    p.prioridade,
    p.role_id,
    ar.nome as role_nome
  FROM rbac_rls_policies p
  LEFT JOIN rbac_auth_role ar ON ar.id = p.role_id
  WHERE p.tabela = _tabela 
    AND p.ativo = true
    AND (
      p.organizacao_id IS NULL OR 
      p.organizacao_id = _organizacao_id OR
      EXISTS (
        SELECT 1 FROM rbac_auth_profile ap 
        WHERE ap.user_id = _user_id 
        AND ap.organizacao_id = p.organizacao_id
      )
    )
    AND (
      p.projeto_id IS NULL OR 
      p.projeto_id = _projeto_id OR
      EXISTS (
        SELECT 1 FROM rbac_user_project_access upa 
        WHERE upa.user_id = _user_id 
        AND upa.project_id = p.projeto_id
      )
    )
    AND (
      p.role_id IS NULL OR 
      EXISTS (
        SELECT 1 FROM rbac_auth_user_role aur 
        WHERE aur.user_id = _user_id 
        AND aur.role_id = p.role_id 
        AND aur.ativo = true
      )
    )
  ORDER BY p.prioridade DESC, p.created_at;
$$;

-- Função para registrar histórico de política
CREATE OR REPLACE FUNCTION public.log_rls_policy_change(
  _policy_id uuid,
  _acao text,
  _dados_anteriores jsonb DEFAULT NULL,
  _dados_novos jsonb DEFAULT NULL,
  _motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO rbac_rls_policy_history (
    policy_id,
    acao,
    dados_anteriores,
    dados_novos,
    motivo,
    created_by
  ) VALUES (
    _policy_id,
    _acao,
    _dados_anteriores,
    _dados_novos,
    _motivo,
    auth.uid()
  );
END;
$$;

-- ==============================================
-- TRIGGERS PARA AUDITORIA
-- ==============================================

-- Trigger para registrar mudanças em políticas
CREATE OR REPLACE FUNCTION public.trigger_log_rls_policy_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_rls_policy_change(
      NEW.id,
      'created',
      NULL,
      to_jsonb(NEW),
      'Política criada'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_rls_policy_change(
      NEW.id,
      'updated',
      to_jsonb(OLD),
      to_jsonb(NEW),
      'Política atualizada'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_rls_policy_change(
      OLD.id,
      'deleted',
      to_jsonb(OLD),
      NULL,
      'Política removida'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_rls_policy_changes
  AFTER INSERT OR UPDATE OR DELETE ON rbac_rls_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_log_rls_policy_changes();

-- Trigger para updated_at
CREATE TRIGGER update_rbac_rls_policies_updated_at
  BEFORE UPDATE ON rbac_rls_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- INSERIR POLÍTICAS EXISTENTES
-- ==============================================

-- Políticas para tabelas RBAC
INSERT INTO rbac_rls_policies (nome, tabela, operacao, condicao_using, condicao_with_check, prioridade, descricao, tags) VALUES 
-- Políticas para rbac_auth_profile
('Users can view their own profile', 'rbac_auth_profile', 'SELECT', 'user_id = auth.uid() OR is_admin()', NULL, 100, 'Usuários podem ver seu próprio perfil', ARRAY['auth', 'profile']),
('Admins can manage profiles', 'rbac_auth_profile', 'ALL', 'is_admin()', 'is_admin()', 200, 'Admins podem gerenciar todos os perfis', ARRAY['auth', 'admin']),

-- Políticas para rbac_organizations
('Users can view organizations they belong to', 'rbac_organizations', 'SELECT', 'is_admin() OR EXISTS (SELECT 1 FROM rbac_auth_profile ap WHERE ap.user_id = auth.uid() AND ap.organizacao_id = rbac_organizations.id)', NULL, 100, 'Usuários veem organizações que pertencem', ARRAY['organizations', 'access']),
('Admins can manage organizations', 'rbac_organizations', 'ALL', 'is_admin()', 'is_admin()', 200, 'Admins podem gerenciar organizações', ARRAY['organizations', 'admin']),

-- Políticas para rbac_projects
('Users can view projects they have access to', 'rbac_projects', 'SELECT', 'is_admin() OR EXISTS (SELECT 1 FROM rbac_user_project_access upa WHERE upa.project_id = rbac_projects.id AND upa.user_id = auth.uid())', NULL, 100, 'Usuários veem projetos que têm acesso', ARRAY['projects', 'access']),
('Admins can manage projects', 'rbac_projects', 'ALL', 'is_admin()', 'is_admin()', 200, 'Admins podem gerenciar projetos', ARRAY['projects', 'admin']),

-- Políticas para rbac_modules
('Users can view modules they have access to', 'rbac_modules', 'SELECT', 'is_admin() OR EXISTS (SELECT 1 FROM rbac_user_module_access uma WHERE uma.module_id = rbac_modules.id AND uma.user_id = auth.uid() AND uma.ativo = true) OR rbac_modules.status = ''disponivel''', NULL, 100, 'Usuários veem módulos que têm acesso', ARRAY['modules', 'access']),
('Admins can manage modules', 'rbac_modules', 'ALL', 'is_admin()', 'is_admin()', 200, 'Admins podem gerenciar módulos', ARRAY['modules', 'admin']);

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE rbac_rls_policies IS 'Registro de políticas RLS por roles de cada projeto';
COMMENT ON COLUMN rbac_rls_policies.nome IS 'Nome descritivo da política';
COMMENT ON COLUMN rbac_rls_policies.tabela IS 'Nome da tabela que a política se aplica';
COMMENT ON COLUMN rbac_rls_policies.operacao IS 'Operação da política: SELECT, INSERT, UPDATE, DELETE, ALL';
COMMENT ON COLUMN rbac_rls_policies.condicao_using IS 'Condição USING da política RLS';
COMMENT ON COLUMN rbac_rls_policies.condicao_with_check IS 'Condição WITH CHECK da política RLS';
COMMENT ON COLUMN rbac_rls_policies.prioridade IS 'Prioridade da política (maior = mais específica)';
COMMENT ON COLUMN rbac_rls_policies.tags IS 'Tags para categorização e busca';

COMMENT ON TABLE rbac_rls_policy_history IS 'Histórico de mudanças nas políticas RLS';
COMMENT ON TABLE rbac_rls_policy_applications IS 'Registro de aplicação de políticas RLS';

COMMENT ON FUNCTION public.apply_rls_policy IS 'Aplica uma política RLS específica';
COMMENT ON FUNCTION public.remove_rls_policy IS 'Remove uma política RLS específica';
COMMENT ON FUNCTION public.get_applicable_rls_policies IS 'Lista políticas aplicáveis para uma tabela e usuário';
COMMENT ON FUNCTION public.log_rls_policy_change IS 'Registra mudanças em políticas RLS';
