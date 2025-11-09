import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface Project {
  id: string;
  nome: string;
  descricao: string | null;
  slug: string;
  status: string;
  nivel_acesso: 'admin' | 'gestor' | 'visualizador';
  tenant_id?: string;
}

export interface ProjectModule {
  id: string;
  project_id?: string;
  nome: string;
  slug: string;
  icone: string | null;
  rota: string | null;
  url_externa?: string | null;
  ordem: number;
  ativo: boolean;
  descricao?: string | null;
  status?: string;
  categoria?: string | null;
  tenant_id?: string;
}

export const useProjectsWithTenant = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTenant } = useTenant();

  const fetchProjects = async () => {
    if (!currentTenant) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar projetos do tenant atual
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          user_project_access!inner(
            nivel_acesso,
            user_id
          )
        `)
        .eq('user_project_access.user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'ativo');

      if (projectsError) {
        throw projectsError;
      }

      // Transformar dados para incluir nível de acesso
      const transformedProjects = projectsData?.map(project => ({
        id: project.id,
        nome: project.nome,
        descricao: project.descricao,
        slug: project.slug,
        status: project.status,
        nivel_acesso: project.user_project_access[0]?.nivel_acesso || 'visualizador',
        tenant_id: currentTenant.id,
      })) || [];

      setProjects(transformedProjects);

      // Buscar módulos dos projetos
      if (transformedProjects.length > 0) {
        const projectIds = transformedProjects.map(p => p.id);
        
        const { data: modulesData, error: modulesError } = await supabase
          .from('project_modules')
          .select('*')
          .in('project_id', projectIds)
          .eq('ativo', true)
          .order('ordem');

        if (modulesError) {
          throw modulesError;
        }

        const transformedModules = modulesData?.map(module => ({
          id: module.id,
          project_id: module.project_id,
          nome: module.nome,
          slug: module.slug,
          icone: module.icone,
          rota: module.rota,
          url_externa: module.url_externa,
          ordem: module.ordem,
          ativo: module.ativo,
          descricao: module.descricao,
          status: module.status,
          categoria: module.categoria,
          tenant_id: currentTenant.id,
        })) || [];

        setModules(transformedModules);
      }

    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'nivel_acesso' | 'tenant_id'>) => {
    if (!currentTenant) {
      throw new Error('Nenhum tenant selecionado');
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Criar projeto
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          tenant_id: currentTenant.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Adicionar acesso do usuário como admin
      const { error: accessError } = await supabase
        .from('user_project_access')
        .insert({
          user_id: user.user.id,
          project_id: newProject.id,
          nivel_acesso: 'admin',
        });

      if (accessError) throw accessError;

      // Recarregar projetos
      await fetchProjects();

      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('tenant_id', currentTenant?.id); // Garantir que só atualiza projetos do tenant atual

      if (error) throw error;

      // Recarregar projetos
      await fetchProjects();
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('tenant_id', currentTenant?.id); // Garantir que só deleta projetos do tenant atual

      if (error) throw error;

      // Recarregar projetos
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  const addModuleToProject = async (projectId: string, moduleData: Omit<ProjectModule, 'id' | 'project_id' | 'tenant_id'>) => {
    try {
      const { error } = await supabase
        .from('project_modules')
        .insert({
          ...moduleData,
          project_id: projectId,
          tenant_id: currentTenant?.id,
        });

      if (error) throw error;

      // Recarregar módulos
      await fetchProjects();
    } catch (err) {
      console.error('Error adding module to project:', err);
      throw err;
    }
  };

  const updateModule = async (moduleId: string, updates: Partial<ProjectModule>) => {
    try {
      const { error } = await supabase
        .from('project_modules')
        .update(updates)
        .eq('id', moduleId)
        .eq('tenant_id', currentTenant?.id); // Garantir que só atualiza módulos do tenant atual

      if (error) throw error;

      // Recarregar módulos
      await fetchProjects();
    } catch (err) {
      console.error('Error updating module:', err);
      throw err;
    }
  };

  const deleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('project_modules')
        .delete()
        .eq('id', moduleId)
        .eq('tenant_id', currentTenant?.id); // Garantir que só deleta módulos do tenant atual

      if (error) throw error;

      // Recarregar módulos
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting module:', err);
      throw err;
    }
  };

  // Recarregar quando o tenant mudar
  useEffect(() => {
    fetchProjects();
  }, [currentTenant?.id]);

  return {
    projects,
    modules,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    addModuleToProject,
    updateModule,
    deleteModule,
  };
};

export default useProjectsWithTenant;









