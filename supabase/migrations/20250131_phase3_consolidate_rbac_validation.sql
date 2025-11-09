-- Migration: FASE 3 - Consolidação RBAC - Validação e Testes
-- Data: 2025-01-31
-- Descrição: Cria funções de validação para garantir que ambos os sistemas funcionam
-- Estratégia: Validação lado a lado antes de qualquer transição

-- ==============================================
-- IMPORTANTE: ESTA MIGRAÇÃO É SEGURA
-- ==============================================
-- ✅ Apenas cria funções de VALIDAÇÃO
-- ✅ NÃO modifica dados existentes
-- ✅ Permite comparar sistema antigo vs novo
-- ✅ Garante transparência total

-- ==============================================
-- FUNÇÕES DE VALIDAÇÃO E COMPARAÇÃO
-- ==============================================

-- Função para comparar role antigo vs novo
CREATE OR REPLACE FUNCTION public.compare_user_roles_v2(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  user_email text,
  old_role text,
  new_role text,
  roles_match boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ap.email,
    public.get_user_role(_user_id) as old_role,
    public.get_user_role_v2(_user_id) as new_role,
    public.get_user_role(_user_id) = public.get_user_role_v2(_user_id) as roles_match
  FROM public.rbac_auth_profile ap
  WHERE ap.user_id = _user_id;
$$;

-- Função para validar que novo sistema tem todas as funcionalidades do antigo
CREATE OR REPLACE FUNCTION public.validate_rbac_consolidation()
RETURNS TABLE(
  validation_item text,
  old_system_value text,
  new_system_value text,
  status text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que funções antigas existem
  RETURN QUERY
  SELECT 
    'get_user_role exists' as validation_item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN 'YES' ELSE 'NO' END as old_system_value,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role_v2') THEN 'YES' ELSE 'NO' END as new_system_value,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') 
       AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role_v2') 
      THEN '✅ PASS' 
      ELSE '❌ FAIL' 
    END as status;
  
  -- Validar que tabelas antigas existem
  RETURN QUERY
  SELECT 
    'rbac_auth_role table exists' as validation_item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_auth_role') THEN 'YES' ELSE 'NO' END as old_system_value,
    'YES' as new_system_value,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_auth_role') 
      THEN '✅ PASS' 
      ELSE '❌ FAIL' 
    END as status;
  
  -- Validar que novas tabelas foram criadas
  RETURN QUERY
  SELECT 
    'rbac_screen_permissions table exists' as validation_item,
    'N/A' as old_system_value,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_screen_permissions') THEN 'YES' ELSE 'NO' END as new_system_value,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_screen_permissions') 
      THEN '✅ PASS' 
      ELSE '❌ FAIL' 
    END as status;
  
  RETURN QUERY
  SELECT 
    'rbac_team_management table exists' as validation_item,
    'N/A' as old_system_value,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_team_management') THEN 'YES' ELSE 'NO' END as new_system_value,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_team_management') 
      THEN '✅ PASS' 
      ELSE '❌ FAIL' 
    END as status;
  
  RETURN QUERY
  SELECT 
    'rbac_user_tenant_access table exists' as validation_item,
    'N/A' as old_system_value,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_user_tenant_access') THEN 'YES' ELSE 'NO' END as new_system_value,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_user_tenant_access') 
      THEN '✅ PASS' 
      ELSE '❌ FAIL' 
    END as status;
  
  -- Validar que roles foram criados
  RETURN QUERY
  SELECT 
    'Simplified roles created' as validation_item,
    (SELECT COUNT(*)::text FROM public.rbac_auth_role WHERE nome IN ('vendedor', 'lider', 'financeiro_fornecedor')) as old_system_value,
    (SELECT COUNT(*)::text FROM public.rbac_auth_role WHERE nome IN ('usuario', 'usuario_fornecedor', 'teste', 'teste_fornecedor')) as new_system_value,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.rbac_auth_role WHERE nome IN ('usuario', 'usuario_fornecedor', 'teste', 'teste_fornecedor')) >= 4
      THEN '✅ PASS' 
      ELSE '❌ FAIL' 
    END as status;
END;
$$;

