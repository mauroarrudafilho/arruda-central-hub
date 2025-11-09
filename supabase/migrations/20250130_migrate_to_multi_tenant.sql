-- Migration: Migrate to Multi-Tenant Architecture
-- Data: 2025-01-30
-- Descrição: Migra dados existentes para arquitetura multi-tenant

-- ==============================================
-- BACKUP DE DADOS EXISTENTES
-- ==============================================

-- Criar tabelas de backup antes da migração
CREATE TABLE IF NOT EXISTS public.backup_acordos AS SELECT * FROM public.acordos;
CREATE TABLE IF NOT EXISTS public.backup_degustacao AS SELECT * FROM public.degustacao;
CREATE TABLE IF NOT EXISTS public.backup_trade_marketing AS SELECT * FROM public.trade_marketing;

-- ==============================================
-- ADICIONAR CAMPOS TENANT_ID
-- ==============================================

-- Adicionar tenant_id em tabelas de dados (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'acordos' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.acordos ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'degustacao' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.degustacao ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trade_marketing' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.trade_marketing ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- ==============================================
-- MIGRAR DADOS EXISTENTES
-- ==============================================

-- Migrar dados de acordos para o tenant padrão (Grupo Arruda)
UPDATE public.acordos 
SET tenant_id = (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda')
WHERE tenant_id IS NULL;

-- Migrar dados de degustação para o tenant padrão
UPDATE public.degustacao 
SET tenant_id = (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda')
WHERE tenant_id IS NULL;

-- Migrar dados de trade marketing para o tenant padrão
UPDATE public.trade_marketing 
SET tenant_id = (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda')
WHERE tenant_id IS NULL;

-- Migrar projetos existentes
UPDATE public.projects 
SET tenant_id = (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda')
WHERE tenant_id IS NULL;

-- Migrar módulos de projetos
UPDATE public.project_modules 
SET tenant_id = (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda')
WHERE tenant_id IS NULL;

-- ==============================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_acordos_tenant_id ON public.acordos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_degustacao_tenant_id ON public.degustacao(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trade_marketing_tenant_id ON public.trade_marketing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_tenant_id ON public.project_modules(tenant_id);

-- ==============================================
-- ATUALIZAR POLÍTICAS RLS
-- ==============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view acordos they have access to" ON public.acordos;
DROP POLICY IF EXISTS "Users can create acordos if they have permission" ON public.acordos;
DROP POLICY IF EXISTS "Users can update acordos they have access to" ON public.acordos;
DROP POLICY IF EXISTS "Users can delete acordos they have access to" ON public.acordos;

-- Criar novas políticas com isolamento por tenant
CREATE POLICY "Users can only access their tenant's acordos" 
ON public.acordos 
FOR ALL 
USING (
  public.is_admin() OR 
  public.user_belongs_to_tenant(auth.uid(), tenant_id)
)
WITH CHECK (
  public.is_admin() OR 
  public.user_belongs_to_tenant(auth.uid(), tenant_id)
);

-- Aplicar políticas similares para outras tabelas
CREATE POLICY "Users can only access their tenant's degustacao" 
ON public.degustacao 
FOR ALL 
USING (
  public.is_admin() OR 
  public.user_belongs_to_tenant(auth.uid(), tenant_id)
)
WITH CHECK (
  public.is_admin() OR 
  public.user_belongs_to_tenant(auth.uid(), tenant_id)
);

CREATE POLICY "Users can only access their tenant's trade_marketing" 
ON public.trade_marketing 
FOR ALL 
USING (
  public.is_admin() OR 
  public.user_belongs_to_tenant(auth.uid(), tenant_id)
)
WITH CHECK (
  public.is_admin() OR 
  public.user_belongs_to_tenant(auth.uid(), tenant_id)
);

-- ==============================================
-- FUNÇÕES DE MIGRAÇÃO
-- ==============================================

-- Função para migrar dados de um tenant para outro
CREATE OR REPLACE FUNCTION public.migrate_tenant_data(
  _source_tenant_id uuid,
  _target_tenant_id uuid,
  _table_name text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated_count integer;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem migrar dados entre tenants';
  END IF;

  -- Executar migração dinâmica
  EXECUTE format('
    UPDATE public.%I 
    SET tenant_id = $1 
    WHERE tenant_id = $2
  ', _table_name) USING _target_tenant_id, _source_tenant_id;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;
  
  RETURN _updated_count;
END;
$$;

-- Função para verificar integridade dos dados após migração
CREATE OR REPLACE FUNCTION public.verify_tenant_data_integrity()
RETURNS TABLE(
  table_name text,
  total_records bigint,
  records_with_tenant bigint,
  records_without_tenant bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'acordos'::text,
    COUNT(*) as total_records,
    COUNT(tenant_id) as records_with_tenant,
    COUNT(*) - COUNT(tenant_id) as records_without_tenant
  FROM public.acordos
  
  UNION ALL
  
  SELECT 
    'degustacao'::text,
    COUNT(*) as total_records,
    COUNT(tenant_id) as records_with_tenant,
    COUNT(*) - COUNT(tenant_id) as records_without_tenant
  FROM public.degustacao
  
  UNION ALL
  
  SELECT 
    'trade_marketing'::text,
    COUNT(*) as total_records,
    COUNT(tenant_id) as records_with_tenant,
    COUNT(*) - COUNT(tenant_id) as records_without_tenant
  FROM public.trade_marketing;
END;
$$;

-- ==============================================
-- TRIGGERS PARA GARANTIR TENANT_ID
-- ==============================================

-- Função para garantir que tenant_id seja sempre preenchido
CREATE OR REPLACE FUNCTION public.ensure_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se tenant_id não foi fornecido, usar o tenant do usuário atual
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant();
  END IF;
  
  -- Se ainda for NULL, usar o tenant padrão
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := (SELECT id FROM public.organizations WHERE slug = 'grupo-arruda' LIMIT 1);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger nas tabelas de dados
CREATE TRIGGER ensure_acordos_tenant_id
  BEFORE INSERT ON public.acordos
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_tenant_id();

CREATE TRIGGER ensure_degustacao_tenant_id
  BEFORE INSERT ON public.degustacao
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_tenant_id();

CREATE TRIGGER ensure_trade_marketing_tenant_id
  BEFORE INSERT ON public.trade_marketing
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_tenant_id();

-- ==============================================
-- VALIDAÇÃO FINAL
-- ==============================================

-- Verificar se todos os dados foram migrados corretamente
DO $$
DECLARE
  _missing_tenant_count integer;
BEGIN
  -- Verificar acordos sem tenant_id
  SELECT COUNT(*) INTO _missing_tenant_count
  FROM public.acordos 
  WHERE tenant_id IS NULL;
  
  IF _missing_tenant_count > 0 THEN
    RAISE WARNING 'Existem % registros de acordos sem tenant_id', _missing_tenant_count;
  END IF;
  
  -- Verificar degustação sem tenant_id
  SELECT COUNT(*) INTO _missing_tenant_count
  FROM public.degustacao 
  WHERE tenant_id IS NULL;
  
  IF _missing_tenant_count > 0 THEN
    RAISE WARNING 'Existem % registros de degustação sem tenant_id', _missing_tenant_count;
  END IF;
  
  -- Verificar trade marketing sem tenant_id
  SELECT COUNT(*) INTO _missing_tenant_count
  FROM public.trade_marketing 
  WHERE tenant_id IS NULL;
  
  IF _missing_tenant_count > 0 THEN
    RAISE WARNING 'Existem % registros de trade marketing sem tenant_id', _missing_tenant_count;
  END IF;
  
  RAISE NOTICE 'Migração para multi-tenant concluída com sucesso!';
END;
$$;









