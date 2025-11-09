// Feature Flags para Sistema RBAC
// Data: 2025-01-30
// Descrição: Sistema de feature flags para implementação segura

export interface RBACFeatureFlags {
  // Estrutura de roles simplificada
  NEW_RBAC_STRUCTURE: boolean;
  SIMPLIFIED_ROLES: boolean;
  
  // Controle de acesso por tenant
  TENANT_ACCESS_CONTROL: boolean;
  MULTI_TENANT_SUPPORT: boolean;
  
  // Sistema de equipes
  TEAM_MANAGEMENT: boolean;
  HIERARCHICAL_ACCESS: boolean;
  
  // Permissões por tela
  SCREEN_PERMISSIONS: boolean;
  GRANULAR_PERMISSIONS: boolean;
  
  // Políticas RLS
  ENHANCED_RLS: boolean;
  CENTRALIZED_POLICIES: boolean;
  
  // Auditoria
  ENHANCED_AUDIT: boolean;
  SECURITY_LOGGING: boolean;
}

// Configuração padrão (desabilitado por segurança)
const DEFAULT_FLAGS: RBACFeatureFlags = {
  NEW_RBAC_STRUCTURE: false,
  SIMPLIFIED_ROLES: false,
  TENANT_ACCESS_CONTROL: false,
  MULTI_TENANT_SUPPORT: false,
  TEAM_MANAGEMENT: false,
  HIERARCHICAL_ACCESS: false,
  SCREEN_PERMISSIONS: false,
  GRANULAR_PERMISSIONS: false,
  ENHANCED_RLS: false,
  CENTRALIZED_POLICIES: false,
  ENHANCED_AUDIT: false,
  SECURITY_LOGGING: false,
};

// Configuração de teste (habilitado para testes)
const TEST_FLAGS: RBACFeatureFlags = {
  NEW_RBAC_STRUCTURE: true,
  SIMPLIFIED_ROLES: true,
  TENANT_ACCESS_CONTROL: true,
  MULTI_TENANT_SUPPORT: true,
  TEAM_MANAGEMENT: true,
  HIERARCHICAL_ACCESS: true,
  SCREEN_PERMISSIONS: true,
  GRANULAR_PERMISSIONS: true,
  ENHANCED_RLS: true,
  CENTRALIZED_POLICIES: true,
  ENHANCED_AUDIT: true,
  SECURITY_LOGGING: true,
};

// Configuração de produção (habilitado gradualmente)
const PRODUCTION_FLAGS: RBACFeatureFlags = {
  NEW_RBAC_STRUCTURE: process.env.ENABLE_NEW_RBAC === 'true',
  SIMPLIFIED_ROLES: process.env.ENABLE_SIMPLIFIED_ROLES === 'true',
  TENANT_ACCESS_CONTROL: process.env.ENABLE_TENANT_CONTROL === 'true',
  MULTI_TENANT_SUPPORT: process.env.ENABLE_MULTI_TENANT === 'true',
  TEAM_MANAGEMENT: process.env.ENABLE_TEAM_MANAGEMENT === 'true',
  HIERARCHICAL_ACCESS: process.env.ENABLE_HIERARCHICAL_ACCESS === 'true',
  SCREEN_PERMISSIONS: process.env.ENABLE_SCREEN_PERMISSIONS === 'true',
  GRANULAR_PERMISSIONS: process.env.ENABLE_GRANULAR_PERMISSIONS === 'true',
  ENHANCED_RLS: process.env.ENABLE_ENHANCED_RLS === 'true',
  CENTRALIZED_POLICIES: process.env.ENABLE_CENTRALIZED_POLICIES === 'true',
  ENHANCED_AUDIT: process.env.ENABLE_ENHANCED_AUDIT === 'true',
  SECURITY_LOGGING: process.env.ENABLE_SECURITY_LOGGING === 'true',
};

// Função para obter flags baseado no ambiente
export function getRBACFeatureFlags(): RBACFeatureFlags {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'test':
      return TEST_FLAGS;
    case 'production':
      return PRODUCTION_FLAGS;
    default:
      return DEFAULT_FLAGS;
  }
}

