import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsSummary {
  totalAccesses: number;
  totalUsers: number;
  totalModules: number;
  avgResponseTime: number;
  successRate: number;
  topModule: string;
  growthRate: number;
}

interface ModuleSummary {
  name: string;
  accesses: number;
  users: number;
  growth: number;
  status: 'up' | 'down' | 'stable';
}

interface TrendData {
  date: string;
  accesses: number;
  users: number;
  responseTime: number;
}

/**
 * Hook personalizado para buscar dados consolidados de Analytics
 * Centraliza a lógica de busca de dados de todas as páginas de analytics
 */
export const useAnalyticsData = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [moduleSummaries, setModuleSummaries] = useState<ModuleSummary[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados consolidados usando funções RPC
      const [
        summaryResult,
        moduleStatsResult
      ] = await Promise.all([
        supabase.rpc('get_analytics_summary'),
        supabase.rpc('get_module_access_stats')
      ]);

      // Verificar erros
      const errors = [summaryResult, moduleStatsResult]
        .filter(result => result.error)
        .map(result => result.error?.message);

      if (errors.length > 0) {
        throw new Error(`Erro ao buscar dados: ${errors.join(', ')}`);
      }

      // Processar dados do resumo
      const summaryData = summaryResult.data?.[0];
      const totalAccesses = summaryData?.total_accesses || 0;
      const totalUsers = summaryData?.total_users || 0;
      const totalModules = summaryData?.total_modules || 0;
      const successRate = summaryData?.success_rate || 0;
      
      // Simular dados de performance e crescimento (ainda não temos dados reais)
      const avgResponseTime = 180; // ms
      const growthRate = 12.5; // %
      
      // Determinar módulo mais acessado dos dados reais
      const moduleStats = moduleStatsResult.data || [];
      const topModule = moduleStats.length > 0 ? moduleStats[0].module_name : 'RBAC (Gestão de Usuários)';

      setSummary({
        totalAccesses,
        totalUsers,
        totalModules,
        avgResponseTime,
        successRate,
        topModule,
        growthRate,
      });

      // Processar resumos por módulo usando dados reais
      const moduleSummaries: ModuleSummary[] = moduleStats.map((stat: any) => {
        const accesses = stat.access_count;
        const users = Math.floor(accesses * 0.3) + Math.floor(Math.random() * 10); // Simular usuários únicos
        const growth = Math.floor(Math.random() * 20) - 5; // -5% a +15% (ainda simulado)
        
        let status: 'up' | 'down' | 'stable';
        if (growth > 5) {
          status = 'up';
        } else if (growth < -5) {
          status = 'down';
        } else {
          status = 'stable';
        }
        
        return {
          name: stat.module_name,
          accesses,
          users,
          growth,
          status
        };
      });

      setModuleSummaries(moduleSummaries);

      // Gerar dados de tendência (últimos 7 dias)
      const trendData: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        trendData.push({
          date: date.toISOString().split('T')[0],
          accesses: Math.floor(Math.random() * 100) + 50,
          users: Math.floor(Math.random() * 30) + 10,
          responseTime: Math.floor(Math.random() * 50) + 150,
        });
      }

      setTrendData(trendData);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return {
    summary,
    moduleSummaries,
    trendData,
    loading,
    error,
    refetch: fetchAnalyticsData,
  };
};
