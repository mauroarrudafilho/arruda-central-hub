-- Migration: Update Acordos Comerciais URL
-- Data: 2025-02-02
-- Descrição: Atualiza a URL do projeto Acordos Comerciais para apontar para a raiz (conforme documentação SSO)

-- Atualizar URL do projeto Acordos Comerciais
UPDATE public.rbac_projects
SET 
  url_vercel = 'https://acordo-flow.vercel.app',
  updated_at = now()
WHERE slug = 'acordos';

-- Atualizar frontend_modules se existir
UPDATE public.frontend_modules
SET 
  frontend_url = 'https://acordo-flow.vercel.app',
  updated_at = now()
WHERE module_name = 'acordos';