// Função para verificar se uma feature está habilitada
export function isFeatureEnabled(feature: keyof RBACFeatureFlags): boolean {
  const flags = getRBACFeatureFlags();
  return flags[feature];
}

// Função para verificar múltiplas features
export function areFeaturesEnabled(features: (keyof RBACFeatureFlags)[]): boolean {
  const flags = getRBACFeatureFlags();
  return features.every(feature => flags[feature]);
}

// Função para obter features habilitadas
export function getEnabledFeatures(): (keyof RBACFeatureFlags)[] {
  const flags = getRBACFeatureFlags();
  return Object.keys(flags).filter(key => flags[key as keyof RBACFeatureFlags]) as (keyof RBACFeatureFlags)[];
}

// Função para obter features desabilitadas
export function getDisabledFeatures(): (keyof RBACFeatureFlags)[] {
  const flags = getRBACFeatureFlags();
  return Object.keys(flags).filter(key => !flags[key as keyof RBACFeatureFlags]) as (keyof RBACFeatureFlags)[];
}

// Hook para usar feature flags no React
export function useRBACFeatureFlags() {
  const flags = getRBACFeatureFlags();
  
  return {
    flags,
    isEnabled: isFeatureEnabled,
    areEnabled: areFeaturesEnabled,
    enabledFeatures: getEnabledFeatures(),
    disabledFeatures: getDisabledFeatures(),
  };
}

// Função para log de uso de features
export function logFeatureUsage(feature: keyof RBACFeatureFlags, context?: string) {
  if (isFeatureEnabled('SECURITY_LOGGING')) {
    console.log(`[RBAC Feature] ${feature} used${context ? ` in ${context}` : ''}`);
  }
}

// Função para validar configuração de features
export function validateFeatureFlags(): { valid: boolean; errors: string[] } {
  const flags = getRBACFeatureFlags();
  const errors: string[] = [];
  
  // Validar dependências
  if (flags.SIMPLIFIED_ROLES && !flags.NEW_RBAC_STRUCTURE) {
    errors.push('SIMPLIFIED_ROLES requires NEW_RBAC_STRUCTURE to be enabled');
  }
  
  if (flags.TENANT_ACCESS_CONTROL && !flags.MULTI_TENANT_SUPPORT) {
    errors.push('TENANT_ACCESS_CONTROL requires MULTI_TENANT_SUPPORT to be enabled');
  }
  
  if (flags.TEAM_MANAGEMENT && !flags.HIERARCHICAL_ACCESS) {
    errors.push('TEAM_MANAGEMENT requires HIERARCHICAL_ACCESS to be enabled');
  }
  
  if (flags.SCREEN_PERMISSIONS && !flags.GRANULAR_PERMISSIONS) {
    errors.push('SCREEN_PERMISSIONS requires GRANULAR_PERMISSIONS to be enabled');
  }
  
  if (flags.ENHANCED_RLS && !flags.CENTRALIZED_POLICIES) {
    errors.push('ENHANCED_RLS requires CENTRALIZED_POLICIES to be enabled');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Função para obter status das features
export function getFeatureStatus(): {
  environment: string;
  totalFeatures: number;
  enabledFeatures: number;
  disabledFeatures: number;
  validation: { valid: boolean; errors: string[] };
} {
  const environment = process.env.NODE_ENV || 'development';
  const flags = getRBACFeatureFlags();
  const totalFeatures = Object.keys(flags).length;
  const enabledFeatures = getEnabledFeatures().length;
  const disabledFeatures = getDisabledFeatures().length;
  const validation = validateFeatureFlags();
  
  return {
    environment,
    totalFeatures,
    enabledFeatures,
    disabledFeatures,
    validation
  };
}

// Exportar configurações para uso em outros arquivos
export {
  DEFAULT_FLAGS,
  TEST_FLAGS,
  PRODUCTION_FLAGS
};




