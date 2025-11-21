-- Migration: Update Meus Produtos slug to arruda-catalog-maker
-- Data: 2025-02-04
-- Descrição: Atualiza o slug do projeto Meus Produtos de 'meus-produtos' para 'arruda-catalog-maker'
--             para corresponder ao identificador usado pelo backend, mantendo o nome "Meus Produtos"

-- ==============================================
-- ATUALIZAR SLUG DO PROJETO
-- ==============================================

-- Atualizar slug do projeto Meus Produtos
UPDATE public.rbac_projects
SET 
  slug = 'arruda-catalog-maker',
  updated_at = now()
WHERE slug = 'meus-produtos';

-- ==============================================
-- ATUALIZAR SESSÕES EXISTENTES
-- ==============================================

-- Atualizar frontend_module nas sessões existentes para manter consistência
UPDATE public.user_sessions
SET 
  frontend_module = 'arruda-catalog-maker',
  updated_at = now()
WHERE frontend_module = 'meus-produtos';

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON COLUMN public.rbac_projects.slug IS 'Slug único do projeto usado para identificação no sistema. Deve corresponder ao identificador usado pelo backend do módulo.';

