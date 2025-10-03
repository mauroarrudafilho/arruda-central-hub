import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type FrontendModule = Database['public']['Tables']['frontend_modules']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

export interface ModuleWithProject extends FrontendModule {
  project?: Project;
}

export interface ModuleStats {
  totalModules: number;
  activeModules: number;
  inactiveModules: number;
  maintenanceModules: number;
}

/**
 * Busca todos os módulos frontend disponíveis
 */
export const fetchModules = async (): Promise<ModuleWithProject[]> => {
  const { data, error } = await supabase
    .from('frontend_modules')
    .select(`
      *,
      project:projects(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar módulos:', error);
    throw new Error(`Falha ao carregar módulos: ${error.message}`);
  }

  return data || [];
};

/**
 * Busca um módulo específico por ID
 */
export const fetchModuleById = async (id: string): Promise<ModuleWithProject | null> => {
  const { data, error } = await supabase
    .from('frontend_modules')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Módulo não encontrado
    }
    console.error('Erro ao buscar módulo:', error);
    throw new Error(`Falha ao carregar módulo: ${error.message}`);
  }

  return data;
};

/**
 * Busca módulos por projeto
 */
export const fetchModulesByProject = async (projectId: string): Promise<ModuleWithProject[]> => {
  const { data, error } = await supabase
    .from('frontend_modules')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar módulos por projeto:', error);
    throw new Error(`Falha ao carregar módulos do projeto: ${error.message}`);
  }

  return data || [];
};

/**
 * Busca módulos por status
 */
export const fetchModulesByStatus = async (status: 'ativo' | 'inativo' | 'manutencao'): Promise<ModuleWithProject[]> => {
  const { data, error } = await supabase
    .from('frontend_modules')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar módulos por status:', error);
    throw new Error(`Falha ao carregar módulos: ${error.message}`);
  }

  return data || [];
};

/**
 * Busca estatísticas dos módulos
 */
export const fetchModuleStats = async (): Promise<ModuleStats> => {
  const { data, error } = await supabase
    .from('frontend_modules')
    .select('status');

  if (error) {
    console.error('Erro ao buscar estatísticas dos módulos:', error);
    throw new Error(`Falha ao carregar estatísticas: ${error.message}`);
  }

  const stats: ModuleStats = {
    totalModules: data?.length || 0,
    activeModules: data?.filter(m => m.status === 'ativo').length || 0,
    inactiveModules: data?.filter(m => m.status === 'inativo').length || 0,
    maintenanceModules: data?.filter(m => m.status === 'manutencao').length || 0,
  };

  return stats;
};

/**
 * Busca todos os projetos disponíveis
 */
export const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'ativo')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar projetos:', error);
    throw new Error(`Falha ao carregar projetos: ${error.message}`);
  }

  return data || [];
};

/**
 * Busca um projeto específico por ID
 */
export const fetchProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Projeto não encontrado
    }
    console.error('Erro ao buscar projeto:', error);
    throw new Error(`Falha ao carregar projeto: ${error.message}`);
  }

  return data;
};


