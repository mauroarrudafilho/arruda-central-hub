#!/usr/bin/env node
/**
 * Script: Validate RLS-RPC Consistency
 * Descrição: Valida consistência entre políticas RLS e funções RPC correspondentes
 * Uso: npx tsx scripts/validate-rls-rpc-consistency.ts [table-name]
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  table_name: string;
  policy_name: string;
  policy_command: string;
  rpc_function_name: string;
  is_synchronized: boolean;
  divergences?: {
    field: string;
    rls_value: any;
    rpc_value: any;
  }[];
  validation_status: 'valid' | 'invalid' | 'warning';
  validation_message: string;
}

interface RLSPolicy {
  table_name: string;
  policy_name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  using_clause?: string;
  with_check_clause?: string;
}

interface RPCFunction {
  function_name: string;
  table_name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  content: string;
}

/**
 * Parse SQL migration file para extrair políticas RLS
 */
function parseRLSPolicies(sqlContent: string, tableName?: string): RLSPolicy[] {
  const policies: RLSPolicy[] = [];
  
  // Regex para encontrar CREATE POLICY statements
  const policyRegex = /CREATE\s+POLICY\s+["']?([\w_]+)["']?\s+ON\s+public\.([\w_]+)\s+FOR\s+(SELECT|INSERT|UPDATE|DELETE)[\s\S]*?USING\s*\(([\s\S]*?)\)(?:[\s\S]*?WITH\s+CHECK\s*\(([\s\S]*?)\))?/gi;
  
  let match;
  while ((match = policyRegex.exec(sqlContent)) !== null) {
    const policyName = match[1];
    const tableNameFromPolicy = match[2];
    const command = match[3] as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    const usingClause = match[4]?.trim();
    const withCheckClause = match[5]?.trim();
    
    // Filtrar por tabela se especificado
    if (tableName && tableNameFromPolicy !== tableName) {
      continue;
    }
    
    policies.push({
      table_name: tableNameFromPolicy,
      policy_name: policyName,
      command,
      using_clause: usingClause,
      with_check_clause: withCheckClause,
    });
  }
  
  return policies;
}

/**
 * Parse SQL migration file para extrair funções RPC
 */
function parseRPCFunctions(sqlContent: string, tableName?: string): RPCFunction[] {
  const functions: RPCFunction[] = [];
  
  // Regex para encontrar CREATE FUNCTION statements
  const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.(get_(\w+)_sso)\([^)]*\)/gi;
  
  let match;
  while ((match = functionRegex.exec(sqlContent)) !== null) {
    const functionName = match[1];
    const tableNameFromFunction = match[2];
    
    // Filtrar por tabela se especificado
    if (tableName && tableNameFromFunction !== tableName) {
      continue;
    }
    
    // Extrair conteúdo completo da função
    const functionStart = sqlContent.indexOf(match[0]);
    const functionEnd = sqlContent.indexOf('$$;', functionStart);
    
    if (functionEnd > functionStart) {
      const functionContent = sqlContent.substring(functionStart, functionEnd + 3);
      
      // Determinar comando baseado no nome da função
      let command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT';
      if (functionName.includes('create_')) command = 'INSERT';
      else if (functionName.includes('update_')) command = 'UPDATE';
      else if (functionName.includes('delete_')) command = 'DELETE';
      
      functions.push({
        function_name: functionName,
        table_name: tableNameFromFunction,
        command,
        content: functionContent,
      });
    }
  }
  
  return functions;
}

/**
 * Extrair função auxiliar de permissão usada na policy
 */
