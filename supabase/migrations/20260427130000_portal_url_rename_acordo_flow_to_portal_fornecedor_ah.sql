-- Item 8 (continuação) — projeto Vercel renomeado pra portal-fornecedor-ah.vercel.app
-- (sufixo "-ah" = Arruda Hub, convenção pra evitar colisão com portal-fornecedor.vercel.app
-- já tomado por outro time/projeto).
-- Atualiza URLs em frontend_modules e rbac_projects pra que os cards do central-hub
-- e o roteamento SSO apontem pro novo deploy.

UPDATE public.frontend_modules
SET frontend_url = 'https://portal-fornecedor-ah.vercel.app'
WHERE frontend_url = 'https://acordo-flow.vercel.app';

UPDATE public.rbac_projects
SET url_vercel = 'https://portal-fornecedor-ah.vercel.app'
WHERE url_vercel = 'https://acordo-flow.vercel.app';
