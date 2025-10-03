import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];
type ResourceAccessLog = Database['public']['Tables']['resource_access_log']['Row'];

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    defaultView: string;
    showMetrics: boolean;
  };
}

export interface ModuleProgress {
  moduleId: string;
  userId: string;
  progress: number; // 0-100
  lastAccessed: string;
  completedSections: string[];
  bookmarks: string[];
}

/**
 * Registra acesso a um módulo
 */
export const logModuleAccess = async (
  userId: string,
  moduleId: string,
  moduleName: string,
  action: string = 'access',
  metadata?: any
): Promise<void> => {
  try {
    // Registrar no log de acesso a recursos
    await supabase
      .from('resource_access_log')
      .insert([{
        user_id: userId,
        resource_type: 'module_access',
        resource_path: `/hub/${moduleName}`,
        action,
        success: true,
        metadata: {
          module_name: moduleName,
          module_id: moduleId,
          ...metadata,
        },
      }]);

    // Atualizar ou criar sessão do usuário
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('frontend_module', moduleName)
      .eq('status', 'ativo')
      .single();

    if (existingSession) {
      // Atualizar sessão existente
      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSession.id);
    } else {
      // Criar nova sessão
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // Sessão expira em 2 horas

      await supabase
        .from('user_sessions')
        .insert([{
          user_id: userId,
          project_id: 'fc5abae8-2e77-4754-851f-2db638965fa6', // ID do projeto principal
          frontend_module: moduleName,
          session_token: `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          expires_at: expiresAt.toISOString(),
          frontend_origin: window.location.origin,
          last_activity: new Date().toISOString(),
          status: 'ativo',
        }]);
    }
  } catch (error) {
    console.error('Erro ao registrar acesso ao módulo:', error);
    throw new Error('Falha ao registrar acesso ao módulo');
  }
};

/**
 * Atualiza preferências do usuário
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> => {
  try {
    // Buscar preferências existentes
    const { data: existingPrefs } = await supabase
      .from('auth_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingPrefs) {
      // Atualizar preferências existentes
      await supabase
        .from('auth_profile')
        .update({
          updated_at: new Date().toISOString(),
          // Aqui você pode adicionar campos específicos para preferências
          // ou usar um campo JSON para armazenar as preferências
        })
        .eq('user_id', userId);
    } else {
      // Criar novo perfil com preferências
      await supabase
        .from('auth_profile')
        .insert([{
          user_id: userId,
          nome: 'Usuário',
          email: '',
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
    }

    // Armazenar preferências em localStorage como fallback
    localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(preferences));
  } catch (error) {
    console.error('Erro ao atualizar preferências do usuário:', error);
    throw new Error('Falha ao atualizar preferências');
  }
};

/**
 * Busca preferências do usuário
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    // Tentar buscar do localStorage primeiro
    const localPrefs = localStorage.getItem(`user_preferences_${userId}`);
    if (localPrefs) {
      return JSON.parse(localPrefs);
    }

    // Buscar do banco de dados
    await supabase
      .from('auth_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Retornar preferências padrão se não encontrar
    const defaultPreferences: UserPreferences = {
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

    return defaultPreferences;
  } catch (error) {
    console.error('Erro ao buscar preferências do usuário:', error);
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
  }
};

/**
 * Salva progresso do módulo
 */
export const saveModuleProgress = async (
  userId: string,
  moduleId: string,
  progress: number,
  completedSections: string[] = [],
  bookmarks: string[] = []
): Promise<void> => {
  try {
    // Armazenar progresso em localStorage como fallback
    const progressData: ModuleProgress = {
      moduleId,
      userId,
      progress,
      lastAccessed: new Date().toISOString(),
      completedSections,
      bookmarks,
    };

    localStorage.setItem(`module_progress_${userId}_${moduleId}`, JSON.stringify(progressData));

    // Aqui você pode implementar persistência no banco de dados
    // se tiver uma tabela específica para progresso de módulos
    console.log('Progresso do módulo salvo:', progressData);
  } catch (error) {
    console.error('Erro ao salvar progresso do módulo:', error);
    throw new Error('Falha ao salvar progresso do módulo');
  }
};

/**
 * Busca progresso do módulo
 */
export const getModuleProgress = async (
  userId: string,
  moduleId: string
): Promise<ModuleProgress | null> => {
  try {
    const progressData = localStorage.getItem(`module_progress_${userId}_${moduleId}`);
    if (progressData) {
      return JSON.parse(progressData);
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar progresso do módulo:', error);
    return null;
  }
};

/**
 * Atualiza métricas do sistema
 */
export const updateSystemMetrics = async (): Promise<void> => {
  try {
    // Esta função pode ser chamada periodicamente para atualizar métricas
    // Por exemplo, através de um cron job ou webhook
    
    // Buscar dados atuais
    const [
      { count: totalUsers },
      { count: activeSessions },
      { count: totalModules },
      { count: totalAccesses },
    ] = await Promise.all([
      supabase.from('auth.users').select('*', { count: 'exact', head: true }),
      supabase.from('user_sessions').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
      supabase.from('frontend_modules').select('*', { count: 'exact', head: true }),
      supabase.from('resource_access_log').select('*', { count: 'exact', head: true }),
    ]);

    // Aqui você pode salvar essas métricas em uma tabela específica
    // ou usar para atualizar dashboards em tempo real
    console.log('Métricas atualizadas:', {
      totalUsers: totalUsers || 0,
      activeSessions: activeSessions || 0,
      totalModules: totalModules || 0,
      totalAccesses: totalAccesses || 0,
    });
  } catch (error) {
    console.error('Erro ao atualizar métricas do sistema:', error);
    throw new Error('Falha ao atualizar métricas');
  }
};

/**
 * Sincroniza dados offline-online
 */
export const syncOfflineData = async (userId: string): Promise<void> => {
  try {
    // Buscar dados offline do localStorage
    const offlineData = localStorage.getItem(`offline_data_${userId}`);
    if (!offlineData) return;

    const data = JSON.parse(offlineData);
    
    // Sincronizar cada item offline
    for (const item of data) {
      try {
        if (item.type === 'module_access') {
          await supabase
            .from('resource_access_log')
            .insert([item.data]);
        }
        // Adicionar outros tipos de sincronização conforme necessário
      } catch (error) {
        console.error('Erro ao sincronizar item:', item, error);
      }
    }

    // Limpar dados offline após sincronização bem-sucedida
    localStorage.removeItem(`offline_data_${userId}`);
  } catch (error) {
    console.error('Erro ao sincronizar dados offline:', error);
    throw new Error('Falha ao sincronizar dados offline');
  }
};

/**
 * Armazena dados offline
 */
export const storeOfflineData = (userId: string, type: string, data: any): void => {
  try {
    const offlineData = JSON.parse(localStorage.getItem(`offline_data_${userId}`) || '[]');
    offlineData.push({
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(`offline_data_${userId}`, JSON.stringify(offlineData));
  } catch (error) {
    console.error('Erro ao armazenar dados offline:', error);
  }
};
