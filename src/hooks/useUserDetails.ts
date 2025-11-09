import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UserDetails {
  user_id: string;
  nome: string;
  email: string;
  status: string;
  ultimo_login: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  data_concessao: string;
  data_expiracao: string | null;
}

type AccessLevel = 'admin' | 'gestor' | 'visualizador';

export interface UserProjectAccess {
  project_id: string;
  project_name: string;
  project_slug: string;
  access_level: AccessLevel;
  created_at: string;
}

export const useUserDetails = (userId: string | undefined) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userProjectAccess, setUserProjectAccess] = useState<UserProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar informações básicas do usuário
      const { data: basicInfo, error: basicError } = await supabase.rpc('get_user_basic_info', {
        _user_id: userId
      });

      if (basicError) throw basicError;

      if (basicInfo && basicInfo.length > 0) {
        setUserDetails(basicInfo[0]);
      } else {
        throw new Error('Usuário não encontrado');
      }

      // Buscar roles do usuário
      const { data: rolesData, error: rolesError } = await supabase
        .from('rbac_auth_user_role')
        .select(`
          ativo,
          data_concessao,
          data_expiracao,
          rbac_auth_role:role_id (
            id,
            nome,
            descricao,
            cor
          )
        `)
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map(role => ({
        id: role.auth_role?.id || '',
        nome: role.auth_role?.nome || '',
        descricao: role.auth_role?.descricao || null,
        cor: role.auth_role?.cor || '#6366f1',
        ativo: role.ativo,
        data_concessao: role.data_concessao,
        data_expiracao: role.data_expiracao,
      })) || [];

      setUserRoles(roles);

      // Buscar acessos a MÓDULOS (queries separadas para evitar nested join)
      // 1. Buscar os acessos do usuário
      const { data: accessData, error: accessError } = await supabase
        .from('rbac_user_module_access')
        .select('module_id, nivel_acesso, created_at, ativo')
        .eq('user_id', userId)
        .eq('ativo', true);

      if (accessError) throw accessError;

      if (!accessData || accessData.length === 0) {
        setUserProjectAccess([]);
      } else {
        // 2. Buscar os detalhes dos módulos
        const moduleIds = accessData.map(a => a.module_id);
        const { data: modulesData, error: modulesError } = await supabase
          .from('rbac_modules')
          .select('id, nome, slug')
          .in('id', moduleIds);

        if (modulesError) throw modulesError;

        // 3. Montar mapa de módulos
        const modulesMap = new Map(modulesData?.map(m => [m.id, m]) || []);

        // 4. Combinar os dados
        const projectAccess = accessData.map(access => ({
          project_id: access.module_id,
          project_name: modulesMap.get(access.module_id)?.nome || '',
          project_slug: modulesMap.get(access.module_id)?.slug || '',
          access_level: access.nivel_acesso as AccessLevel,
          created_at: access.created_at,
        }));

        setUserProjectAccess(projectAccess);
      }

    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userId.trim() !== '') {
      fetchUserDetails();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const updateProjectAccess = async (
    projectId: string,
    grantAccess: boolean,
    accessLevel?: AccessLevel
  ) => {
    if (!userId) return false;

    try {
      // USAR A FUNÇÃO CORRETA: update_user_module_access (não update_user_project_access)
      const { error } = await supabase.rpc('update_user_module_access', {
        _user_id: userId,
        _module_id: projectId, // Aqui agora é module_id
        _access_level: accessLevel || 'visualizador',
        _grant_access: grantAccess
      });

      if (error) throw error;

      // Recarregar dados após a atualização
      await fetchUserDetails();

      toast({
        title: "Sucesso",
        description: grantAccess 
          ? "Acesso ao módulo concedido com sucesso"
          : "Acesso ao módulo removido com sucesso",
      });

      return true;
    } catch (err: any) {
      console.error('Error updating module access:', err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao atualizar acesso do usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    userDetails,
    userRoles,
    userProjectAccess,
    loading,
    error,
    refetch: fetchUserDetails,
    updateProjectAccess,
  };
};