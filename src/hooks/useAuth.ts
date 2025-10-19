import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { securityLogger } from '@/lib/security-logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .rpc('user_is_admin', { user_id: session.user.id });
              
              if (!error) {
                console.log('Admin check result:', data);
                setIsAdmin(data || false);
              } else {
                console.error('Error checking admin status:', error);
                // Fallback: check directly in the database
                const { data: roleData } = await supabase
                  .from('rbac_auth_user_role')
                  .select('role_id, rbac_auth_role!inner(nome)')
                  .eq('user_id', session.user.id)
                  .eq('ativo', true)
                  .single();
                
                if (roleData?.rbac_auth_role?.nome === 'admin') {
                  setIsAdmin(true);
                } else {
                  setIsAdmin(false);
                }
              }
            } catch (err) {
              console.error('Error checking admin status:', err);
              setIsAdmin(false);
            }
          }, 100);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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