-- ==============================================
-- SCRIPT DE TESTE - Sistema Unificado RLS-RPC
-- ==============================================
-- Data: 2025-02-06
-- Descrição: Testa todas as funções e políticas do sistema unificado RLS-RPC
-- 
-- Como usar:
-- 1. Execute este script no SQL Editor do Supabase ou via CLI
-- 2. Certifique-se de ter usuários de teste com diferentes papéis
-- 3. Verifique os resultados de cada teste

-- ==============================================
-- PARTE 1: TESTES DAS FUNÇÕES BASE
-- ==============================================

\echo '🧪 TESTE 1: Função get_user_data_unified()'
\echo '----------------------------------------'

-- Teste 1.1: Buscar por user_id (Supabase Auth)
DO $$
DECLARE
  _test_user_id UUID;
  _result RECORD;
BEGIN
  -- Obter um user_id de teste (ajuste conforme necessário)
  SELECT id INTO _test_user_id 
  FROM auth.users 
  LIMIT 1;
  
  IF _test_user_id IS NOT NULL THEN
    SELECT * INTO _result 
    FROM public.get_user_data_unified(p_user_id => _test_user_id);
    
    IF FOUND THEN
      RAISE NOTICE '✅ Teste 1.1 PASSOU: get_user_data_unified com user_id retornou dados';
      RAISE NOTICE '   Usuário: %, Papel: %, Ativo: %', 
        COALESCE(_result.nome, _result.email), 
        _result.papel, 
        _result.ativo;
    ELSE
      RAISE NOTICE '❌ Teste 1.1 FALHOU: get_user_data_unified com user_id não retornou dados';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Teste 1.1 PULADO: Nenhum usuário encontrado para teste';
  END IF;
END $$;

-- Teste 1.2: Buscar por email (SSO)
DO $$
DECLARE
  _test_email TEXT;
  _result RECORD;
BEGIN
  -- Obter um email de teste do rbac_auth_profile
  SELECT email INTO _test_email 
  FROM public.rbac_auth_profile 
  WHERE status = 'ativo'
  LIMIT 1;
  
  IF _test_email IS NOT NULL THEN
    SELECT * INTO _result 
    FROM public.get_user_data_unified(p_user_email => _test_email);
    
    IF FOUND THEN
      RAISE NOTICE '✅ Teste 1.2 PASSOU: get_user_data_unified com email retornou dados';
      RAISE NOTICE '   Usuário: %, Papel: %, Organização: %', 
        _result.nome, 
        _result.papel,
        COALESCE(_result.organizacao_id::TEXT, 'NULL');
    ELSE
      RAISE NOTICE '❌ Teste 1.2 FALHOU: get_user_data_unified com email não retornou dados';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Teste 1.2 PULADO: Nenhum email encontrado para teste';
  END IF;
END $$;

-- ==============================================
-- PARTE 2: TESTES DAS FUNÇÕES DE PERMISSÃO ACORDOS
-- ==============================================

\echo ''
\echo '🧪 TESTE 2: Funções de Permissão para Acordos'
\echo '---------------------------------------------'

-- Teste 2.1: get_acordos_where_filter() para diferentes papéis
DO $$
DECLARE
  _test_user_id UUID;
  _role TEXT;
  _filter TEXT;
  _roles TEXT[] := ARRAY['admin', 'gestor', 'vendedor', 'visualizador'];
BEGIN
  FOR _role IN SELECT unnest(_roles) LOOP
    -- Obter um usuário com esse papel
    SELECT ap.user_id INTO _test_user_id
    FROM public.rbac_auth_profile ap
    JOIN public.rbac_auth_user_role aur ON aur.user_id = ap.user_id
    JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
    WHERE ar.nome = _role
      AND ap.status = 'ativo'
      AND aur.ativo = true
    LIMIT 1;
    
    IF _test_user_id IS NOT NULL THEN
      _filter := public.get_acordos_where_filter(p_user_id => _test_user_id);
      
      IF _filter IS NOT NULL THEN
        RAISE NOTICE '✅ Teste 2.1 PASSOU: get_acordos_where_filter para papel % retornou: %', 
          _role, 
          CASE WHEN length(_filter) > 50 THEN substring(_filter, 1, 50) || '...' ELSE _filter END;
      ELSE
        RAISE NOTICE '❌ Teste 2.1 FALHOU: get_acordos_where_filter para papel % retornou NULL', _role;
      END IF;
    ELSE
      RAISE NOTICE '⚠️  Teste 2.1 PULADO: Nenhum usuário encontrado com papel %', _role;
    END IF;
  END LOOP;
END $$;

-- Teste 2.2: can_user_view_acordo() para diferentes papéis
DO $$
DECLARE
  _test_user_id UUID;
  _role TEXT;
  _can_view BOOLEAN;
  _roles TEXT[] := ARRAY['admin', 'gestor', 'vendedor'];
  _acordo_id UUID;
