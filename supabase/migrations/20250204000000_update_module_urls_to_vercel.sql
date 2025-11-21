-- Migration: Update Module URLs to Vercel
-- Data: 2025-02-04
-- Descrição: Atualiza as URLs dos módulos Trade Marketing e NF-e Radar para as URLs corretas do Vercel

-- Atualizar URL do Trade Marketing (degustacao) na tabela frontend_modules
UPDATE public.frontend_modules
SET 
  frontend_url = 'https://degusta-go.vercel.app',
  updated_at = now()
WHERE module_name = 'degustacao' OR module_name = 'degusta-go-app';

-- Atualizar URL do NF-e Radar (nfe-radar) na tabela frontend_modules
UPDATE public.frontend_modules
SET 
  frontend_url = 'https://nfe-radar.vercel.app/auth',
  updated_at = now()
WHERE module_name = 'nfe-radar' OR module_name = 'meus-documentos';

-- Atualizar URL do Trade Marketing na tabela rbac_projects
UPDATE public.rbac_projects
SET 
  url_vercel = 'https://degusta-go.vercel.app/',
  updated_at = now()
WHERE slug = 'trade-marketing' OR slug = 'degusta-go-app';

-- Atualizar URL do NF-e Radar na tabela rbac_projects
UPDATE public.rbac_projects
SET 
  url_vercel = 'https://nfe-radar.vercel.app/auth',
  updated_at = now()
WHERE slug = 'nfe-radar' OR slug = 'meus-documentos';

