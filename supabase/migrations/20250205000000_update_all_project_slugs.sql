-- Migration: Update All Project Slugs to Match Vercel Project Names
-- Data: 2025-02-05
-- Descrição: Atualiza todos os slugs dos projetos para corresponder aos nomes dos projetos no Vercel

-- ==============================================
-- ATUALIZAR SLUGS DOS PROJETOS
-- ==============================================

-- 1. Acordos Comerciais: acordos → acordo-flow
UPDATE public.rbac_projects
SET 
  slug = 'acordo-flow',
  updated_at = now()
WHERE slug = 'acordos';

-- 2. Comercial+: comercial-plus → arruda-sales-boost
UPDATE public.rbac_projects
SET 
  slug = 'arruda-sales-boost',
  updated_at = now()
WHERE slug = 'comercial-plus';

-- 3. Financeiro: financeiro → arruda-flow-buddy
UPDATE public.rbac_projects
SET 
  slug = 'arruda-flow-buddy',
  updated_at = now()
WHERE slug = 'financeiro';

-- 4. Gestão de Usuários: gestao-usuarios → arruda-rbac-master
UPDATE public.rbac_projects
SET 
  slug = 'arruda-rbac-master',
  updated_at = now()
WHERE slug = 'gestao-usuarios';

-- 5. Meus Documentos: meus-documentos → nfe-radar
UPDATE public.rbac_projects
SET 
  slug = 'nfe-radar',
  updated_at = now()
WHERE slug = 'meus-documentos';

-- 6. Meus Produtos: arruda-catalog-maker (já está correto, não precisa atualizar)

-- 7. Sistema de Gestão: gestao → remover ou manter (usuário informou que não existe)
-- Mantendo o registro mas marcando como inativo se necessário
-- UPDATE public.rbac_projects
-- SET 
--   status = 'inativo',
--   updated_at = now()
-- WHERE slug = 'gestao';

-- 8. Trade Marketing: trade-marketing → degusta-go-app
UPDATE public.rbac_projects
SET 
  slug = 'degusta-go-app',
  updated_at = now()
WHERE slug = 'trade-marketing';

-- ==============================================
-- VERIFICAÇÃO E COMENTÁRIOS
-- ==============================================

-- Verificar se todas as atualizações foram aplicadas
DO $$
DECLARE
  _count INTEGER;
BEGIN
  -- Verificar se todos os slugs esperados existem
  SELECT COUNT(*) INTO _count
  FROM public.rbac_projects
  WHERE slug IN (
    'acordo-flow',
    'arruda-sales-boost',
    'arruda-flow-buddy',
    'arruda-rbac-master',
    'nfe-radar',
    'arruda-catalog-maker',
    'degusta-go-app'
  );
  
  IF _count < 7 THEN
    RAISE WARNING 'Nem todos os slugs foram atualizados. Verifique a migração.';
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public.rbac_projects.slug IS 'Slug único do projeto usado para identificação no sistema. Deve corresponder ao nome do projeto no Vercel para integração SSO.';

