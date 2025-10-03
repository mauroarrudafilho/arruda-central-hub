import { useState, useEffect, useCallback } from 'react';
import {
  fetchRecentActivities,
  fetchActiveSessions,
  fetchResourceAccessHistory,
  fetchActivityStats,
  logResourceAccess,
  type RecentActivity,
  type SessionWithModule,
  type ActivityWithModule,
} from '../services/activityService';

export interface UseActivitiesOptions {
  userId?: string;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseActivitiesReturn {
  activities: RecentActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar atividades recentes
 */
export const useActivities = (options: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const { userId, limit = 10, autoFetch = true } = options;
  
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activitiesData = await fetchRecentActivities(userId, limit);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Erro ao buscar atividades:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    activities,
    loading,
    error,
    refetch: fetchData,
  };
};

/**
 * Hook para gerenciar sessões ativas
 */
export const useActiveSessions = (userId?: string) => {
  const [sessions, setSessions] = useState<SessionWithModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionsData = await fetchActiveSessions(userId);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Erro ao buscar sessões ativas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
};

/**
 * Hook para gerenciar histórico de acessos
 */
export const useResourceAccessHistory = (
  userId?: string,
  resourceType?: string,
  limit: number = 50
) => {
  const [history, setHistory] = useState<ActivityWithModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const historyData = await fetchResourceAccessHistory(userId, resourceType, limit);
      setHistory(historyData);
    } catch (err) {
      console.error('Erro ao buscar histórico de acessos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId, resourceType, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
  };
};

/**
 * Hook para gerenciar estatísticas de atividade
 */
export const useActivityStats = (userId?: string) => {
  const [stats, setStats] = useState<{
    totalAccesses: number;
    successfulAccesses: number;
    failedAccesses: number;
    activeSessions: number;
    lastActivity?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statsData = await fetchActivityStats(userId);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao buscar estatísticas de atividade:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
 * Hook para registrar acesso a recursos
 */
export const useResourceAccessLogger = () => {
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logAccess = useCallback(async (
    userId: string,
    resourceType: string,
    resourcePath: string,
    action: string,
    success: boolean = true,
    metadata?: any
  ) => {
    try {
      setLogging(true);
      setError(null);

      await logResourceAccess(userId, resourceType, resourcePath, action, success, metadata);
    } catch (err) {
      console.error('Erro ao registrar acesso:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLogging(false);
    }
  }, []);

  return {
    logAccess,
    logging,
    error,
  };
};


