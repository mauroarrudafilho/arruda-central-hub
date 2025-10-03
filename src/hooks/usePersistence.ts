import { useState, useCallback } from 'react';
import {
  logModuleAccess,
  updateUserPreferences,
  getUserPreferences,
  saveModuleProgress,
  getModuleProgress,
  updateSystemMetrics,
  syncOfflineData,
  storeOfflineData,
  type UserPreferences,
  type ModuleProgress,
} from '../services/persistenceService';

/**
 * Hook para gerenciar persistência de dados
 */
export const usePersistence = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logAccess = useCallback(async (
    userId: string,
    moduleId: string,
    moduleName: string,
    action: string = 'access',
    metadata?: any
  ) => {
    try {
      setLoading(true);
      setError(null);
      await logModuleAccess(userId, moduleId, moduleName, action, metadata);
    } catch (err) {
      console.error('Erro ao registrar acesso:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (
    userId: string,
    preferences: Partial<UserPreferences>
  ) => {
    try {
      setLoading(true);
      setError(null);
      await updateUserPreferences(userId, preferences);
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async (userId: string): Promise<UserPreferences> => {
    try {
      setLoading(true);
      setError(null);
      return await getUserPreferences(userId);
    } catch (err) {
      console.error('Erro ao buscar preferências:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Retornar preferências padrão em caso de erro
      return {
        theme: 'system',
        language: 'pt-BR',
        notifications: {
          email: true,
          push: true,
          inApp: true,
        },
        dashboard: {
          layout: 'grid',
          defaultView: 'overview',
          showMetrics: true,
        },
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProgress = useCallback(async (
    userId: string,
    moduleId: string,
    progress: number,
    completedSections: string[] = [],
    bookmarks: string[] = []
  ) => {
    try {
      setLoading(true);
      setError(null);
      await saveModuleProgress(userId, moduleId, progress, completedSections, bookmarks);
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgress = useCallback(async (
    userId: string,
    moduleId: string
  ): Promise<ModuleProgress | null> => {
    try {
      setLoading(true);
      setError(null);
      return await getModuleProgress(userId, moduleId);
    } catch (err) {
      console.error('Erro ao buscar progresso:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await updateSystemMetrics();
    } catch (err) {
      console.error('Erro ao atualizar métricas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await syncOfflineData(userId);
    } catch (err) {
      console.error('Erro ao sincronizar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const storeOffline = useCallback((userId: string, type: string, data: any) => {
    try {
      storeOfflineData(userId, type, data);
    } catch (err) {
      console.error('Erro ao armazenar dados offline:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

  return {
    loading,
    error,
    logAccess,
    updatePreferences,
    fetchPreferences,
    saveProgress,
    fetchProgress,
    updateMetrics,
    syncData,
    storeOffline,
  };
};

/**
 * Hook para gerenciar preferências do usuário
 */
export const useUserPreferences = (userId: string | null) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const prefs = await getUserPreferences(userId);
      setPreferences(prefs);
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      await updateUserPreferences(userId, newPreferences);
      
      // Atualizar estado local
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    preferences,
    loading,
    error,
    loadPreferences,
    updatePreferences,
  };
};

/**
 * Hook para gerenciar progresso de módulos
 */
export const useModuleProgress = (userId: string | null, moduleId: string | null) => {
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!userId || !moduleId) return;

    try {
      setLoading(true);
      setError(null);
      const progressData = await getModuleProgress(userId, moduleId);
      setProgress(progressData);
    } catch (err) {
      console.error('Erro ao carregar progresso:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId, moduleId]);

  const saveProgress = useCallback(async (
    progressValue: number,
    completedSections: string[] = [],
    bookmarks: string[] = []
  ) => {
    if (!userId || !moduleId) return;

    try {
      setLoading(true);
      setError(null);
      await saveModuleProgress(userId, moduleId, progressValue, completedSections, bookmarks);
      
      // Atualizar estado local
      setProgress(prev => ({
        moduleId,
        userId,
        progress: progressValue,
        lastAccessed: new Date().toISOString(),
        completedSections,
        bookmarks,
      }));
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId, moduleId]);

  return {
    progress,
    loading,
    error,
    loadProgress,
    saveProgress,
  };
};