BEGIN
  -- Obter um acordo para teste
  SELECT id INTO _acordo_id FROM public.acordos LIMIT 1;
  
  IF _acordo_id IS NOT NULL THEN
    FOR _role IN SELECT unnest(_roles) LOOP
      SELECT ap.user_id INTO _test_user_id
      FROM public.rbac_auth_profile ap
      JOIN public.rbac_auth_user_role aur ON aur.user_id = ap.user_id
      JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
      WHERE ar.nome = _role
        AND ap.status = 'ativo'
        AND aur.ativo = true
      LIMIT 1;
      
      IF _test_user_id IS NOT NULL THEN
        SELECT public.can_user_view_acordo(
          p_user_id => _test_user_id,
          p_acordo_id => _acordo_id
        ) INTO _can_view;
        
        RAISE NOTICE '✅ Teste 2.2: can_user_view_acordo para papel % retornou: %', 
          _role, 
          _can_view;
      END IF;
    END LOOP;
  ELSE
    RAISE NOTICE '⚠️  Teste 2.2 PULADO: Nenhum acordo encontrado para teste';
  END IF;
END $$;

-- Teste 2.3: can_user_create_acordo() para diferentes papéis
DO $$
DECLARE
  _test_user_id UUID;
  _role TEXT;
  _can_create BOOLEAN;
  _roles TEXT[] := ARRAY['admin', 'gestor_fornecedor', 'vendedor', 'visualizador'];
BEGIN
  FOR _role IN SELECT unnest(_roles) LOOP
    SELECT ap.user_id INTO _test_user_id
    FROM public.rbac_auth_profile ap
    JOIN public.rbac_auth_user_role aur ON aur.user_id = ap.user_id
    JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
    WHERE ar.nome = _role
      AND ap.status = 'ativo'
      AND aur.ativo = true
    LIMIT 1;
    
    IF _test_user_id IS NOT NULL THEN
      SELECT public.can_user_create_acordo(p_user_id => _test_user_id) INTO _can_create;
      
      RAISE NOTICE '✅ Teste 2.3: can_user_create_acordo para papel % retornou: %', 
        _role, 
        _can_create;
    END IF;
  END LOOP;
END $$;

-- ==============================================
-- PARTE 3: TESTES DAS RLS POLICIES
-- ==============================================

\echo ''
\echo '🧪 TESTE 3: RLS Policies Migradas'
\echo '----------------------------------'

-- Teste 3.1: Verificar se as policies foram criadas
DO $$
DECLARE
  _policy_count INT;
  _expected_policies TEXT[] := ARRAY[
    'acordos_select_unified',
    'acordos_insert_unified',
    'acordos_update_unified',
    'acordos_delete_unified'
  ];
  _policy TEXT;
  _found BOOLEAN;
BEGIN
  FOR _policy IN SELECT unnest(_expected_policies) LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'acordos'
        AND policyname = _policy
    ) INTO _found;
    
    IF _found THEN
      RAISE NOTICE '✅ Teste 3.1: Policy % existe', _policy;
    ELSE
      RAISE NOTICE '❌ Teste 3.1: Policy % NÃO existe', _policy;
    END IF;
  END LOOP;
END $$;

-- Teste 3.2: Verificar se policies antigas foram removidas
DO $$
DECLARE
  _old_policies TEXT[] := ARRAY[
    'Acordos access by role',
    'Acordos create by role',
    'Acordos update by role',
    'Acordos delete by role'
  ];
  _policy TEXT;
  _found BOOLEAN;
BEGIN
  FOR _policy IN SELECT unnest(_old_policies) LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'acordos'
        AND policyname = _policy
    ) INTO _found;
    
    IF NOT _found THEN
      RAISE NOTICE '✅ Teste 3.2: Policy antiga % foi removida corretamente', _policy;
    ELSE
      RAISE NOTICE '⚠️  Teste 3.2: Policy antiga % ainda existe (deve ser removida)', _policy;
    END IF;
  END LOOP;
END $$;

-- ==============================================
-- PARTE 4: TESTES DA FUNÇÃO RPC SSO
-- ==============================================

\echo ''
\echo '🧪 TESTE 4: Função RPC SSO get_acordos_sso()'
\echo '---------------------------------------------'

-- Teste 4.1: Verificar se a função existe
DO $$
DECLARE
  _function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_acordos_sso'
      AND pronamespace = 'public'::regnamespace
  ) INTO _function_exists;
  
  IF _function_exists THEN
    RAISE NOTICE '✅ Teste 4.1: Função get_acordos_sso() existe';
  ELSE
    RAISE NOTICE '❌ Teste 4.1: Função get_acordos_sso() NÃO existe';
  END IF;
END $$;

