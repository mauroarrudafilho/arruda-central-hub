-- Migration: Update Comercial+ URL
-- Data: 2025-02-02
-- Descrição: Atualiza a URL do projeto Comercial+ para apontar para a raiz (conforme padrão SSO)

-- Atualizar URL do projeto Comercial+
UPDATE public.rbac_projects
SET 
  url_vercel = 'https://arruda-sales-boost.vercel.app',
  updated_at = now()
WHERE slug = 'comercial-plus';