function extractPermissionFunction(usingClause: string): string | null {
  if (!usingClause) return null;
  
  // Procurar por padrões como: can_user_view_acordo(...), can_user_edit_acordo(...)
  const functionRegex = /(can_user_\w+)\(/i;
  const match = usingClause.match(functionRegex);
  return match ? match[1] : null;
}

/**
 * Extrair função auxiliar de permissão usada na RPC function
 */
function extractRPCPermissionFunction(rpcContent: string): string | null {
  // Procurar por chamadas de função auxiliar
  const functionRegex = /(get_\w+_where_filter|can_user_\w+)\(/i;
  const match = rpcContent.match(functionRegex);
  return match ? match[1] : null;
}

/**
 * Validar consistência entre policy RLS e função RPC
 */
function validateConsistency(
  policy: RLSPolicy,
  rpcFunction: RPCFunction | null
): ValidationResult {
  const result: ValidationResult = {
    table_name: policy.table_name,
    policy_name: policy.policy_name,
    policy_command: policy.command,
    rpc_function_name: rpcFunction?.function_name || 'NOT_FOUND',
    is_synchronized: false,
    validation_status: 'invalid',
    validation_message: '',
  };
  
  // Verificar se função RPC existe
  if (!rpcFunction) {
    result.validation_message = `RPC function not found for policy ${policy.policy_name}`;
    return result;
  }
  
  // Verificar se comandos correspondem
  if (policy.command !== rpcFunction.command) {
    result.validation_message = `Command mismatch: Policy is ${policy.command}, RPC is ${rpcFunction.command}`;
    return result;
  }
  
  // Extrair funções auxiliares usadas
  const policyPermissionFunction = extractPermissionFunction(policy.using_clause || '');
  const rpcPermissionFunction = extractRPCPermissionFunction(rpcFunction.content);
  
  // Verificar se ambas usam funções auxiliares
  const bothUseAuxFunctions = policyPermissionFunction && rpcPermissionFunction;
  
  if (!bothUseAuxFunctions) {
    result.validation_status = 'warning';
    result.validation_message = 'One or both do not use auxiliary permission functions';
    result.divergences = [
      {
        field: 'permission_function',
        rls_value: policyPermissionFunction || 'NOT_USED',
        rpc_value: rpcPermissionFunction || 'NOT_USED',
      },
    ];
    return result;
  }
  
  // Verificar se ambas usam a mesma função auxiliar (ou funções relacionadas)
  // Exemplo: can_user_view_acordo e get_acordos_where_filter são relacionadas
  const relatedFunctions = 
    policyPermissionFunction?.includes('can_user_') && 
    rpcPermissionFunction?.includes('_where_filter');
  
  if (!relatedFunctions && policyPermissionFunction !== rpcPermissionFunction) {
    result.validation_status = 'warning';
    result.validation_message = 'Different auxiliary permission functions used';
    result.divergences = [
      {
        field: 'permission_function',
        rls_value: policyPermissionFunction,
        rpc_value: rpcPermissionFunction,
      },
    ];
    return result;
  }
  
  // Se chegou aqui, está sincronizado
  result.is_synchronized = true;
  result.validation_status = 'valid';
  result.validation_message = 'Policy and RPC function are synchronized';
  
  return result;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const tableName = args[0]; // Opcional: validar apenas uma tabela específica
  
  console.log('🔍 Validating RLS-RPC consistency...\n');
  
  // Buscar todas as migrations SQL
  const migrationsDir = 'supabase/migrations';
  const migrationFiles: string[] = [];
  
  function findMigrations(dir: string): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          findMigrations(fullPath);
        } else if (entry.name.endsWith('.sql')) {
          migrationFiles.push(fullPath);
        }
      }
    } catch (err) {
      // Ignorar erros de diretório não encontrado
    }
  }
  
  findMigrations(migrationsDir);
  
  if (migrationFiles.length === 0) {
    console.error('Error: No migration files found');
    process.exit(1);
  }
  
  // Parsear todas as policies RLS e funções RPC
  const allPolicies: RLSPolicy[] = [];
  const allRPCFunctions: RPCFunction[] = [];
  
  for (const migrationFile of migrationFiles) {
    if (!existsSync(migrationFile)) {
      continue;
    }
    
      const sqlContent = readFileSync(migrationFile, 'utf-8');
    
    // Extrair policies e funções
    const policies = parseRLSPolicies(sqlContent, tableName);
    const rpcFunctions = parseRPCFunctions(sqlContent, tableName);
    
    allPolicies.push(...policies);
    allRPCFunctions.push(...rpcFunctions);
  }
  
  if (allPolicies.length === 0) {
    console.log('⚠️  No RLS policies found');
    return;
  }
  
  console.log(`📊 Found ${allPolicies.length} RLS policy(ies) and ${allRPCFunctions.length} RPC function(s)\n`);
  
  // Validar consistência
  const validationResults: ValidationResult[] = [];
  
  for (const policy of allPolicies) {
    // Encontrar função RPC correspondente
    // Para SELECT: get_{table}_sso
    // Para outros: {action}_{table}_sso
    let rpcFunctionName = '';
    if (policy.command === 'SELECT') {
      rpcFunctionName = `get_${policy.table_name}_sso`;
    } else {
      const actionMap: Record<string, string> = {
        'INSERT': 'create',
        'UPDATE': 'update',
        'DELETE': 'delete',
      };
      rpcFunctionName = `${actionMap[policy.command]}_${policy.table_name}_sso`;
    }
    
    const rpcFunction = allRPCFunctions.find(f => f.function_name === rpcFunctionName);
    
    const result = validateConsistency(policy, rpcFunction || null);
    validationResults.push(result);
  }
  
  // Exibir resultados
  console.log('📋 Validation Results:\n');
  
  let validCount = 0;
  let warningCount = 0;
  let invalidCount = 0;
  
  for (const result of validationResults) {
    const statusIcon = 
      result.validation_status === 'valid' ? '✅' :
      result.validation_status === 'warning' ? '⚠️' :
      '❌';
    
    console.log(`${statusIcon} ${result.policy_name} (${result.policy_command}) on ${result.table_name}`);
    console.log(`   Status: ${result.validation_status}`);
    console.log(`   RPC Function: ${result.rpc_function_name}`);
    console.log(`   Message: ${result.validation_message}`);
    
    if (result.divergences && result.divergences.length > 0) {
      console.log(`   Divergences:`);
      result.divergences.forEach(d => {
        console.log(`     - ${d.field}: RLS=${d.rls_value}, RPC=${d.rpc_value}`);
      });
    }
    
    console.log('');
    
    if (result.validation_status === 'valid') validCount++;
    else if (result.validation_status === 'warning') warningCount++;
    else invalidCount++;
  }
  
  // Resumo
  console.log('📊 Summary:');
  console.log(`   ✅ Valid: ${validCount}`);
  console.log(`   ⚠️  Warning: ${warningCount}`);
  console.log(`   ❌ Invalid: ${invalidCount}`);
  
  // Exit code baseado em resultados
  if (invalidCount > 0) {
    process.exit(1);
  } else if (warningCount > 0) {
    process.exit(0); // Warnings não são críticos
  }
  
  console.log('\n✨ All validations passed!');
}

// Executar se rodado diretamente
main();
