import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  nome: string;
  descricao: string | null;
  slug: string;
  status: string;
  nivel_acesso: 'admin' | 'gestor' | 'visualizador';
}

export interface ProjectModule {
  id: string;
  project_id?: string;
  nome: string;
  slug: string;
  icone: string | null;
  rota: string;
  ordem: number;
  ativo: boolean;
  descricao?: string | null;
  status?: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_user_projects');
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, error, refetch: fetchProjects };
};

export const useProjectModules = (projectId: string | null) => {
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = async () => {
    if (!projectId) {
      setModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_project_modules_with_details', { project_id_param: projectId });
      
      if (error) throw error;
      
      setModules(data || []);
    } catch (err: any) {
      console.error('Error fetching project modules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [projectId]);

  return { modules, loading, error, refetch: fetchModules };
};