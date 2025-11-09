import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { securityLogger } from '@/lib/security-logger';

interface Tenant {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  configuracoes?: Record<string, any>;
  dominio_personalizado?: string;
  tema_personalizado?: Record<string, any>;
  limite_usuarios?: number;
  plano?: 'basico' | 'premium' | 'enterprise';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, tenantSlug?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string, tenantSlug?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  switchTenant: (tenantId: string) => Promise<{ error: any }>;
  refreshTenantContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);

  // Função para carregar contexto do tenant
  const loadTenantContext = async (userId: string) => {
    try {
      // Buscar tenant atual do usuário
      const { data: userTenant, error: tenantError } = await supabase
        .rpc('get_user_organization', { _user_id: userId });

      if (tenantError) {
        console.error('Error loading user tenant:', tenantError);
        return;
      }

      if (userTenant && userTenant.length > 0) {
        const tenant = userTenant[0];
        setCurrentTenant({
          id: tenant.id,
          nome: tenant.nome,
          slug: tenant.slug,
          descricao: tenant.descricao,
        });
      }

      // Buscar todos os tenants disponíveis (para admins)
      const { data: allTenants, error: allTenantsError } = await supabase
        .from('organizations')
        .select('*')
        .eq('ativo', true);

      if (!allTenantsError && allTenants) {
        setAvailableTenants(allTenants);
      }

    } catch (error) {
      console.error('Error loading tenant context:', error);
    }
  };

  // Função para trocar de tenant
  const switchTenant = async (tenantId: string) => {
    try {
      if (!user) {
        return { error: { message: 'User not authenticated' } };
      }

      // Verificar se usuário tem acesso ao tenant
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('user_belongs_to_organization', {
          _user_id: user.id,
          _organization_slug: tenantId
        });

      if (accessError || !hasAccess) {
        return { error: { message: 'Access denied to this tenant' } };
      }

      // Atualizar perfil do usuário com novo tenant
      const { error: updateError } = await supabase
        .from('auth_profile')
        .update({ organizacao_id: tenantId })
        .eq('user_id', user.id);

      if (updateError) {
        return { error: updateError };
      }

      // Recarregar contexto do tenant
      await loadTenantContext(user.id);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Função para recarregar contexto do tenant
  const refreshTenantContext = async () => {
    if (user) {
      await loadTenantContext(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status and load tenant context
        if (session?.user) {
          setTimeout(async () => {
            try {
              // Check admin status
              const { data, error } = await supabase
                .rpc('user_is_admin', { user_id: session.user.id });
              
              if (!error) {
                setIsAdmin(data || false);
              } else {
                // Fallback: check directly in the database
                const { data: roleData } = await supabase
                  .from('rbac_auth_user_role')
                  .select('role_id, rbac_auth_role!inner(nome)')
                  .eq('user_id', session.user.id)
                  .eq('ativo', true)
                  .single();
                
                setIsAdmin(roleData?.rbac_auth_role?.nome === 'admin');
              }

              // Load tenant context
              await loadTenantContext(session.user.id);

            } catch (err) {
              console.error('Error checking admin status or loading tenant:', err);
              setIsAdmin(false);
            }
          }, 100);
        } else {
          setIsAdmin(false);
          setCurrentTenant(null);
          setAvailableTenants([]);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        // Se tenantSlug foi especificado, verificar se usuário pertence a ele
        if (tenantSlug) {
          const { data: belongsToTenant, error: tenantError } = await supabase
            .rpc('user_belongs_to_organization', {
              _user_id: data.user.id,
              _organization_slug: tenantSlug
            });

          if (tenantError || !belongsToTenant) {
            await supabase.auth.signOut();
            return { error: { message: 'User does not belong to the specified tenant' } };
          }
        }

        securityLogger.log('login_success', { 
          userId: data.user.id, 
          email,
          tenantSlug 
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
          tenantSlug 
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

  const signOut = async () => {
    try {
      setLoading(true);
      
      if (user) {
        securityLogger.log('logout', { userId: user.id });
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

      // Clear tenant context
      setCurrentTenant(null);
      setAvailableTenants([]);
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    currentTenant,
    availableTenants,
    switchTenant,
    refreshTenantContext,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};









