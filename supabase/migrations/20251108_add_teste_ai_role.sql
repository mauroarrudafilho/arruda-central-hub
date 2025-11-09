-- Migration: Add Teste AI role for automated testing
-- Date: 2025-11-08
-- Description: Cria o papel "teste_ai" com permissões equivalentes ao admin, porém sem permitir exclusões.

-- ==============================================
-- CRIAR PAPEL TESTE_AI
-- ==============================================

INSERT INTO public.rbac_auth_role (nome, descricao, cor, sistema, organizacao_id, ativo)
SELECT
  'teste_ai',
  'Automação / Playwright - Mesmas permissões do admin, exceto exclusão',
  '#0ea5e9',
  true,
  organizacao_id,
  true
FROM public.rbac_auth_role
WHERE nome = 'admin'
ON CONFLICT (nome) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  cor = EXCLUDED.cor,
  sistema = EXCLUDED.sistema,
  organizacao_id = EXCLUDED.organizacao_id,
  ativo = EXCLUDED.ativo,
  updated_at = now();

-- ==============================================
-- CLONAR PERMISSÕES DAS TELAS
-- ==============================================

WITH admin_role AS (
  SELECT id
  FROM public.rbac_auth_role
  WHERE nome = 'admin'
),
teste_ai_role AS (
  SELECT id
  FROM public.rbac_auth_role
  WHERE nome = 'teste_ai'
)
INSERT INTO public.rbac_screen_permissions (
  role_id,
  screen_name,
  module_name,
  can_view,
  can_create,
  can_edit,
  can_delete,
  can_approve
)
SELECT
  (SELECT id FROM teste_ai_role) AS role_id,
  rsp.screen_name,
  rsp.module_name,
  rsp.can_view,
  rsp.can_create,
  rsp.can_edit,
  false AS can_delete,
  rsp.can_approve
FROM public.rbac_screen_permissions rsp
WHERE rsp.role_id = (SELECT id FROM admin_role)
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve,
  updated_at = now();

-- ==============================================
-- GARANTIR QUE PERMISSÕES DE DELEÇÃO NÃO EXISTEM
-- ==============================================

DELETE FROM public.rbac_screen_permissions
WHERE role_id = (SELECT id FROM public.rbac_auth_role WHERE nome = 'teste_ai')
  AND can_delete = true;

