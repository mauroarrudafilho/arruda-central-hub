#!/usr/bin/env node
/**
 * Script: RLS-RPC Sync
 * Descrição: Parse de migrations SQL que criam/modificam policies RLS e geração automática de funções RPC correspondentes
 * Uso: npx tsx scripts/rls-rpc-sync.ts [migration-file.sql]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';

interface RLSPolicy {
  table_name: string;
  policy_name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  using_clause?: string;
  with_check_clause?: string;
}

interface RPCMapping {
  table_name: string;
  policy_name: string;
  policy_command: string;
  rpc_function_name: string;
  permission_function_name?: string;
}

/**
 * Parse SQL migration file para extrair políticas RLS
 */
function parseRLSPolicies(sqlContent: string): RLSPolicy[] {
  const policies: RLSPolicy[] = [];
  
  // Regex para encontrar CREATE POLICY statements
  const policyRegex = /CREATE\s+POLICY\s+["']?([\w_]+)["']?\s+ON\s+public\.([\w_]+)\s+FOR\s+(SELECT|INSERT|UPDATE|DELETE)[\s\S]*?USING\s*\(([\s\S]*?)\)(?:[\s\S]*?WITH\s+CHECK\s*\(([\s\S]*?)\))?/gi;
  
  let match;
  while ((match = policyRegex.exec(sqlContent)) !== null) {
    const policyName = match[1];
    const tableName = match[2];
    const command = match[3] as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    const usingClause = match[4]?.trim();
    const withCheckClause = match[5]?.trim();
    
    policies.push({
      table_name: tableName,
      policy_name: policyName,
      command,
      using_clause: usingClause,
      with_check_clause: withCheckClause,
    });
  }
  
  return policies;
}

/**
 * Extrair nome da função auxiliar de permissão de uma cláusula USING
 */
function extractPermissionFunction(usingClause: string): string | undefined {
  // Procurar por padrões como: can_user_view_acordo(...), can_user_edit_acordo(...)
  const functionRegex = /(can_user_\w+\([^)]*\))/i;
  const match = usingClause?.match(functionRegex);
  return match ? match[1].split('(')[0] : undefined;
}

/**
 * Gerar nome da função RPC baseado na tabela
 */
function generateRPCFunctionName(tableName: string, command: string): string {
  // Para SELECT, gerar get_{table}_sso
  if (command === 'SELECT') {
    return `get_${tableName}_sso`;
  }
  
  // Para outras operações, gerar {action}_{table}_sso
  const actionMap: Record<string, string> = {
    'INSERT': 'create',
    'UPDATE': 'update',
    'DELETE': 'delete',
  };
  
  return `${actionMap[command]}_${tableName}_sso`;
}

/**
 * Gerar função RPC SQL baseado na política RLS
 */
function generateRPCFunction(policy: RLSPolicy): string {
  const rpcFunctionName = generateRPCFunctionName(policy.table_name, policy.command);
  const permissionFunction = extractPermissionFunction(policy.using_clause || '');
  
  // Para SELECT, gerar função que retorna dados filtrados
  if (policy.command === 'SELECT') {
    const whereFilterFunction = `get_${policy.table_name}_where_filter`;
    
    return `
-- ==============================================
-- FUNÇÃO RPC SSO PARA BUSCAR ${policy.table_name.toUpperCase()}
-- ==============================================

CREATE OR REPLACE FUNCTION public.${rpcFunctionName}(
  p_user_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  -- Colunas da tabela ${policy.table_name}
  id UUID,
  -- Adicione outras colunas conforme necessário
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_email_to_use TEXT;
  _where_filter TEXT;
BEGIN
  -- Obter email do usuário
  IF p_user_email IS NOT NULL AND p_user_email != '' THEN
    _user_email_to_use := p_user_email;
  ELSE
    SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
    IF _sso_user.is_valid THEN
      _user_email_to_use := _sso_user.user_email;
    ELSE
      RAISE EXCEPTION 'User not authenticated via SSO. Provide p_user_email or valid SSO token in header.';
    END IF;
  END IF;
  
  -- Obter filtro WHERE usando função auxiliar (mesma lógica que RLS)
  _where_filter := public.${whereFilterFunction}(
    p_user_id => NULL,
    p_user_email => _user_email_to_use
  );
  
  -- Se filtro é FALSE, usuário não tem acesso
  IF _where_filter = 'FALSE' THEN
    RETURN;
  END IF;
  
  -- Executar query com filtro WHERE
  RETURN QUERY
  EXECUTE format('
    SELECT * FROM public.${policy.table_name}
    WHERE (%s)
    ORDER BY created_at DESC
  ', _where_filter);
END;
$$;

GRANT EXECUTE ON FUNCTION public.${rpcFunctionName}(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.${rpcFunctionName}(TEXT) TO authenticated;

COMMENT ON FUNCTION public.${rpcFunctionName}(TEXT) IS 
'Função RPC SSO para buscar ${policy.table_name}. Usa mesma lógica das RLS policies através de funções auxiliares.
Gerada automaticamente pelo script rls-rpc-sync.ts.';
`;
  }
  
  // Para outras operações, retornar função stub
  return `
-- ==============================================
-- FUNÇÃO RPC SSO PARA ${policy.command} ${policy.table_name.toUpperCase()}
-- ==============================================

-- TODO: Implementar função RPC para ${policy.command}
-- Gerada automaticamente pelo script rls-rpc-sync.ts
-- Baseada na política RLS: ${policy.policy_name}
`;
}

