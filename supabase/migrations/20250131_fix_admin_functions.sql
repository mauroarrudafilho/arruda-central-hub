-- Corrigir função is_admin() para aceitar parâmetro corretamente
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM rbac_auth_user_role aur
    JOIN rbac_auth_role ar ON ar.id = aur.role_id
    WHERE aur.user_id = _user_id
      AND ar.nome IN ('admin', 'teste_ai')
      AND aur.ativo = true 
      AND ar.ativo = true
  );
$$;

-- Atualizar user_is_admin para usar a mesma lógica e aceitar parâmetro corretamente
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(user_is_admin.user_id);
$$;

-- Garantir que get_user_role também reconhece teste_ai
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ar.nome 
     FROM rbac_auth_user_role aur
     JOIN rbac_auth_role ar ON ar.id = aur.role_id
     WHERE aur.user_id = _user_id 
       AND aur.ativo = true 
       AND ar.ativo = true
     ORDER BY 
       CASE ar.nome 
         WHEN 'admin' THEN 1
         WHEN 'teste_ai' THEN 2
         WHEN 'gestor' THEN 3
         WHEN 'gestor_fornecedor' THEN 4
         WHEN 'usuario' THEN 5
         WHEN 'usuario_fornecedor' THEN 6
         WHEN 'teste' THEN 7
         WHEN 'teste_fornecedor' THEN 8
         WHEN 'visualizador' THEN 9
         WHEN 'visualizador_fornecedor' THEN 10
         ELSE 11
       END
     LIMIT 1),
    'visualizador'
  );
$$;

-- Atualizar get_user_role_v2 também
CREATE OR REPLACE FUNCTION public.get_user_role_v2(_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ar.nome 
     FROM rbac_auth_user_role aur
     JOIN rbac_auth_role ar ON ar.id = aur.role_id
     WHERE aur.user_id = _user_id 
       AND aur.ativo = true 
       AND ar.ativo = true
     ORDER BY 
       CASE ar.nome 
         WHEN 'admin' THEN 1
         WHEN 'teste_ai' THEN 2
         WHEN 'gestor' THEN 3
         WHEN 'gestor_fornecedor' THEN 4
         WHEN 'usuario' THEN 5
         WHEN 'usuario_fornecedor' THEN 6
         WHEN 'teste' THEN 7
         WHEN 'teste_fornecedor' THEN 8
         WHEN 'visualizador' THEN 9
         WHEN 'visualizador_fornecedor' THEN 10
         ELSE 11
       END
     LIMIT 1),
    'visualizador'
  );
$$;

-- Atualizar is_admin_v2 também
CREATE OR REPLACE FUNCTION public.is_admin_v2(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_v2(_user_id) IN ('admin', 'teste_ai');
$$;

