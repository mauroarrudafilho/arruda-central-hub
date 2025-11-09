import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuthWithTenant';

interface Tenant {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  configuracoes?: Record<string, unknown>;
  dominio_personalizado?: string;
  tema_personalizado?: Record<string, unknown>;
  limite_usuarios?: number;
  plano?: 'basico' | 'premium' | 'enterprise';
}

interface TenantContextType {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  loading: boolean;
  switchTenant: (tenantId: string) => Promise<{ error: unknown }>;
  refreshTenant: () => Promise<void>;
  getTenantConfig: (key: string) => unknown;
  getTenantTheme: () => Record<string, unknown>;
  isFeatureEnabled: (feature: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user, currentTenant: authTenant, availableTenants: authTenants, switchTenant: authSwitchTenant } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  // Sincronizar com contexto de autenticação
  useEffect(() => {
    setCurrentTenant(authTenant);
    setAvailableTenants(authTenants);
  }, [authTenant, authTenants]);

  // Função para trocar de tenant
  const switchTenant = async (tenantId: string) => {
    setLoading(true);
    try {
      const result = await authSwitchTenant(tenantId);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Função para recarregar dados do tenant
  const refreshTenant = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: tenantData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', currentTenant?.id)
        .single();

      if (!error && tenantData) {
        setCurrentTenant(tenantData);
      }
    } catch (error) {
      console.error('Error refreshing tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter configuração específica do tenant
  const getTenantConfig = useCallback((key: string) => {
    if (!currentTenant?.configuracoes) return null;
    return currentTenant.configuracoes[key];
  }, [currentTenant]);

  // Função para obter tema do tenant
  const getTenantTheme = useCallback(() => {
    return currentTenant?.tema_personalizado || {};
  }, [currentTenant]);

  // Função para verificar se feature está habilitada
  const isFeatureEnabled = (feature: string) => {
    if (!currentTenant) return false;
    
    // Verificar por plano
    const planFeatures = {
      basico: ['dashboard', 'users'],
      premium: ['dashboard', 'users', 'analytics', 'reports'],
      enterprise: ['dashboard', 'users', 'analytics', 'reports', 'api', 'custom_integrations']
    };

    const plan = currentTenant.plano || 'basico';
    const enabledFeatures = planFeatures[plan] || planFeatures.basico;

    return enabledFeatures.includes(feature);
  };

  const value: TenantContextType = useMemo(() => ({
    currentTenant,
    availableTenants,
    loading,
    switchTenant,
    refreshTenant,
    getTenantConfig,
    getTenantTheme,
    isFeatureEnabled,
  }), [
    currentTenant,
    availableTenants,
    loading,
    switchTenant,
    refreshTenant,
    getTenantConfig,
    getTenantTheme,
    isFeatureEnabled,
  ]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook para aplicar tema do tenant
export const useTenantTheme = () => {
  const { getTenantTheme } = useTenant();
  const [theme, setTheme] = useState<Record<string, any>>({});

  useEffect(() => {
    const tenantTheme = getTenantTheme();
    setTheme(tenantTheme);

    // Aplicar CSS customizado se existir
    if (tenantTheme.css) {
      const styleId = 'tenant-custom-css';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = tenantTheme.css;
    }
  }, [getTenantTheme]);

  return theme;
};

// Hook para verificar permissões baseadas no tenant
export const useTenantPermissions = () => {
  const { currentTenant, isFeatureEnabled } = useTenant();

  const canAccess = (resource: string) => {
    if (!currentTenant) return false;
    
    // Verificar se feature está habilitada
    if (!isFeatureEnabled(resource)) return false;
    
    // Verificar limites específicos do tenant
    const limits = currentTenant.configuracoes?.limits || {};
    const resourceLimit = limits[resource];
    
    if (resourceLimit) {
      // Implementar lógica de verificação de limites
      // Por exemplo, verificar se não excedeu limite de usuários
      return true; // Simplificado por enquanto
    }
    
    return true;
  };

  const getResourceLimit = (resource: string) => {
    if (!currentTenant) return null;
    return currentTenant.configuracoes?.limits?.[resource];
  };

  return {
    canAccess,
    getResourceLimit,
    currentTenant,
  };
};
