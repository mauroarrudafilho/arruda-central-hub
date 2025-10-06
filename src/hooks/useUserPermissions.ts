import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Permission {
  id: string;
  nome: string;
  descricao: string | null;
  modulo: string;
  acao: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  ativo: boolean;
  data_concessao: string;
  data_expiracao: string | null;
  granted_by: string | null;
  permission: Permission;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  ativo: boolean;
  created_at: string;
  permission: Permission;
}

export interface PermissionMatrix {
    [module: string]: {
      [action: string]: {
        hasPermission: boolean;
        source: 'role' | 'direct' | 'both';
        roles: string[];
        directGrant: boolean;
      };
    };
}

export interface PermissionOverride {
  user_id: string;
  permission_id: string;
  ativo: boolean;
  data_expiracao?: string;
  granted_by?: string;
}

export const useUserPermissions = (userId: string) => {
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar permissões diretas do usuário
  const fetchUserDirectPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('rbac_auth_user_permission')
        .select(`
          *,
          rbac_auth_permission (
            id,
            nome,
            descricao,
            modulo,
            acao,
            ativo,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('ativo', true);

      if (error) throw error;

      const formattedPermissions: UserPermission[] = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        permission_id: item.permission_id,
        ativo: item.ativo,
        data_concessao: item.data_concessao,
        data_expiracao: item.data_expiracao,
        granted_by: item.granted_by,
        permission: item.rbac_auth_permission
      })) || [];

      setUserPermissions(formattedPermissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar permissões diretas do usuário';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Buscar permissões via roles do usuário
  const fetchUserRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('rbac_auth_user_role')
        .select(`
          role_id,
          ativo,
          rbac_auth_role_permission (
            id,
            role_id,
            permission_id,
            ativo,
            created_at,
            rbac_auth_permission (
              id,
              nome,
              descricao,
              modulo,
              acao,
              ativo,
              created_at,
              updated_at
            )
          )
        `)
        .eq('user_id', userId)
        .eq('ativo', true);

      if (error) throw error;

      const formattedRolePermissions: RolePermission[] = [];
      
      data?.forEach(userRole => {
        if (userRole.ativo) {
          userRole.rbac_auth_role_permission?.forEach(rolePerm => {
            if (rolePerm.concedida) {
              formattedRolePermissions.push({
                id: rolePerm.id,
                role_id: rolePerm.role_id,
                permission_id: rolePerm.permission_id,
                ativo: rolePerm.concedida,
                created_at: rolePerm.created_at,
                permission: rolePerm.rbac_auth_permission
              });
            }
          });
        }
      });

      setRolePermissions(formattedRolePermissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar permissões via roles';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Buscar todas as permissões disponíveis
  const fetchAllPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('rbac_auth_permission')
        .select('*')
        .order('modulo, acao');

      if (error) throw error;
      setAllPermissions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar permissões disponíveis';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Construir matriz de permissões
  const buildPermissionMatrix = () => {
    const matrix: PermissionMatrix = {};

    // Processar permissões via roles
    rolePermissions.forEach(rolePerm => {
      const { modulo, acao } = rolePerm.permission;
      
      if (!matrix[modulo]) matrix[modulo] = {};
      if (!matrix[modulo][acao]) {
        matrix[modulo][acao] = {
          hasPermission: false,
          source: 'role',
          roles: [],
          directGrant: false
        };
      }

      matrix[modulo][acao].hasPermission = true;
      matrix[modulo][acao].source = 'role';
      matrix[modulo][acao].roles.push(rolePerm.role_id);
    });

    // Processar permissões diretas
    userPermissions.forEach(userPerm => {
      const { modulo, acao } = userPerm.permission;
      
      if (!matrix[modulo]) matrix[modulo] = {};
      if (!matrix[modulo][acao]) {
        matrix[modulo][acao] = {
          hasPermission: false,
          source: 'direct',
          roles: [],
          directGrant: false
        };
      }

      matrix[modulo][acao].hasPermission = true;
      matrix[modulo][acao].directGrant = true;
      
      if (matrix[modulo][acao].source === 'role') {
        matrix[modulo][acao].source = 'both';
      } else {
        matrix[modulo][acao].source = 'direct';
      }
    });

    setPermissionMatrix(matrix);
  };

  // Adicionar permissão direta ao usuário
  const addDirectPermission = async (permissionOverride: PermissionOverride) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('rbac_auth_user_permission')
        .insert([{
          user_id: permissionOverride.user_id,
          permission_id: permissionOverride.permission_id,
          ativo: permissionOverride.ativo,
          data_expiracao: permissionOverride.data_expiracao || null,
          granted_by: permissionOverride.granted_by || null,
          data_concessao: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissão adicionada com sucesso!",
      });

      // Recarregar permissões
      await fetchUserDirectPermissions();
      buildPermissionMatrix();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar permissão';
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

  // Remover permissão direta do usuário
  const removeDirectPermission = async (userPermissionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('rbac_auth_user_permission')
        .delete()
        .eq('id', userPermissionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissão removida com sucesso!",
      });

      // Recarregar permissões
      await fetchUserDirectPermissions();
      buildPermissionMatrix();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover permissão';
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

  // Ativar/desativar permissão direta
  const toggleDirectPermission = async (userPermissionId: string, ativo: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('rbac_auth_user_permission')
        .update({ ativo })
        .eq('id', userPermissionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Permissão ${ativo ? 'ativada' : 'desativada'} com sucesso!`,
      });

      // Recarregar permissões
      await fetchUserDirectPermissions();
      buildPermissionMatrix();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status da permissão';
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

  // Verificar se usuário tem permissão específica
  const hasPermission = (modulo: string, acao: string): boolean => {
    return permissionMatrix[modulo]?.[acao]?.hasPermission || false;
  };

  // Verificar se usuário tem permissão em módulo
  const hasModulePermission = (modulo: string): boolean => {
    return Object.keys(permissionMatrix[modulo] || {}).length > 0;
  };

  // Verificar se usuário tem permissão para ação específica
  const hasActionPermission = (modulo: string, acao: string): boolean => {
    return permissionMatrix[modulo]?.[acao]?.hasPermission || false;
  };

  // Buscar permissões por módulo
  const getPermissionsByModule = (modulo: string): Permission[] => {
    return allPermissions.filter(perm => perm.modulo === modulo);
  };

  // Buscar permissões por ação
  const getPermissionsByAction = (modulo: string, acao: string): Permission[] => {
    return allPermissions.filter(perm => perm.modulo === modulo && perm.acao === acao);
  };

  // Buscar permissões expiradas
  const getExpiredPermissions = (): UserPermission[] => {
    const now = new Date();
    return userPermissions.filter(perm => 
      perm.data_expiracao && new Date(perm.data_expiracao) < now
    );
  };

  // Buscar permissões que expiram em breve
  const getPermissionsExpiringSoon = (): UserPermission[] => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return userPermissions.filter(perm => 
      perm.data_expiracao && 
      new Date(perm.data_expiracao) > now && 
      new Date(perm.data_expiracao) <= sevenDaysFromNow
    );
  };

  // Buscar permissões conflitantes (via role e direta)
  const getConflictingPermissions = (): { permission: Permission; sources: string[] }[] => {
    const conflicts: { permission: Permission; sources: string[] }[] = [];
    
    Object.entries(permissionMatrix).forEach(([modulo, actions]) => {
      Object.entries(actions).forEach(([acao, permission]) => {
        if (permission.source === 'both') {
          const foundPermission = allPermissions.find(p => 
            p.modulo === modulo && p.acao === acao
          );
          
          if (foundPermission) {
            conflicts.push({
              permission: foundPermission,
              sources: ['role', 'direct']
            });
          }
        }
      });
    });

    return conflicts;
  };

  useEffect(() => {
    if (userId && userId.trim() !== '') {
      const loadPermissions = async () => {
        setLoading(true);
        await Promise.all([
          fetchUserDirectPermissions(),
          fetchUserRolePermissions(),
          fetchAllPermissions()
        ]);
        setLoading(false);
      };
      
      loadPermissions();
    } else {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userPermissions.length > 0 || rolePermissions.length > 0) {
      buildPermissionMatrix();
    }
  }, [userPermissions, rolePermissions]);

  return {
    userPermissions,
    rolePermissions,
    allPermissions,
    permissionMatrix,
    loading,
    error,
    fetchUserDirectPermissions,
    fetchUserRolePermissions,
    fetchAllPermissions,
    addDirectPermission,
    removeDirectPermission,
    toggleDirectPermission,
    hasPermission,
    hasModulePermission,
    hasActionPermission,
    getPermissionsByModule,
    getPermissionsByAction,
    getExpiredPermissions,
    getPermissionsExpiringSoon,
    getConflictingPermissions
  };
};
