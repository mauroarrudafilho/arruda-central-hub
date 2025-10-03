import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UserRole {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  data_concessao: string;
  data_expiracao: string | null;
  role_id: string;
  user_id: string;
}

export interface AvailableRole {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleAssignment {
  user_id: string;
  role_id: string;
  data_expiracao?: string;
  ativo?: boolean;
}

export const useUserRoles = (userId: string) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar roles do usuário
  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('auth_user_role')
        .select(`
          *,
          auth_role (
            id,
            nome,
            descricao,
            cor,
            ativo,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('data_concessao', { ascending: false });

      if (error) throw error;

      const formattedRoles: UserRole[] = data?.map(item => ({
        id: item.id,
        nome: item.auth_role.nome,
        descricao: item.auth_role.descricao,
        cor: item.auth_role.cor,
        ativo: item.ativo,
        data_concessao: item.data_concessao,
        data_expiracao: item.data_expiracao,
        role_id: item.role_id,
        user_id: item.user_id
      })) || [];

      setUserRoles(formattedRoles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar roles do usuário';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar todos os roles disponíveis
  const fetchAvailableRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_role')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setAvailableRoles(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar roles disponíveis';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Adicionar role ao usuário
  const addRoleToUser = async (roleAssignment: RoleAssignment) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('auth_user_role')
        .insert([{
          user_id: roleAssignment.user_id,
          role_id: roleAssignment.role_id,
          data_expiracao: roleAssignment.data_expiracao || null,
          ativo: roleAssignment.ativo ?? true,
          data_concessao: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Role adicionado com sucesso!",
      });

      // Recarregar roles do usuário
      await fetchUserRoles();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar role';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remover role do usuário
  const removeRoleFromUser = async (userRoleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('auth_user_role')
        .delete()
        .eq('id', userRoleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Role removido com sucesso!",
      });

      // Recarregar roles do usuário
      await fetchUserRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover role';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Ativar/desativar role do usuário
  const toggleRoleStatus = async (userRoleId: string, ativo: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('auth_user_role')
        .update({ ativo })
        .eq('id', userRoleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Role ${ativo ? 'ativado' : 'desativado'} com sucesso!`,
      });

      // Recarregar roles do usuário
      await fetchUserRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status do role';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar data de expiração do role
  const updateRoleExpiration = async (userRoleId: string, dataExpiracao: string | null) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('auth_user_role')
        .update({ data_expiracao: dataExpiracao })
        .eq('id', userRoleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Data de expiração atualizada com sucesso!",
      });

      // Recarregar roles do usuário
      await fetchUserRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar data de expiração';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verificar se usuário tem role específico
  const hasRole = (roleName: string): boolean => {
    return userRoles.some(role => role.nome === roleName && role.ativo);
  };

  // Verificar se usuário tem qualquer role ativo
  const hasAnyActiveRole = (): boolean => {
    return userRoles.some(role => role.ativo);
  };

  // Buscar roles expirados
  const getExpiredRoles = (): UserRole[] => {
    const now = new Date();
    return userRoles.filter(role => 
      role.data_expiracao && new Date(role.data_expiracao) < now
    );
  };

  // Buscar roles que expiram em breve (próximos 7 dias)
  const getRolesExpiringSoon = (): UserRole[] => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return userRoles.filter(role => 
      role.data_expiracao && 
      new Date(role.data_expiracao) > now && 
      new Date(role.data_expiracao) <= sevenDaysFromNow
    );
  };

  useEffect(() => {
    if (userId && userId.trim() !== '') {
      fetchUserRoles();
      fetchAvailableRoles();
    } else {
      setLoading(false);
    }
  }, [userId]);

  return {
    userRoles,
    availableRoles,
    loading,
    error,
    fetchUserRoles,
    fetchAvailableRoles,
    addRoleToUser,
    removeRoleFromUser,
    toggleRoleStatus,
    updateRoleExpiration,
    hasRole,
    hasAnyActiveRole,
    getExpiredRoles,
    getRolesExpiringSoon
  };
};
