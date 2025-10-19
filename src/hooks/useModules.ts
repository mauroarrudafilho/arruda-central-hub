import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Module = Database['public']['Tables']['rbac_modules']['Row'];
type UserModuleAccess = Database['public']['Tables']['rbac_user_module_access']['Row'];

export interface ModuleWithAccess extends Module {
  nivel_acesso?: string;
  user_access?: boolean;
}

export interface ModuleStats {
  id: string;
  module_id: string;
  data: string;
  acessos: number;
  usuarios_unicos: number;
  tempo_medio_sessao: number | null;
  erros: number;
}

export const useModules = () => {
  const [modules, setModules] = useState<ModuleWithAccess[]>([]);
  const [userModules, setUserModules] = useState<ModuleWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os módulos (para admins)
  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rbac_modules')
        .select(`
          *,
          user_module_access!inner(
            user_id,
            nivel_acesso,
            ativo
          )
        `)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setModules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar módulos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar módulos do usuário atual
  const fetchUserModules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_modules');

      if (error) throw error;
      setUserModules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar módulos do usuário');
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar se usuário tem acesso ao módulo
  const checkModuleAccess = useCallback(async (moduleSlug: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('user_has_module_access', {
          _user_id: (await supabase.auth.getUser()).data.user?.id,
          _module_slug: moduleSlug
        });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Erro ao verificar acesso ao módulo:', err);
      return false;
    }
  }, []);

  // Registrar acesso ao módulo
  const recordModuleAccess = useCallback(async (moduleSlug: string) => {
    try {
      const { error } = await supabase
        .rpc('record_module_access', {
          _module_slug: moduleSlug
        });

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao registrar acesso ao módulo:', err);
    }
  }, []);

  // Conceder acesso a módulo para usuário
  const grantModuleAccess = async (userId: string, moduleId: string, accessLevel: string) => {
    try {
      const { data, error } = await supabase
        .from('rbac_user_module_access')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          nivel_acesso: accessLevel,
          concedido_por: (await supabase.auth.getUser()).data.user?.id,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar módulos do usuário
      await fetchUserModules();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conceder acesso ao módulo');
      throw err;
    }
  };

  // Remover acesso a módulo
  const revokeModuleAccess = async (userId: string, moduleId: string) => {
    try {
      const { error } = await supabase
        .from('rbac_user_module_access')
        .update({ ativo: false })
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (error) throw error;
      
      // Recarregar módulos do usuário
      await fetchUserModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover acesso ao módulo');
      throw err;
    }
  };

  // Criar novo módulo
  const createModule = async (module: {
    nome: string;
    slug: string;
    descricao?: string;
    icone?: string;
    rota?: string;
    url_externa?: string;
    status?: string;
    categoria?: string;
    organizacao_id?: string;
    categoria?: string;
    ordem?: number;
    versao?: string;
    desenvolvedor?: string;
    configuracoes?: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('rbac_modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar lista de módulos
      await fetchModules();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar módulo');
      throw err;
    }
  };

  // Atualizar módulo
  const updateModule = async (id: string, updates: Partial<Module>) => {
    try {
      const { data, error } = await supabase
        .from('rbac_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar lista de módulos
      await fetchModules();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar módulo');
      throw err;
    }
  };

  // Desativar módulo
  const deactivateModule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rbac_modules')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      
      // Recarregar lista de módulos
      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar módulo');
      throw err;
    }
  };

  // Buscar estatísticas de módulo
  const getModuleStats = async (moduleId: string, days: number = 30) => {
    try {
      const { data, error } = await supabase
        .from('rbac_module_stats')
        .select('*')
        .eq('module_id', moduleId)
        .gte('data', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('data', { ascending: false });

      if (error) throw error;
      return data as ModuleStats[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas do módulo');
      return [];
    }
  };

  // Filtrar módulos por status
  const getModulesByStatus = (status: string) => {
    return modules.filter(module => module.status === status);
  };

  // Filtrar módulos por categoria
  const getModulesByCategory = (category: string) => {
    return modules.filter(module => module.categoria === category);
  };

  // Buscar módulo por slug
  const getModuleBySlug = (slug: string) => {
    return modules.find(module => module.slug === slug);
  };

  useEffect(() => {
    fetchUserModules();
  }, [fetchUserModules]);

  return {
    modules,
    userModules,
    loading,
    error,
    fetchModules,
    fetchUserModules,
    checkModuleAccess,
    recordModuleAccess,
    grantModuleAccess,
    revokeModuleAccess,
    createModule,
    updateModule,
    deactivateModule,
    getModuleStats,
    getModulesByStatus,
    getModulesByCategory,
    getModuleBySlug,
  };
};