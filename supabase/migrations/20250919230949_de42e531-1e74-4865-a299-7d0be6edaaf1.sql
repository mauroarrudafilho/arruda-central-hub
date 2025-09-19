-- Criar perfis para usuários existentes e atribuir papel de admin

-- 1. Criar perfis na auth_profile para todos os usuários existentes
INSERT INTO auth_profile (user_id, nome, email, status)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'nome', SPLIT_PART(u.email, '@', 1)) as nome,
    u.email,
    'ativo'
FROM auth.users u
LEFT JOIN auth_profile ap ON ap.user_id = u.id
WHERE ap.user_id IS NULL;

-- 2. Atribuir papel de admin para o usuário maurofilho@grupoarruda.com (assumindo que é o admin principal)
INSERT INTO auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    u.id,
    ar.id,
    u.id, -- self-granted for bootstrap
    true
FROM auth.users u, auth_role ar
WHERE u.email = 'maurofilho@grupoarruda.com'
AND ar.nome = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM auth_user_role aur 
    WHERE aur.user_id = u.id AND aur.role_id = ar.id
);

-- 3. Verificação: mostrar usuários com seus papéis
SELECT 
    u.email,
    ap.nome as profile_name,
    ar.nome as role_name
FROM auth.users u
LEFT JOIN auth_profile ap ON ap.user_id = u.id
LEFT JOIN auth_user_role aur ON aur.user_id = u.id AND aur.ativo = true
LEFT JOIN auth_role ar ON ar.id = aur.role_id
ORDER BY u.email;