-- Teste 4.2: Testar chamada da função com email
DO $$
DECLARE
  _test_email TEXT;
  _result_count INT;
BEGIN
  SELECT email INTO _test_email 
  FROM public.rbac_auth_profile 
  WHERE status = 'ativo'
  LIMIT 1;
  
  IF _test_email IS NOT NULL THEN
    SELECT COUNT(*) INTO _result_count
    FROM public.get_acordos_sso(p_user_email => _test_email);
    
    RAISE NOTICE '✅ Teste 4.2: get_acordos_sso() com email % retornou % acordos', 
      _test_email, 
      _result_count;
  ELSE
    RAISE NOTICE '⚠️  Teste 4.2 PULADO: Nenhum email encontrado para teste';
  END IF;
END $$;

-- ==============================================
-- PARTE 5: TESTES DE CONSISTÊNCIA RLS ↔ RPC
-- ==============================================

\echo ''
\echo '🧪 TESTE 5: Consistência entre RLS e RPC'
\echo '----------------------------------------'

-- Teste 5.1: Verificar se mapeamentos foram registrados
DO $$
DECLARE
  _mapping_count INT;
BEGIN
  SELECT COUNT(*) INTO _mapping_count
  FROM public.rls_rpc_mapping
  WHERE table_name = 'acordos';
  
  IF _mapping_count > 0 THEN
    RAISE NOTICE '✅ Teste 5.1: % mapeamentos RLS-RPC registrados para tabela acordos', _mapping_count;
  ELSE
    RAISE NOTICE '❌ Teste 5.1: Nenhum mapeamento RLS-RPC encontrado';
  END IF;
END $$;

-- Teste 5.2: Validar mapeamentos
DO $$
DECLARE
  _mapping RECORD;
  _validation RECORD;
BEGIN
  FOR _mapping IN 
    SELECT id FROM public.rls_rpc_mapping 
    WHERE table_name = 'acordos'
  LOOP
    SELECT * INTO _validation
    FROM public.validate_rls_rpc_mapping(_mapping.id);
    
    IF _validation.is_valid THEN
      RAISE NOTICE '✅ Teste 5.2: Mapeamento % está válido: %', 
        _mapping.id, 
        _validation.validation_message;
    ELSE
      RAISE NOTICE '⚠️  Teste 5.2: Mapeamento % tem problemas: %', 
        _mapping.id, 
        _validation.validation_message;
    END IF;
  END LOOP;
END $$;

-- ==============================================
-- PARTE 6: RESUMO FINAL
-- ==============================================

\echo ''
\echo '📊 RESUMO DOS TESTES'
\echo '===================='

DO $$
DECLARE
  _base_functions INT;
  _acordos_functions INT;
  _policies INT;
  _rpc_functions INT;
  _mappings INT;
BEGIN
  -- Contar funções base
  SELECT COUNT(*) INTO _base_functions
  FROM pg_proc
  WHERE proname IN ('get_user_data_unified', 'can_user_view_table')
    AND pronamespace = 'public'::regnamespace;
  
  -- Contar funções de acordos
  SELECT COUNT(*) INTO _acordos_functions
  FROM pg_proc
  WHERE proname IN (
    'get_acordos_where_filter',
    'can_user_view_acordo',
    'can_user_edit_acordo',
    'can_user_create_acordo',
    'can_user_delete_acordo'
  )
    AND pronamespace = 'public'::regnamespace;
  
  -- Contar policies
  SELECT COUNT(*) INTO _policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'acordos'
    AND policyname LIKE '%_unified';
  
  -- Contar funções RPC
  SELECT COUNT(*) INTO _rpc_functions
  FROM pg_proc
  WHERE proname IN ('get_acordos_sso', 'get_acordo_sso')
    AND pronamespace = 'public'::regnamespace;
  
  -- Contar mapeamentos
  SELECT COUNT(*) INTO _mappings
  FROM public.rls_rpc_mapping
  WHERE table_name = 'acordos';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Funções Base: %/2', _base_functions;
  RAISE NOTICE '✅ Funções Acordos: %/5', _acordos_functions;
  RAISE NOTICE '✅ RLS Policies: %/4', _policies;
  RAISE NOTICE '✅ Funções RPC SSO: %/2', _rpc_functions;
  RAISE NOTICE '✅ Mapeamentos RLS-RPC: %', _mappings;
  RAISE NOTICE '';
  
  IF _base_functions = 2 AND _acordos_functions = 5 AND _policies = 4 AND _rpc_functions = 2 AND _mappings > 0 THEN
    RAISE NOTICE '🎉 SISTEMA UNIFICADO RLS-RPC INSTALADO E FUNCIONANDO!';
  ELSE
    RAISE NOTICE '⚠️  Alguns componentes podem estar faltando. Verifique os números acima.';
  END IF;
END $$;