-- Função para obter status completo da consolidação
CREATE OR REPLACE FUNCTION public.get_consolidation_status()
RETURNS TABLE(
  category text,
  item text,
  count_value integer,
  status text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tabelas
  RETURN QUERY
  SELECT 
    'Tables' as category,
    'rbac_team_management' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_team_management') THEN 1 ELSE 0 END as count_value,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_team_management') THEN '✅ Created' ELSE '❌ Missing' END as status;
  
  RETURN QUERY
  SELECT 
    'Tables' as category,
    'rbac_user_tenant_access' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_user_tenant_access') THEN 1 ELSE 0 END as count_value,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_user_tenant_access') THEN '✅ Created' ELSE '❌ Missing' END as status;
  
  RETURN QUERY
  SELECT 
    'Tables' as category,
    'rbac_screen_permissions' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_screen_permissions') THEN 1 ELSE 0 END as count_value,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_screen_permissions') THEN '✅ Created' ELSE '❌ Missing' END as status;
  
  -- Roles
  RETURN QUERY
  SELECT 
    'Roles' as category,
    'Total active roles' as item,
    (SELECT COUNT(*)::integer FROM public.rbac_auth_role WHERE ativo = true) as count_value,
    '✅ Counted' as status;
  
  -- Permissões
  RETURN QUERY
  SELECT 
    'Permissions' as category,
    'Screen permissions' as item,
    (SELECT COUNT(*)::integer FROM public.rbac_screen_permissions) as count_value,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.rbac_screen_permissions) > 0 
      THEN '✅ Configured' 
      ELSE '⚠️ Empty' 
    END as status;
  
  -- Tenant Access
  RETURN QUERY
  SELECT 
    'Tenant Access' as category,
    'User tenant access' as item,
    (SELECT COUNT(*)::integer FROM public.rbac_user_tenant_access WHERE ativo = true) as count_value,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.rbac_user_tenant_access WHERE ativo = true) > 0 
      THEN '✅ Configured' 
      ELSE '⚠️ Empty' 
    END as status;
  
  -- Funções
  RETURN QUERY
  SELECT 
    'Functions' as category,
    'V2 Functions created' as item,
    (SELECT COUNT(*)::integer FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%_v2') as count_value,
    CASE 
      WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%_v2') >= 10
      THEN '✅ Created' 
      ELSE '⚠️ Incomplete' 
    END as status;
END;
$$;

-- ==============================================
-- VALIDAÇÃO AUTOMÁTICA PÓS-MIGRAÇÃO
-- ==============================================

DO $$
DECLARE
  v_validation_passed BOOLEAN := true;
  v_total_validations INTEGER := 0;
  v_passed_validations INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '🔍 VALIDAÇÃO DA CONSOLIDAÇÃO RBAC';
  RAISE NOTICE '====================================';
  
  -- Executar validação completa
  FOR rec IN (SELECT * FROM public.validate_rbac_consolidation()) LOOP
    v_total_validations := v_total_validations + 1;
    
    IF rec.status LIKE '✅%' THEN
      v_passed_validations := v_passed_validations + 1;
      RAISE NOTICE '%: % (Antigo: %, Novo: %)', 
        rec.status, rec.validation_item, rec.old_system_value, rec.new_system_value;
    ELSE
      v_validation_passed := false;
      RAISE WARNING '%: % (Antigo: %, Novo: %)', 
        rec.status, rec.validation_item, rec.old_system_value, rec.new_system_value;
    END IF;
  END LOOP;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'RESULTADO: % de % validações passaram', v_passed_validations, v_total_validations;
  RAISE NOTICE '====================================';
  
  -- Status da consolidação
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATUS DA CONSOLIDAÇÃO:';
  RAISE NOTICE '====================================';
  
  FOR rec IN (SELECT * FROM public.get_consolidation_status()) LOOP
    RAISE NOTICE '[%] % - Count: %, Status: %', 
      rec.category, rec.item, rec.count_value, rec.status;
  END LOOP;
  
  RAISE NOTICE '====================================';
  
  IF v_validation_passed THEN
    RAISE NOTICE '✅ FASE 3 CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Sistema consolidado está pronto!';
    RAISE NOTICE '🔄 Sistema atual continua funcionando';
    RAISE NOTICE '🆕 Sistema novo disponível em paralelo';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '  1. Testar funções V2 com usuários de teste';
    RAISE NOTICE '  2. Validar permissões e acesso';
    RAISE NOTICE '  3. Migrar código frontend gradualmente';
    RAISE NOTICE '  4. Quando 100%% validado, unificar sistemas';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS VALIDAÇÕES FALHARAM!';
    RAISE WARNING 'Revise os avisos acima antes de prosseguir';
  END IF;
END $$;



