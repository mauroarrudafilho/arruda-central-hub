import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ProjectDetailedStats {
  projectId: string;
  userAccessCount: number;
  totalAccessCount: number;
  uniqueUsers: number;
  successRate: number;
  lastAccess?: string;
  lastUserAccess?: string;
}

export const useProjectDetailedStats = (projectIds: string[]) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Map<string, ProjectDetailedStats>>(new Map());
  const [loading, setLoading] = useState(true);

  // Memoizar a string de IDs para evitar re-renderizações desnecessárias
  const projectIdsKey = useMemo(() => projectIds.sort().join(','), [projectIds]);

  useEffect(() => {
    if (projectIds.length === 0 || !user) {
      setStats(new Map());
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Buscar todos os acessos dos projetos
        const { data: accessData, error } = await supabase
          .from('resource_access_log')
          .select('user_id, created_at, success, metadata')
          .eq('resource_type', 'project_access');

        if (error) {
          console.error('Erro ao buscar estatísticas de projetos:', error);
          setStats(new Map());
          return;
        }

        // Agrupar por project_id
        const statsMap = new Map<string, ProjectDetailedStats>();

        projectIds.forEach(projectId => {
          const projectAccesses = (accessData || []).filter(access => {
            // project_id está apenas em metadata, não como coluna direta
            const metadataProjectId = access.metadata?.project_id;
            return metadataProjectId === projectId;
          });

          // Acessos do usuário atual
          const userAccesses = projectAccesses.filter(access => access.user_id === user.id);
          const userAccessCount = userAccesses.length;
          
          // Último acesso do usuário
          const sortedUserAccesses = userAccesses.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastUserAccess = sortedUserAccesses.length > 0 ? sortedUserAccesses[0].created_at : undefined;

          // Estatísticas gerais
          const totalAccessCount = projectAccesses.length;
          const uniqueUsers = new Set(projectAccesses.map(a => a.user_id)).size;
          const successfulAccesses = projectAccesses.filter(a => a.success).length;
          const successRate = totalAccessCount > 0 ? (successfulAccesses / totalAccessCount) * 100 : 0;
          
          // Último acesso geral
          const sortedAccesses = projectAccesses.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastAccess = sortedAccesses.length > 0 ? sortedAccesses[0].created_at : undefined;

          statsMap.set(projectId, {
            projectId,
            userAccessCount,
            totalAccessCount,
            uniqueUsers,
            successRate,
            lastAccess,
            lastUserAccess,
          });
        });

        setStats(statsMap);
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        setStats(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [projectIdsKey, user?.id, projectIds]);

  const getProjectStats = (projectId: string): ProjectDetailedStats | null => {
    return stats.get(projectId) || null;
  };

  return { stats, loading, getProjectStats };
};

