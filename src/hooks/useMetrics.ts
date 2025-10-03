import { useState, useEffect, useCallback } from 'react';
import {
  fetchSystemMetrics,
  fetchModuleUsageStats,
  fetchUserActivityStats,
  fetchDashboardKPIs,
  fetchPerformanceMetrics,
  type SystemMetrics,
  type ModuleUsageStats,
  type UserActivityStats,
  type DashboardKPIs,
} from '../services/metricsService';

/**
 * Hook para gerenciar métricas gerais do sistema
 */
export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const metricsData = await fetchSystemMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Erro ao buscar métricas do sistema:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};

/**
 * Hook para gerenciar estatísticas de uso dos módulos
 */
export const useModuleUsageStats = () => {
  const [stats, setStats] = useState<ModuleUsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statsData = await fetchModuleUsageStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao buscar estatísticas de uso dos módulos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

/**
 * Hook para gerenciar estatísticas de atividade dos usuários
 */
export const useUserActivityStats = (limit: number = 20) => {
  const [stats, setStats] = useState<UserActivityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statsData = await fetchUserActivityStats(limit);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao buscar estatísticas de usuários:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

/**
 * Hook para gerenciar KPIs do dashboard
 */
export const useDashboardKPIs = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const kpisData = await fetchDashboardKPIs();
      setKpis(kpisData);
    } catch (err) {
      console.error('Erro ao buscar KPIs do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return {
    kpis,
    loading,
    error,
    refetch: fetchKPIs,
  };
};

/**
 * Hook para gerenciar métricas de performance
 */
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<{
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const metricsData = await fetchPerformanceMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Erro ao buscar métricas de performance:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};

/**
 * Hook combinado para dashboard completo
 */
export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<{
    systemMetrics: SystemMetrics | null;
    moduleUsageStats: ModuleUsageStats[];
    userActivityStats: UserActivityStats[];
    kpis: DashboardKPIs | null;
    performanceMetrics: {
      averageResponseTime: number;
      totalRequests: number;
      errorRate: number;
      uptime: number;
    } | null;
  }>({
    systemMetrics: null,
    moduleUsageStats: [],
    userActivityStats: [],
    kpis: null,
    performanceMetrics: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        systemMetrics,
        moduleUsageStats,
        userActivityStats,
        kpis,
        performanceMetrics,
      ] = await Promise.all([
        fetchSystemMetrics(),
        fetchModuleUsageStats(),
        fetchUserActivityStats(20),
        fetchDashboardKPIs(),
        fetchPerformanceMetrics(),
      ]);

      setDashboardData({
        systemMetrics,
        moduleUsageStats,
        userActivityStats,
        kpis,
        performanceMetrics,
      });
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    ...dashboardData,
    loading,
    error,
    refetch: fetchAllData,
  };
};


