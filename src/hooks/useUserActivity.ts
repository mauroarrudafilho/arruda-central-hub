import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  module_name?: string;
  success: boolean;
  error_message?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  frontend_module?: string;
}

export interface ResourceAccessLog {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
  module_name?: string;
}

export interface SecurityLog {
  id: string;
  user_id: string;
  event_type: string;
  severity: string;
  description: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface UsagePattern {
  module_name: string;
  access_count: number;
  last_access: string;
  features: Set<string>;
  hours: number[];
}

export interface ActivitySummary {
  total_activities: number;
  successful_activities: number;
  failed_activities: number;
  unique_modules: number;
  most_used_module: string;
  last_activity: string;
  security_events: number;
}

export const useUserActivity = (userId: string) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [resourceAccessLogs, setResourceAccessLogs] = useState<ResourceAccessLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar atividades recentes do usuário
  const fetchUserActivities = async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('auth_audit')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedActivities: UserActivity[] = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        action: item.acao,
        resource_type: item.recurso_tipo,
        resource_id: item.recurso_id,
        details: item.dados_novos as Record<string, unknown>,
        ip_address: item.ip_address as string,
        user_agent: item.user_agent,
        timestamp: item.created_at,
        module_name: item.modulo,
        success: true, // Assumindo sucesso baseado no nível
        error_message: null
      })) || [];

      setActivities(formattedActivities);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar atividades do usuário';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar logs de acesso a recursos (usando auth_audit)
  const fetchResourceAccessLogs = async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('auth_audit')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedLogs: ResourceAccessLog[] = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        resource_type: item.recurso_tipo,
        resource_id: item.recurso_id,
        action: item.acao,
        timestamp: item.created_at,
        ip_address: item.ip_address as string,
        user_agent: item.user_agent,
        success: true, // Assumindo sucesso baseado no nível
        error_message: null,
        module_name: item.modulo
      })) || [];

      setResourceAccessLogs(formattedLogs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar logs de acesso';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Buscar logs de segurança (usando auth_audit)
  const fetchSecurityLogs = async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('auth_audit')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedLogs: SecurityLog[] = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        event_type: item.acao,
        severity: item.nivel,
        description: `${item.acao} em ${item.modulo}`,
        ip_address: item.ip_address as string,
        user_agent: item.user_agent,
        timestamp: item.created_at,
        resolved: false,
        resolved_at: null,
        resolved_by: null
      })) || [];

      setSecurityLogs(formattedLogs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar logs de segurança';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Analisar padrões de uso
  const analyzeUsagePatterns = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('auth_audit')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const moduleStats: Record<string, UsagePattern> = {};

      data?.forEach(activity => {
        const module = activity.modulo || 'unknown';
        if (!moduleStats[module]) {
          moduleStats[module] = {
            module_name: module,
            access_count: 0,
            last_access: activity.created_at,
            features: new Set(),
            hours: []
          };
        }

        moduleStats[module].access_count++;
        moduleStats[module].last_access = activity.created_at;
        moduleStats[module].features.add(activity.acao);
        moduleStats[module].hours.push(new Date(activity.created_at).getHours());
      });

      setUsagePatterns(Object.values(moduleStats));
    } catch (err) {
      console.error('Erro ao analisar padrões de uso:', err);
    }
  };

  // Gerar resumo de atividades
  const generateActivitySummary = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('auth_audit')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const totalActivities = data?.length || 0;
      const successfulActivities = data?.length || 0; // Assumindo que todos são sucessos
      const failedActivities = 0; // Não temos campo de erro na estrutura atual
      const uniqueModules = new Set(data?.map(a => a.modulo).filter(Boolean)).size;
      
      const lastActivity = data?.[0]?.created_at || '';
      const mostUsedModule = data?.reduce((acc, activity) => {
        const module = activity.modulo || 'unknown';
        acc[module] = (acc[module] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedModuleName = Object.entries(mostUsedModule || {})
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Nenhum';

      // Calcular horário mais ativo
      const hourCounts: Record<number, number> = {};
      data?.forEach(activity => {
        const hour = new Date(activity.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      // Calcular horário mais ativo (não usado no momento)
      Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '0';

      setActivitySummary({
        total_activities: totalActivities,
        successful_activities: successfulActivities,
        failed_activities: failedActivities,
        unique_modules: uniqueModules,
        most_used_module: mostUsedModuleName,
        last_activity: lastActivity,
        security_events: 0 // Não temos eventos de segurança específicos
      });
    } catch (err) {
      console.error('Erro ao gerar resumo de atividades:', err);
    }
  };

  // Buscar atividades por módulo
  const getActivitiesByModule = (moduleName: string): UserActivity[] => {
    return activities.filter(activity => activity.module_name === moduleName);
  };

  // Buscar atividades por período
  const getActivitiesByPeriod = (startDate: Date, endDate: Date): UserActivity[] => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= startDate && activityDate <= endDate;
    });
  };

  // Buscar sessões ativas (mock - não temos tabela de sessões)
  const fetchActiveSessions = async () => {
    // Mock data para sessões
    setSessions([]);
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (userId) {
      fetchUserActivities();
      fetchResourceAccessLogs();
      fetchSecurityLogs();
      analyzeUsagePatterns();
      generateActivitySummary();
    }
  }, [userId]);

  return {
    activities,
    sessions,
    resourceAccessLogs,
    securityLogs,
    usagePatterns,
    activitySummary,
    loading,
    error,
    fetchUserActivities,
    fetchResourceAccessLogs,
    fetchSecurityLogs,
    fetchActiveSessions,
    analyzeUsagePatterns,
    generateActivitySummary,
    getActivitiesByModule,
    getActivitiesByPeriod,
  };
};

export default useUserActivity;