import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { securityLogger } from '@/lib/security-logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  adminChecked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: any }>;
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
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAdminStatus = async (userId: string) => {
      if (!isMounted) return;
      setAdminChecked(false);

      try {
        const { data, error } = await supabase.rpc('user_is_admin', { user_id: userId });

        if (!error) {
          console.log('[useAuth] isAdmin state set to:', data);
          if (isMounted) {
            setIsAdmin(Boolean(data));
          }
          return;
        }

        console.error('Error checking admin status:', error);

        const { data: roleData } = await supabase
          .from('rbac_auth_user_role')
          .select('role_id, rbac_auth_role!inner(nome)')
          .eq('user_id', userId)
          .eq('ativo', true)
          .maybeSingle();

        if (isMounted) {
          setIsAdmin(roleData?.rbac_auth_role?.nome === 'admin');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setAdminChecked(true);
        }
      }
    };

    const handleSession = async (session: Session | null) => {
      if (!isMounted) return;
      
      console.log('[useAuth] handleSession chamado:', session ? 'com sessão' : 'sem sessão');
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('[useAuth] Verificando status de admin para usuário:', session.user.id);
        // Não bloquear no verifyAdminStatus - fazer em background
        verifyAdminStatus(session.user.id).catch((err) => {
          console.error('[useAuth] Erro ao verificar admin (não crítico):', err);
          if (isMounted) {
            setIsAdmin(false);
            setAdminChecked(true);
          }
        });
        // Marcar como verificado mesmo se ainda estiver verificando
        setAdminChecked(true);
      } else {
        setIsAdmin(false);
        setAdminChecked(true);
      }

      if (isMounted) {
        console.log('[useAuth] Finalizando handleSession, setLoading(false)');
        setLoading(false);
      }
    };

    console.log('[useAuth] Configurando listener de mudanças de autenticação');
    
    let sessionHandled = false;
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event, session ? 'com sessão' : 'sem sessão');
      if (!sessionHandled || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        console.log('[useAuth] Processando sessão do evento:', event);
        sessionHandled = true;
        try {
          await handleSession(session);
        } catch (err) {
          console.error('[useAuth] Erro em handleSession:', err);
          if (isMounted) {
            setLoading(false);
            setAdminChecked(true);
          }
        }
      }
    });

    // Timeout de segurança: se demorar mais de 3 segundos sem resposta do listener, tentar getSession
    const timeoutId = setTimeout(() => {
      if (isMounted && !sessionHandled) {
        console.warn('[useAuth] Listener não respondeu em 3s, tentando getSession()...');
        
        supabase.auth
          .getSession()
          .then(async ({ data: { session }, error }) => {
            if (!isMounted) return;
            
            if (error) {
              console.error('[useAuth] Erro ao obter sessão:', error);
              if (!sessionHandled) {
                sessionHandled = true;
                setLoading(false);
                setAdminChecked(true);
                setIsAdmin(false);
                setUser(null);
                setSession(null);
              }
              return;
            }
            
            if (!sessionHandled) {
              console.log('[useAuth] Sessão obtida via getSession():', session ? 'sessão válida' : 'sem sessão');
              sessionHandled = true;
              await handleSession(session);
            }
          })
          .catch((err) => {
            console.error('[useAuth] Erro ao obter sessão (catch):', err);
            if (!sessionHandled && isMounted) {
              sessionHandled = true;
              setLoading(false);
              setAdminChecked(true);
              setIsAdmin(false);
              setUser(null);
              setSession(null);
            }
          });
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
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
      
      // Limpar estado local
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setAdminChecked(false);
      
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
    adminChecked,
    resendConfirmation,
    isAdmin,
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

export { AuthContext };