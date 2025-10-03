import { useState, useEffect, useCallback } from 'react';
import {
  fetchModules,
  fetchModuleById,
  fetchModulesByProject,
  fetchModulesByStatus,
  fetchModuleStats,
  type ModuleWithProject,
  type ModuleStats,
} from '../services/moduleService';

export interface UseModulesOptions {
  projectId?: string;
  status?: 'ativo' | 'inativo' | 'manutencao';
  autoFetch?: boolean;
}

export interface UseModulesReturn {
  modules: ModuleWithProject[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: ModuleStats | null;
}

/**
 * Hook para gerenciar módulos frontend
 */
export const useModules = (options: UseModulesOptions = {}): UseModulesReturn => {
  const { projectId, status, autoFetch = true } = options;
  
  const [modules, setModules] = useState<ModuleWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ModuleStats | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let modulesData: ModuleWithProject[] = [];

      // Determinar qual função usar baseado nas opções
      if (projectId) {
        modulesData = await fetchModulesByProject(projectId);
      } else if (status) {
        modulesData = await fetchModulesByStatus(status);
      } else {
        modulesData = await fetchModules();
      }

      setModules(modulesData);

      // Buscar estatísticas se não há filtros específicos
      if (!projectId && !status) {
        const statsData = await fetchModuleStats();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Erro ao buscar módulos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [projectId, status]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    modules,
    loading,
    error,
    refetch: fetchData,
    stats,
  };
};

/**
 * Hook para buscar um módulo específico por ID
 */
export const useModule = (moduleId: string | null) => {
  const [module, setModule] = useState<ModuleWithProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModule = useCallback(async () => {
    if (!moduleId) {
      setModule(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const moduleData = await fetchModuleById(moduleId);
      setModule(moduleData);
    } catch (err) {
      console.error('Erro ao buscar módulo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  return {
    module,
    loading,
    error,
    refetch: fetchModule,
  };
};

/**
 * Hook para buscar estatísticas dos módulos
 */
export const useModuleStats = () => {
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statsData = await fetchModuleStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao buscar estatísticas dos módulos:', err);
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


