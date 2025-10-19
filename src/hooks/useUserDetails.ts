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

      // Buscar acessos a projetos
      const { data: accessData, error: accessError } = await supabase
        .from('rbac_user_project_access')
        .select(`
          nivel_acesso,
          created_at,
          projects:project_id (
            id,
            nome,
            slug
          )
        `)
        .eq('user_id', userId);

      if (accessError) throw accessError;

      const projectAccess = accessData?.map(access => ({
        project_id: access.projects?.id || '',
        project_name: access.projects?.nome || '',
        project_slug: access.projects?.slug || '',
        access_level: access.nivel_acesso as AccessLevel,
        created_at: access.created_at,
      })) || [];

      setUserProjectAccess(projectAccess);

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
      const { error } = await supabase.rpc('update_user_project_access', {
        _user_id: userId,
        _project_id: projectId,
        _access_level: accessLevel || 'visualizador',
        _grant_access: grantAccess
      });

      if (error) throw error;

      // Recarregar dados após a atualização
      await fetchUserDetails();

      toast({
        title: "Sucesso",
        description: grantAccess 
          ? "Acesso ao projeto concedido com sucesso"
          : "Acesso ao projeto removido com sucesso",
      });

      return true;
    } catch (err: any) {
      console.error('Error updating project access:', err);
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