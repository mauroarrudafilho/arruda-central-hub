import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { securityLogger } from '@/lib/security-logger';

// Nota: rbac_auth_user_role não está nos tipos gerados do Supabase
// Usamos @ts-expect-error para contornar isso temporariamente

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
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

  useEffect(() => {
    // Timeout de segurança para evitar travamento infinito
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 segundos máximo

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] onAuthStateChange event:', event, 'session:', !!session);
        try {
        setSession(session);
        setUser(session?.user ?? null);
          console.log('[useAuth] Session and user set:', { hasSession: !!session, hasUser: !!session?.user });
        
          // Check admin status - verificação direta e confiável
        if (session?.user) {
            try {
              console.log('[useAuth] Checking admin status for user:', session.user.id);
              
              // Método 1: Tentar RPC primeiro (mais rápido) com timeout curto
              let adminCheckResult = false;
              
              try {
                const rpcPromise = supabase.rpc('is_admin', { _user_id: session.user.id });
                const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => 
                  setTimeout(() => resolve({ data: null, error: { message: 'RPC timeout' } }), 2000)
                );
                
                const rpcResponse = await Promise.race([rpcPromise, timeoutPromise]);
                
                console.log('[useAuth] RPC response:', { 
                  hasData: !!rpcResponse.data, 
                  dataValue: rpcResponse.data,
                  hasError: !!rpcResponse.error,
                  errorMessage: rpcResponse.error?.message 
                });
                
                const rpcResult = rpcResponse.data;
                const rpcError = rpcResponse.error;
                
                console.log('[useAuth] RPC parsed:', { 
                  rpcResult, 
                  rpcError: rpcError?.message || 'none', 
                  type: typeof rpcResult,
                  isTrue: rpcResult === true,
                  isTruthy: !!rpcResult
                });
                
                if (!rpcError && rpcResult === true) {
                  console.log('[useAuth] User is admin (via RPC)');
                  adminCheckResult = true;
                } else {
                  console.log('[useAuth] RPC failed or returned false, trying fallback. Error:', rpcError?.message || 'No error, but result is not true');
                  // Método 2: Fallback - verificação direta na tabela (mais confiável) com timeout
                  // Usar query simples sem join para evitar problemas de RLS
                  try {
                    console.log('[useAuth] Starting fallback query for user:', session.user.id);
                    
                    // Primeiro, buscar apenas os role_ids do usuário (sem join)
                    const userRolesPromise = supabase
                      // @ts-expect-error - rbac_auth_user_role não está nos tipos gerados
                      .from('rbac_auth_user_role')
                      .select('role_id')
                      .eq('user_id', session.user.id)
                      .eq('ativo', true);
                    
                    const fallbackTimeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => 
                      setTimeout(() => resolve({ data: null, error: { message: 'Fallback query timeout' } }), 3000)
                    );
                    
                    const userRolesResponse = await Promise.race([userRolesPromise, fallbackTimeoutPromise]);
                    
                    console.log('[useAuth] User roles response:', { 
                      hasData: !!userRolesResponse.data, 
                      dataLength: userRolesResponse.data?.length || 0,
                      error: userRolesResponse.error?.message || 'none'
                    });
                    
                    if (!userRolesResponse.error && userRolesResponse.data && userRolesResponse.data.length > 0) {
                      const roleIds = userRolesResponse.data.map((ur: { role_id: string }) => ur.role_id);
                      console.log('[useAuth] Found role IDs:', roleIds);
                      
                      // Agora buscar os nomes dos roles (todos podem ver roles)
                      const rolesPromise = supabase
                        .from('rbac_auth_role')
                        .select('id, nome, ativo')
                        .in('id', roleIds)
                        .eq('ativo', true);
                      
                      const rolesTimeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => 
                        setTimeout(() => resolve({ data: null, error: { message: 'Roles query timeout' } }), 3000)
                      );
                      
                      const rolesResponse = await Promise.race([rolesPromise, rolesTimeoutPromise]);
                      
                      console.log('[useAuth] Roles response:', { 
                        hasData: !!rolesResponse.data, 
                        dataLength: rolesResponse.data?.length || 0,
                        error: rolesResponse.error?.message || 'none',
                        roles: rolesResponse.data
                      });
                      
                      if (!rolesResponse.error && rolesResponse.data) {
                        const hasAdminRole = rolesResponse.data.some(
                          (role: { nome?: string; ativo?: boolean }) => role.nome === 'admin' && role.ativo === true
                        );
                        console.log('[useAuth] Has admin role (via fallback):', hasAdminRole);
                        adminCheckResult = hasAdminRole;
                      } else {
                        console.log('[useAuth] Could not fetch roles. Error:', rolesResponse.error?.message);
                        adminCheckResult = false;
                      }
                    } else {
                      console.log('[useAuth] No user roles found. Error:', userRolesResponse.error?.message);
                      adminCheckResult = false;
                    }
                  } catch (fallbackErr) {
                    console.error('[useAuth] Fallback query error:', fallbackErr);
                    adminCheckResult = false;
                  }
                }
              } catch (err) {
                console.error('[useAuth] Error in admin check, trying fallback:', err);
                // Se RPC falhar completamente, tentar fallback simplificado
                try {
                  // @ts-expect-error - rbac_auth_user_role não está nos tipos gerados
                  const { data: userRoles, error: userRolesError } = await supabase
                    .from('rbac_auth_user_role')
                    .select('role_id')
                    .eq('user_id', session.user.id)
                    .eq('ativo', true);
                  
                  if (!userRolesError && userRoles && userRoles.length > 0) {
                    const roleIds = userRoles.map((ur: { role_id: string }) => ur.role_id);
                    const { data: roles, error: rolesError } = await supabase
                      .from('rbac_auth_role')
                      .select('id, nome, ativo')
                      .in('id', roleIds)
                      .eq('ativo', true);
                    
                    if (!rolesError && roles) {
                      const hasAdminRole = roles.some(
                        (role: { nome?: string; ativo?: boolean }) => role.nome === 'admin' && role.ativo === true
                      );
                      adminCheckResult = hasAdminRole;
                    }
                  }
                } catch (fallbackErr) {
                  console.error('[useAuth] Fallback also failed:', fallbackErr);
                  adminCheckResult = false;
                }
              }
              
              console.log('[useAuth] Final admin check result:', adminCheckResult);
              setIsAdmin(adminCheckResult);
              console.log('[useAuth] isAdmin state set to:', adminCheckResult);
            } catch (err) {
              console.error('[useAuth] Error checking admin status:', err);
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
          setIsAdmin(false);
        } finally {
          console.log('[useAuth] Setting loading to false (onAuthStateChange)');
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    );

    // Verificar sessão existente de forma não-bloqueante
    // Usar Promise.race para garantir que sempre retorne
    console.log('[useAuth] Getting existing session...');
    
    Promise.race([
      supabase.auth.getSession(),
      new Promise<{ data: { session: null } }>((resolve) => 
        setTimeout(() => resolve({ data: { session: null } }), 3000)
      )
    ])
      .then(async ({ data: { session } }) => {
        console.log('[useAuth] Session retrieved:', !!session);
        if (session) {
          setSession(session);
          setUser(session.user ?? null);
          
          // Verificar admin status para sessão existente
          if (session.user) {
            try {
              console.log('[useAuth] Checking admin status for existing session user:', session.user.id);
              // Método 1: Tentar RPC primeiro
              const { data: rpcResult, error: rpcError } = await supabase
                .rpc('is_admin', { _user_id: session.user.id });
              
              console.log('[useAuth] getSession RPC result:', { rpcResult, rpcError });
              
              if (!rpcError && rpcResult === true) {
                console.log('[useAuth] User is admin (via RPC in getSession)');
                setIsAdmin(true);
              } else {
                console.log('[useAuth] getSession RPC failed, trying fallback');
                // Método 2: Fallback - verificação direta na tabela
                // @ts-expect-error - rbac_auth_user_role não está nos tipos gerados
                const { data: roleData, error: roleError } = await supabase
                  .from('rbac_auth_user_role')
                  .select(`
                    role_id,
                    rbac_auth_role!inner(nome, ativo)
                  `)
                  .eq('user_id', session.user.id)
                  .eq('ativo', true);
                
                if (!roleError && roleData) {
                  const hasAdminRole = roleData.some(
                    (ur: { rbac_auth_role?: { nome?: string; ativo?: boolean } }) => 
                      ur.rbac_auth_role?.nome === 'admin' && ur.rbac_auth_role?.ativo === true
                  );
                  setIsAdmin(hasAdminRole);
                } else {
                  setIsAdmin(false);
                }
              }
            } catch (err) {
              console.error('[useAuth] Error checking admin status on initial load:', err);
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(false);
          }
        } else {
          console.log('[useAuth] No session found');
          setIsAdmin(false);
        }
        
        console.log('[useAuth] Setting loading to false (getSession)');
        clearTimeout(loadingTimeout);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useAuth] Error getting session:', err);
        clearTimeout(loadingTimeout);
      setLoading(false);
        setIsAdmin(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log de tentativa de login falhada
        await securityLogger.logLoginAttempt(email, false, error.message);
        
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Log de login bem-sucedido
        await securityLogger.logLoginAttempt(email, true);
        
        // Log de sessão criada
        await securityLogger.log({
          user_id: data.user?.id,
          event_type: 'login_success',
          severity: 'low',
          description: `Login realizado com sucesso para ${email}`,
          action: 'login',
          success: true,
          metadata: { 
            email,
            session_id: data.session?.access_token?.substring(0, 20) + '...'
          }
        });
      }

      return { error };
    } catch (err) {
      const error = err as Error;
      
      // Log de erro crítico
      await securityLogger.log({
        event_type: 'system_error',
        severity: 'high',
        description: `Erro crítico no sistema de login: ${error.message}`,
        action: 'login',
        success: false,
        error_message: error.message,
        metadata: { email }
      });
      
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      const redirectUrl = `${window.location.origin}/confirm-email`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: nome,
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }

      return { error };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
        }
      });

      if (error) {
        toast({
          title: "Erro ao reenviar confirmação",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Email reenviado",
        description: "Verifique sua caixa de entrada para o novo link de confirmação.",
      });

      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erro ao reenviar confirmação",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Log de logout
      await securityLogger.log({
        user_id: user?.id,
        event_type: 'logout',
        severity: 'low',
        description: `Logout realizado por ${user?.email}`,
        action: 'logout',
        success: true,
        metadata: { email: user?.email }
      });

      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (err) {
      console.error('Error signing out:', err);
      
      // Log de erro no logout
      await securityLogger.log({
        user_id: user?.id,
        event_type: 'system_error',
        severity: 'medium',
        description: `Erro durante logout: ${err}`,
        action: 'logout',
        success: false,
        error_message: err instanceof Error ? err.message : 'Erro desconhecido'
      });
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
    isAdmin,
  };
};

export { AuthContext };