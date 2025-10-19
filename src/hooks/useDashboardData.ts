import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  activeSessions: number;
  totalModules: number;
  recentLogins: number;
  securityAlerts: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  timestamp: string;
  success: boolean;
}

/**
 * Hook personalizado para buscar dados do Dashboard
 * Centraliza a lógica de busca de dados e estados de loading/erro
 */
export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas gerais usando consultas que funcionam sem autenticação
      const [
        usersResult,
        rolesResult,
        sessionsResult,
        modulesResult,
        recentLoginsResult,
        failedLoginsResult,
        activityResult
      ] = await Promise.all([
        // Usar RPC para contagem de usuários (bypassa RLS)
        supabase.rpc('get_total_users_count'),
        // Roles podem ser vistos por todos
        supabase.from('rbac_auth_role').select('id', { count: 'exact' }).eq('ativo', true),
        // Usar RPC para contagem de sessões
        supabase.rpc('get_active_sessions_count'),
        // Módulos podem ser vistos por usuários autenticados, mas vamos usar RPC
        supabase.rpc('get_active_modules_count'),
        // Usar RPC para logs recentes
        supabase.rpc('get_recent_logins_count'),
        // Usar RPC para tentativas falhadas
        supabase.rpc('get_failed_logins_count'),
        // Usar RPC para atividade recente
        supabase.rpc('get_recent_activity')
      ]);

      // Verificar erros
      const errors = [usersResult, rolesResult, sessionsResult, modulesResult, recentLoginsResult, failedLoginsResult, activityResult]
        .filter(result => result.error)
        .map(result => result.error?.message);

      if (errors.length > 0) {
        throw new Error(`Erro ao buscar dados: ${errors.join(', ')}`);
      }

      // Calcular estatísticas
      const totalUsers = usersResult.data || 0;
      const totalRoles = rolesResult.count || 0;
      const activeSessions = sessionsResult.data || 0;
      const totalModules = modulesResult.data || 0;
      const recentLogins = recentLoginsResult.data || 0;
      const failedLogins = failedLoginsResult.data || 0;
      
      // Simular dados de usuários ativos
      const activeUsers = Math.floor(totalUsers * 0.7); // 70% dos usuários ativos
      const securityAlerts = failedLogins; // Usar dados reais de tentativas falhadas
      
      // Determinar saúde do sistema
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (securityAlerts > 5) systemHealth = 'critical';
      else if (securityAlerts > 2) systemHealth = 'warning';

      setStats({
        totalUsers,
        activeUsers,
        totalRoles,
        activeSessions,
        totalModules,
        recentLogins,
        securityAlerts,
        systemHealth,
      });

      // Processar atividade recente
      if (activityResult.data) {
        const activities: RecentActivity[] = activityResult.data.map((log: any) => ({
          id: log.id,
          user_email: log.user_email,
          action: log.action,
          resource: log.resource,
          timestamp: log.activity_timestamp,
          success: log.success,
        }));
        setRecentActivity(activities);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    recentActivity,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
