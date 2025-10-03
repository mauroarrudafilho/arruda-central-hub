import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];
type ResourceAccessLog = Database['public']['Tables']['resource_access_log']['Row'];
type FrontendModule = Database['public']['Tables']['frontend_modules']['Row'];

export interface SystemMetrics {
  totalUsers: number;
  activeSessions: number;
  totalModules: number;
  activeModules: number;
  totalAccesses: number;
  successfulAccesses: number;
  failedAccesses: number;
  lastActivity?: string;
}

export interface ModuleUsageStats {
  moduleId: string;
  moduleName: string;
  displayName: string;
  accessCount: number;
  uniqueUsers: number;
  lastAccess?: string;
  successRate: number;
}

export interface UserActivityStats {
  userId: string;
  userName?: string;
  totalAccesses: number;
  activeSessions: number;
  lastActivity?: string;
  mostUsedModule?: string;
}

export interface DashboardKPIs {
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
  };
  modulePerformance: {
    totalModules: number;
    activeModules: number;
    maintenanceModules: number;
    averageUsagePerModule: number;
  };
}

/**
 * Busca métricas gerais do sistema
 */
export const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    // Buscar total de usuários
    const { count: totalUsers, error: usersError } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Erro ao buscar total de usuários:', usersError);
    }

    // Buscar sessões ativas
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('status', 'ativo');

    if (sessionsError) {
      console.error('Erro ao buscar sessões ativas:', sessionsError);
    }

    // Buscar módulos
    const { data: modules, error: modulesError } = await supabase
      .from('frontend_modules')
      .select('id, status');

    if (modulesError) {
      console.error('Erro ao buscar módulos:', modulesError);
    }

    // Buscar acessos
    const { data: accesses, error: accessesError } = await supabase
      .from('resource_access_log')
      .select('success, created_at')
      .order('created_at', { ascending: false })
      .limit(1000); // Limitar para performance

    if (accessesError) {
      console.error('Erro ao buscar acessos:', accessesError);
    }

    const totalAccesses = accesses?.length || 0;
    const successfulAccesses = accesses?.filter(a => a.success).length || 0;
    const failedAccesses = totalAccesses - successfulAccesses;
    const lastActivity = accesses?.length > 0 ? accesses[0].created_at : undefined;

    return {
      totalUsers: totalUsers || 0,
      activeSessions: activeSessions?.length || 0,
      totalModules: modules?.length || 0,
      activeModules: modules?.filter(m => m.status === 'ativo').length || 0,
      totalAccesses,
      successfulAccesses,
      failedAccesses,
      lastActivity,
    };
  } catch (error) {
    console.error('Erro ao buscar métricas do sistema:', error);
    throw new Error('Falha ao carregar métricas do sistema');
  }
};

/**
 * Busca estatísticas de uso dos módulos
 */
export const fetchModuleUsageStats = async (): Promise<ModuleUsageStats[]> => {
  try {
    // Buscar módulos
    const { data: modules, error: modulesError } = await supabase
      .from('frontend_modules')
      .select('id, module_name, display_name');

    if (modulesError) {
      console.error('Erro ao buscar módulos:', modulesError);
      throw new Error('Falha ao carregar módulos');
    }

    // Buscar acessos por módulo
    const { data: accesses, error: accessesError } = await supabase
      .from('resource_access_log')
      .select('user_id, success, created_at, metadata')
      .eq('resource_type', 'module_access');

    if (accessesError) {
      console.error('Erro ao buscar acessos:', accessesError);
      throw new Error('Falha ao carregar acessos');
    }

    // Calcular estatísticas por módulo
    const moduleStats: ModuleUsageStats[] = (modules || []).map(module => {
      const moduleAccesses = accesses?.filter(access => 
        access.metadata?.module_name === module.module_name
      ) || [];

      const accessCount = moduleAccesses.length;
      const uniqueUsers = new Set(moduleAccesses.map(a => a.user_id)).size;
      const successfulAccesses = moduleAccesses.filter(a => a.success).length;
      const successRate = accessCount > 0 ? (successfulAccesses / accessCount) * 100 : 0;
      
      const sortedModuleAccesses = moduleAccesses.toSorted((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const lastAccess = sortedModuleAccesses.length > 0 
        ? sortedModuleAccesses[0].created_at
        : undefined;

      return {
        moduleId: module.id,
        moduleName: module.module_name,
        displayName: module.display_name,
        accessCount,
        uniqueUsers,
        lastAccess,
        successRate,
      };
    });

    return moduleStats.sort((a, b) => b.accessCount - a.accessCount);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso dos módulos:', error);
    throw new Error('Falha ao carregar estatísticas de uso');
  }
};

/**
 * Busca estatísticas de atividade dos usuários
 */
export const fetchUserActivityStats = async (limit: number = 20): Promise<UserActivityStats[]> => {
  try {
    // Buscar acessos dos usuários
    const { data: accesses, error: accessesError } = await supabase
      .from('resource_access_log')
      .select('user_id, success, created_at, metadata')
      .order('created_at', { ascending: false });

    if (accessesError) {
      console.error('Erro ao buscar acessos:', accessesError);
      throw new Error('Falha ao carregar acessos');
    }

    // Buscar sessões ativas
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('status', 'ativo');

    if (sessionsError) {
      console.error('Erro ao buscar sessões:', sessionsError);
      throw new Error('Falha ao carregar sessões');
    }

    // Agrupar por usuário
    const userStatsMap = new Map<string, UserActivityStats>();

    (accesses || []).forEach(access => {
      const userId = access.user_id;
      
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          userId,
          totalAccesses: 0,
          activeSessions: 0,
          lastActivity: access.created_at,
        });
      }

      const userStats = userStatsMap.get(userId);
      if (userStats) {
        userStats.totalAccesses++;
        
        if (new Date(access.created_at) > new Date(userStats.lastActivity || '')) {
          userStats.lastActivity = access.created_at;
        }
      }
    });

    // Adicionar sessões ativas
    (sessions || []).forEach(session => {
      const userId = session.user_id;
      const userStats = userStatsMap.get(userId);
      if (userStats) {
        userStats.activeSessions++;
      }
    });

    // Converter para array e ordenar
    const allUserStats = Array.from(userStatsMap.values());
    const sortedUserStats = allUserStats.toSorted((a, b) => b.totalAccesses - a.totalAccesses);
    const userStats = sortedUserStats.slice(0, limit);

    return userStats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de usuários:', error);
    throw new Error('Falha ao carregar estatísticas de usuários');
  }
};

