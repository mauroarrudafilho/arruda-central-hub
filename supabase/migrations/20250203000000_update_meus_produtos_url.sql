-- Migration: Update Meus Produtos URL
-- Data: 2025-02-03
-- Descrição: Atualiza a URL do projeto Meus Produtos para remover barra final e garantir formato correto para SSO

-- Atualizar URL do projeto Meus Produtos
UPDATE public.rbac_projects
SET 
  url_vercel = 'https://arruda-catalog-maker.vercel.app',
  updated_at = now()
WHERE slug = 'meus-produtos';


