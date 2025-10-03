import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type ResourceAccessLog = Database['public']['Tables']['resource_access_log']['Row'];
type UserSession = Database['public']['Tables']['user_sessions']['Row'];
type FrontendModule = Database['public']['Tables']['frontend_modules']['Row'];

export interface ActivityWithModule extends ResourceAccessLog {
  module?: FrontendModule;
}

export interface SessionWithModule extends UserSession {
  module?: FrontendModule;
}

export interface RecentActivity {
  id: string;
  type: 'access' | 'session';
  action: string;
  resourcePath: string;
  moduleName?: string;
  moduleDisplayName?: string;
  timestamp: string;
  success: boolean;
  metadata?: any;
}

/**
 * Busca atividades recentes do usuário
 */
export const fetchRecentActivities = async (userId?: string, limit: number = 10): Promise<RecentActivity[]> => {
  let query = supabase
    .from('resource_access_log')
    .select(`
      *,
      module:frontend_modules(module_name, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    throw new Error(`Falha ao carregar atividades: ${error.message}`);
  }

  // Transformar os dados para o formato esperado
  const activities: RecentActivity[] = (data || []).map(item => ({
    id: item.id,
    type: 'access' as const,
    action: item.action,
    resourcePath: item.resource_path,
    moduleName: item.module?.module_name,
    moduleDisplayName: item.module?.display_name,
    timestamp: item.created_at,
    success: item.success,
    metadata: item.metadata,
  }));

  return activities;
};

/**
 * Busca sessões ativas do usuário
 */
export const fetchActiveSessions = async (userId?: string): Promise<SessionWithModule[]> => {
  let query = supabase
    .from('user_sessions')
    .select(`
      *,
      module:frontend_modules(module_name, display_name)
    `)
    .eq('status', 'ativo')
    .order('last_activity', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar sessões ativas:', error);
    throw new Error(`Falha ao carregar sessões: ${error.message}`);
  }

  return data || [];
};

/**
 * Busca histórico de acessos a recursos
 */
export const fetchResourceAccessHistory = async (
  userId?: string,
  resourceType?: string,
  limit: number = 50
): Promise<ActivityWithModule[]> => {
  let query = supabase
    .from('resource_access_log')
    .select(`
      *,
      module:frontend_modules(module_name, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar histórico de acessos:', error);
    throw new Error(`Falha ao carregar histórico: ${error.message}`);
  }

  return data || [];
};

/**
 * Busca estatísticas de atividade
 */
export const fetchActivityStats = async (userId?: string): Promise<{
  totalAccesses: number;
  successfulAccesses: number;
  failedAccesses: number;
  activeSessions: number;
  lastActivity?: string;
}> => {
  // Buscar estatísticas de acessos
  let accessQuery = supabase
    .from('resource_access_log')
    .select('success, created_at');

  if (userId) {
    accessQuery = accessQuery.eq('user_id', userId);
  }

  const { data: accessData, error: accessError } = await accessQuery;

  if (accessError) {
    console.error('Erro ao buscar estatísticas de acesso:', accessError);
    throw new Error(`Falha ao carregar estatísticas: ${accessError.message}`);
  }

  // Buscar sessões ativas
  let sessionQuery = supabase
    .from('user_sessions')
    .select('id')
    .eq('status', 'ativo');

  if (userId) {
    sessionQuery = sessionQuery.eq('user_id', userId);
  }

  const { data: sessionData, error: sessionError } = await sessionQuery;

  if (sessionError) {
    console.error('Erro ao buscar sessões ativas:', sessionError);
    throw new Error(`Falha ao carregar sessões: ${sessionError.message}`);
  }

  const totalAccesses = accessData?.length || 0;
  const successfulAccesses = accessData?.filter(a => a.success).length || 0;
  const failedAccesses = totalAccesses - successfulAccesses;
  const activeSessions = sessionData?.length || 0;
  
  // Última atividade
  const sortedAccessData = accessData?.toSorted((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastActivity = sortedAccessData?.length > 0 
    ? sortedAccessData[0].created_at
    : undefined;

  return {
    totalAccesses,
    successfulAccesses,
    failedAccesses,
    activeSessions,
    lastActivity,
  };
};

/**
 * Registra acesso a um recurso
 */
export const logResourceAccess = async (
  userId: string,
  resourceType: string,
  resourcePath: string,
  action: string,
  success: boolean = true,
  metadata?: any
): Promise<void> => {
  const { error } = await supabase
    .from('resource_access_log')
    .insert([{
      user_id: userId,
      resource_type: resourceType,
      resource_path: resourcePath,
      action,
      success,
      metadata,
    }]);

  if (error) {
    console.error('Erro ao registrar acesso:', error);
    throw new Error(`Falha ao registrar acesso: ${error.message}`);
  }
};