/**
 * Busca KPIs para o dashboard
 */
export const fetchDashboardKPIs = async (): Promise<DashboardKPIs> => {
  try {
    const systemMetrics = await fetchSystemMetrics();
    const moduleUsageStats = await fetchModuleUsageStats();
    const userActivityStats = await fetchUserActivityStats();

    // Calcular health do sistema
    const errorRate = systemMetrics.totalAccesses > 0 
      ? (systemMetrics.failedAccesses / systemMetrics.totalAccesses) * 100 
      : 0;

    // Determinar status do sistema
    let systemStatus: 'healthy' | 'warning' | 'critical';
    if (errorRate > 10) {
      systemStatus = 'critical';
    } else if (errorRate > 5) {
      systemStatus = 'warning';
    } else {
      systemStatus = 'healthy';
    }

    const systemHealth = {
      status: systemStatus,
      uptime: 99.9, // Placeholder - seria calculado com dados reais
      responseTime: 150, // Placeholder - seria calculado com dados reais
      errorRate,
    };

    // Calcular engajamento (simplificado)
    const userEngagement = {
      dailyActiveUsers: userActivityStats.filter(u => {
        if (!u.lastActivity) return false;
        const lastActivity = new Date(u.lastActivity);
        const today = new Date();
        return lastActivity.toDateString() === today.toDateString();
      }).length,
      weeklyActiveUsers: userActivityStats.filter(u => {
        if (!u.lastActivity) return false;
        const lastActivity = new Date(u.lastActivity);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastActivity >= weekAgo;
      }).length,
      monthlyActiveUsers: userActivityStats.length,
      averageSessionDuration: 25, // Placeholder - seria calculado com dados reais
    };

    // Calcular performance dos módulos
    const totalModuleUsage = moduleUsageStats.reduce((sum, module) => sum + module.accessCount, 0);
    const modulePerformance = {
      totalModules: systemMetrics.totalModules,
      activeModules: systemMetrics.activeModules,
      maintenanceModules: systemMetrics.totalModules - systemMetrics.activeModules,
      averageUsagePerModule: systemMetrics.totalModules > 0 ? totalModuleUsage / systemMetrics.totalModules : 0,
    };

    return {
      systemHealth,
      userEngagement,
      modulePerformance,
    };
  } catch (error) {
    console.error('Erro ao buscar KPIs do dashboard:', error);
    throw new Error('Falha ao carregar KPIs do dashboard');
  }
};

/**
 * Busca métricas de performance
 */
export const fetchPerformanceMetrics = async (): Promise<{
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  uptime: number;
}> => {
  try {
    const systemMetrics = await fetchSystemMetrics();
    
    const errorRate = systemMetrics.totalAccesses > 0 
      ? (systemMetrics.failedAccesses / systemMetrics.totalAccesses) * 100 
      : 0;

    return {
      averageResponseTime: 150, // Placeholder
      totalRequests: systemMetrics.totalAccesses,
      errorRate,
      uptime: 99.9, // Placeholder
    };
  } catch (error) {
    console.error('Erro ao buscar métricas de performance:', error);
    throw new Error('Falha ao carregar métricas de performance');
  }
};
