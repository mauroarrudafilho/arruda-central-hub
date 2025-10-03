import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from './useAuth';

interface KpiData {
  totalModules: number;
  todayAccess: number;
  uptime: number;
  activeUsers: number;
}

interface UseKpiDataReturn {
  data: KpiData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useKpiData = (): UseKpiDataReturn => {
  const { user } = useAuthState();
  const [data, setData] = useState<KpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpiData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar dados dos KPIs em paralelo
      const [
        modulesResult,
        todayAccessResult,
        activeUsersResult,
        systemUptimeResult
      ] = await Promise.all([
        // Total de módulos disponíveis
        supabase
          .from('frontend_modules')
          .select('id, is_active')
          .eq('is_active', true),
        
        // Acessos de hoje
        supabase
          .from('resource_access_log')
          .select('id')
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // Usuários ativos (sessões ativas nas últimas 15 minutos)
        supabase
          .from('user_sessions')
          .select('user_id')
          .gte('last_activity', new Date(Date.now() - 15 * 60 * 1000).toISOString())
          .eq('is_active', true),
        
        // Uptime do sistema (simulado - em produção viria de monitoramento)
        Promise.resolve({ data: { uptime: 99.8 }, error: null })
      ]);

      // Verificar erros
      if (modulesResult.error) throw modulesResult.error;
      if (todayAccessResult.error) throw todayAccessResult.error;
      if (activeUsersResult.error) throw activeUsersResult.error;
      if (systemUptimeResult.error) throw systemUptimeResult.error;

      // Processar dados
      const kpiData: KpiData = {
        totalModules: modulesResult.data?.length || 0,
        todayAccess: todayAccessResult.data?.length || 0,
        uptime: systemUptimeResult.data?.uptime || 99.8,
        activeUsers: activeUsersResult.data?.length || 0,
      };

      setData(kpiData);
    } catch (err) {
      console.error('Erro ao buscar dados dos KPIs:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Fallback para dados mockados em caso de erro
      setData({
        totalModules: 17,
        todayAccess: 243,
        uptime: 99.8,
        activeUsers: 12,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiData();
  }, [user]);

  const refetch = () => {
    fetchKpiData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

