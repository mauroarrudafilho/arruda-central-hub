-- ==============================================
-- TESTE RÁPIDO - Sistema Unificado RLS-RPC
-- ==============================================
-- Execute este script para validação rápida
-- Data: 2025-02-06

-- Verificar funções base
SELECT 
    'Funções Base' as categoria,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ OK'
        ELSE '❌ FALTOU'
    END as status
FROM pg_proc
WHERE proname IN ('get_user_data_unified', 'can_user_view_table')
    AND pronamespace = 'public'::regnamespace;

-- Verificar funções de acordos
SELECT 
    'Funções Acordos' as categoria,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ OK'
        ELSE '❌ FALTOU'
    END as status
FROM pg_proc
WHERE proname IN (
    'get_acordos_where_filter',
    'can_user_view_acordo',
    'can_user_edit_acordo',
    'can_user_create_acordo',
    'can_user_delete_acordo'
)
    AND pronamespace = 'public'::regnamespace;

-- Verificar RLS policies
SELECT 
    'RLS Policies' as categoria,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ OK'
        ELSE '❌ FALTOU'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'acordos'
    AND policyname LIKE '%_unified';

-- Verificar funções RPC SSO
SELECT 
    'Funções RPC SSO' as categoria,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ OK'
        ELSE '❌ FALTOU'
    END as status
FROM pg_proc
WHERE proname IN ('get_acordos_sso', 'get_acordo_sso')
    AND pronamespace = 'public'::regnamespace;

-- Verificar mapeamentos
SELECT 
    'Mapeamentos RLS-RPC' as categoria,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK'
        ELSE '❌ FALTOU'
    END as status
FROM public.rls_rpc_mapping
WHERE table_name = 'acordos';

-- Resumo geral
SELECT 
    'RESUMO' as categoria,
    (
        (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_user_data_unified', 'can_user_view_table') AND pronamespace = 'public'::regnamespace) +
        (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_acordos_where_filter', 'can_user_view_acordo', 'can_user_edit_acordo', 'can_user_create_acordo', 'can_user_delete_acordo') AND pronamespace = 'public'::regnamespace) +
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'acordos' AND policyname LIKE '%_unified') +
        (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_acordos_sso', 'get_acordo_sso') AND pronamespace = 'public'::regnamespace)
    ) as total_componentes,
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_user_data_unified', 'can_user_view_table') AND pronamespace = 'public'::regnamespace) = 2 AND
            (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_acordos_where_filter', 'can_user_view_acordo', 'can_user_edit_acordo', 'can_user_create_acordo', 'can_user_delete_acordo') AND pronamespace = 'public'::regnamespace) = 5 AND
            (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'acordos' AND policyname LIKE '%_unified') = 4 AND
            (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_acordos_sso', 'get_acordo_sso') AND pronamespace = 'public'::regnamespace) = 2
        ) THEN '✅ SISTEMA COMPLETO'
        ELSE '⚠️  VERIFICAR COMPONENTES FALTANTES'
    END as status;