/**
 * Gerar mapeamento RLS-RPC
 */
function generateMapping(policy: RLSPolicy): RPCMapping {
  const rpcFunctionName = generateRPCFunctionName(policy.table_name, policy.command);
  const permissionFunction = extractPermissionFunction(policy.using_clause || '');
  
  return {
    table_name: policy.table_name,
    policy_name: policy.policy_name,
    policy_command: policy.command,
    rpc_function_name: rpcFunctionName,
    permission_function_name: permissionFunction,
  };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/rls-rpc-sync.ts <migration-file.sql>');
    console.error('Example: npx tsx scripts/rls-rpc-sync.ts supabase/migrations/20250206000003_migrate_acordos_rls.sql');
    process.exit(1);
  }
  
  const migrationFile = args[0];
  
  if (!existsSync(migrationFile)) {
    console.error(`Error: File not found: ${migrationFile}`);
    process.exit(1);
  }
  
  console.log(`📄 Parsing migration file: ${migrationFile}`);
  
  // Ler arquivo SQL
  const sqlContent = readFileSync(migrationFile, 'utf-8');
  
  // Parsear políticas RLS
  const policies = parseRLSPolicies(sqlContent);
  
  if (policies.length === 0) {
    console.log('⚠️  No RLS policies found in migration file');
    return;
  }
  
  console.log(`✅ Found ${policies.length} RLS policy(ies):`);
  policies.forEach(p => {
    console.log(`   - ${p.policy_name} (${p.command}) on ${p.table_name}`);
  });
  
  // Gerar funções RPC
  console.log('\n🔨 Generating RPC functions...');
  
  const rpcFunctions: string[] = [];
  const mappings: RPCMapping[] = [];
  
  for (const policy of policies) {
    const rpcFunction = generateRPCFunction(policy);
    const mapping = generateMapping(policy);
    
    rpcFunctions.push(rpcFunction);
    mappings.push(mapping);
  }
  
  // Gerar arquivo de migration para funções RPC
  const migrationDir = dirname(migrationFile);
  const migrationBaseName = basename(migrationFile, '.sql');
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '');
  
  // Extrair número sequencial do nome do arquivo original
  const originalSequence = migrationBaseName.match(/\d{14}/)?.[0] || timestamp;
  const nextSequence = String(parseInt(originalSequence) + 1).padStart(14, '0');
  
  const rpcMigrationFile = join(
    migrationDir,
    `${nextSequence}_create_${policies[0].table_name}_rpc_functions.sql`
  );
  
  const rpcMigrationContent = `-- Migration: Create RPC Functions for ${policies[0].table_name}
-- Data: ${new Date().toISOString().split('T')[0]}
-- Descrição: Funções RPC geradas automaticamente pelo script rls-rpc-sync.ts
-- Baseadas nas políticas RLS da migration: ${basename(migrationFile)}

${rpcFunctions.join('\n\n')}

-- ==============================================
-- REGISTRAR MAPEAMENTOS
-- ==============================================

${mappings.map(m => `
-- Registrar mapeamento ${m.policy_command}
PERFORM public.register_rls_rpc_mapping(
  '${m.table_name}',
  '${m.policy_name}',
  '${m.policy_command}',
  '${m.rpc_function_name}',
  ${m.permission_function_name ? `'${m.permission_function_name}'` : 'NULL'}
);
`).join('\n')}
`;
  
  writeFileSync(rpcMigrationFile, rpcMigrationContent);
  console.log(`✅ Generated RPC migration: ${rpcMigrationFile}`);
  
  // Gerar arquivo JSON com mapeamentos
  const mappingFile = join(
    migrationDir,
    `${migrationBaseName}_rpc_mappings.json`
  );
  
  writeFileSync(mappingFile, JSON.stringify(mappings, null, 2));
  console.log(`✅ Generated mappings file: ${mappingFile}`);
  
  console.log('\n✨ Done! Review the generated files before applying migrations.');
}

// Executar se rodado diretamente
main();
