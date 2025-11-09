/**
 * Hook Consolidado de Autenticação RBAC
 * 
 * Consolida todos os fluxos de autenticação em um único hook:
 * - Login unificado com detecção automática de tenant
 * - Cadastro com auto-assign de role
 * - Verificação de permissões centralizadas
 * - Gestão de tenants unificada
 * 
 * ✅ Mantém compatibilidade com código existente
 * ✅ Usa novo sistema RBAC consolidado
 * ✅ Feature flag para transição gradual
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { securityLogger } from '@/lib/security-logger';

// Feature flag para controlar uso do novo sistema
const USE_V2_RBAC = process.env.VITE_USE_V2_RBAC === 'true' || false;

interface RBACAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: string | null;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  permissions: ScreenPermissions[];
  managedUsers: ManagedUser[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  accessLevel: 'read' | 'write' | 'admin';
}

interface ScreenPermissions {
  screenName: string;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

interface ManagedUser {
  userId: string;
  userName: string;
  userEmail: string;
}

interface RBACAuthContext extends RBACAuthState {
  signIn: (email: string, password: string, tenantSlug?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string, tenantSlug?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  switchTenant: (tenantSlug: string) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  refreshTenants: () => Promise<void>;
  refreshManagedUsers: () => Promise<void>;
  hasPermission: (screen: string, module: string, action: string) => boolean;
}

const RBACAuthContext = createContext<RBACAuthContext | undefined>(undefined);

export const useRBACAuth = () => {
  const context = useContext(RBACAuthContext);
  if (!context) {
    throw new Error('useRBACAuth must be used within RBACAuthProvider');
  }
  return context;
};

export const useRBACAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [permissions, setPermissions] = useState<ScreenPermissions[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const { toast } = useToast();

  // Função para carregar role do usuário
  const loadUserRole = async (userId: string) => {
    try {
      const functionName = USE_V2_RBAC ? 'get_user_role_v2' : 'get_user_role';
      const { data, error } = await supabase.rpc(functionName, { _user_id: userId });
      
      if (!error && data) {
        setUserRole(data);
        setIsAdmin(data === 'admin');
        return data;
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
    return null;
  };

  // Função para carregar tenants acessíveis
  const loadAvailableTenants = async (userId: string) => {
    try {
      const functionName = USE_V2_RBAC ? 'get_user_accessible_tenants_v2' : 'get_user_accessible_tenants';
      const { data, error } = await supabase.rpc(functionName, { _user_id: userId });
      
      if (!error && data) {
        const tenants: Tenant[] = data.map((t: any) => ({
          id: t.tenant_id,
          name: t.tenant_name,
          slug: t.tenant_slug,
          accessLevel: 'read' // Default, será atualizado se necessário
        }));
        setAvailableTenants(tenants);
        
        // Se não tem tenant atual, setar o primeiro
        if (!currentTenant && tenants.length > 0) {
          setCurrentTenant(tenants[0]);
        }
        
        return tenants;
      }
    } catch (error) {
      console.error('Error loading available tenants:', error);
    }
    return [];
  };

  // Função para carregar permissões de tela
  const loadScreenPermissions = async (userId: string) => {
    try {
      const functionName = USE_V2_RBAC ? 'get_user_screen_permissions_v2' : 'get_user_screen_permissions';
      const { data, error } = await supabase.rpc(functionName, { _user_id: userId });
      
      if (!error && data) {
        const perms: ScreenPermissions[] = data.map((p: any) => ({
          screenName: p.screen_name,
          moduleName: p.module_name,
          canView: p.can_view,
          canCreate: p.can_create,
          canEdit: p.can_edit,
          canDelete: p.can_delete,
          canApprove: p.can_approve,
        }));
        setPermissions(perms);
        return perms;
      }
    } catch (error) {
      console.error('Error loading screen permissions:', error);
    }
    return [];
  };

  // Função para carregar usuários gerenciados (se for gestor)
  const loadManagedUsers = async (userId: string, role: string) => {
    if (!['gestor', 'gestor_fornecedor'].includes(role)) {
      setManagedUsers([]);
      return [];
    }

    try {
      const functionName = USE_V2_RBAC ? 'get_managed_users_v2' : 'get_managed_users';
      const { data, error } = await supabase.rpc(functionName, { _manager_id: userId });
      
      if (!error && data) {
        const managed: ManagedUser[] = data.map((u: any) => ({
          userId: u.user_id,
          userName: u.user_name,
          userEmail: u.user_email,
        }));
        setManagedUsers(managed);
        return managed;
      }
    } catch (error) {
      console.error('Error loading managed users:', error);
    }
    return [];
  };

  // Listener de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Carregar dados do usuário
          const role = await loadUserRole(session.user.id);
          if (role) {
            await Promise.all([
              loadAvailableTenants(session.user.id),
              loadScreenPermissions(session.user.id),
              loadManagedUsers(session.user.id, role)
            ]);
          }
        } else {
          // Limpar dados quando deslogar
          setUserRole(null);
          setIsAdmin(false);
          setCurrentTenant(null);
          setAvailableTenants([]);
          setPermissions([]);
          setManagedUsers([]);
        }
        
        setLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função de login
  const signIn = async (email: string, password: string, tenantSlug?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        securityLogger.log('login_failed', { email, error: error.message });
        return { error };
      }

      if (data.user) {
        // Se tenantSlug foi especificado, verificar acesso
        if (tenantSlug) {
          const functionName = USE_V2_RBAC ? 'user_has_tenant_access_v2' : 'user_has_tenant_access';
          const tenantId = availableTenants.find(t => t.slug === tenantSlug)?.id;
          
          if (tenantId) {
            const { data: hasAccess, error: accessError } = await supabase.rpc(
              functionName,
              { _user_id: data.user.id, _tenant_id: tenantId }
            );

            if (accessError || !hasAccess) {
              await supabase.auth.signOut();
              return { error: { message: 'Usuário não tem acesso ao tenant especificado' } };
            }
          }
        }

        securityLogger.log('login_success', { 
          userId: data.user.id, 
          email,
          tenantSlug,
          usingV2: USE_V2_RBAC
        });
      }

      return { error: null };
    } catch (error) {
      securityLogger.log('login_error', { email, error });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Função de cadastro
  const signUp = async (email: string, password: string, nome: string, tenantSlug?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tenant_slug: tenantSlug
          }
        }
      });

      if (error) {
        securityLogger.log('signup_failed', { email, error: error.message });
        return { error };
      }

      if (data.user) {
        securityLogger.log('signup_success', { 
          userId: data.user.id, 
          email,
          tenantSlug,
          usingV2: USE_V2_RBAC
        });
      }

      return { error: null };
    } catch (error) {
      securityLogger.log('signup_error', { email, error });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      
      if (user) {
        securityLogger.log('logout', { userId: user.id, usingV2: USE_V2_RBAC });
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }

      // Limpar contexto
      setCurrentTenant(null);
      setAvailableTenants([]);
      setPermissions([]);
      setManagedUsers([]);
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para trocar de tenant
  const switchTenant = async (tenantSlug: string) => {
    const tenant = availableTenants.find(t => t.slug === tenantSlug);
    if (tenant) {
      setCurrentTenant(tenant);
      toast({
        title: "Tenant alterado",
        description: `Agora você está acessando: ${tenant.name}`,
      });
    }
  };

  // Funções de refresh
  const refreshPermissions = async () => {
    if (user) {
      await loadScreenPermissions(user.id);
    }
  };

  const refreshTenants = async () => {
    if (user) {
      await loadAvailableTenants(user.id);
    }
  };

  const refreshManagedUsers = async () => {
    if (user && userRole) {
      await loadManagedUsers(user.id, userRole);
    }
  };

  // Função helper para verificar permissão
  const hasPermission = (screen: string, module: string, action: string): boolean => {
    const permission = permissions.find(
      p => p.screenName === screen && p.moduleName === module
    );

    if (!permission) return false;

    switch (action) {
      case 'view': return permission.canView;
      case 'create': return permission.canCreate;
      case 'edit': return permission.canEdit;
      case 'delete': return permission.canDelete;
      case 'approve': return permission.canApprove;
      default: return false;
    }
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    userRole,
    currentTenant,
    availableTenants,
    permissions,
    managedUsers,
    signIn,
    signUp,
    signOut,
    switchTenant,
    refreshPermissions,
    refreshTenants,
    refreshManagedUsers,
    hasPermission,
  };
};

export const RBACAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useRBACAuthState();
  return <RBACAuthContext.Provider value={auth}>{children}</RBACAuthContext.Provider>;
};

/**
 * Hook de compatibilidade para migração gradual
 * 
 * Permite usar o novo sistema mantendo a mesma interface dos hooks antigos
 */
export const useAuth = () => {
  const rbacAuth = useRBACAuth();
  
  // Adapter pattern: expõe interface antiga usando sistema novo
  return {
    user: rbacAuth.user,
    session: rbacAuth.session,
    loading: rbacAuth.loading,
    signIn: rbacAuth.signIn,
    signUp: rbacAuth.signUp,
    signOut: rbacAuth.signOut,
    isAdmin: rbacAuth.isAdmin,
  };
};

/**
 * Hook de compatibilidade com tenant
 */
export const useAuthWithTenant = () => {
  const rbacAuth = useRBACAuth();
  
  return {
    ...rbacAuth,
    // Aliases para compatibilidade
    tenant: rbacAuth.currentTenant,
    setTenant: rbacAuth.switchTenant,
  };
};



