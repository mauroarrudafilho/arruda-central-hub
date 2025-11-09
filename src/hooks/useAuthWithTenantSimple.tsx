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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, tenantSlug?: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, nome: string, tenantSlug?: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  switchTenant: (tenantId: string) => Promise<{ error: unknown }>;
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
      // Por enquanto, usar dados mockados até as migrações serem aplicadas
      const mockTenant: Tenant = {
        id: 'grupo-arruda-id',
        nome: 'Grupo Arruda',
        slug: 'grupo-arruda',
        descricao: 'Organização principal do Grupo Arruda'
      };

      setCurrentTenant(mockTenant);
      setAvailableTenants([mockTenant]);

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

      // Por enquanto, apenas simular a troca
      const tenant = availableTenants.find(t => t.id === tenantId);
      if (tenant) {
        setCurrentTenant(tenant);
        return { error: null };
      }

      return { error: { message: 'Tenant not found' } };
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









