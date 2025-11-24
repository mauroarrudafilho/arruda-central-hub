import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { securityLogger } from '@/lib/security-logger';
import { clearSSOTokens } from '@/lib/sso-token-manager';

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
  
  // Refs para controle de estado entre renderizações
  const sessionHandledRef = useRef(false);
  const adminCheckCacheRef = useRef<{ userId: string; isAdmin: boolean; timestamp: number } | null>(null);
  const ADMIN_CACHE_TTL = 60000; // 1 minuto
  
  // Refs para controle de eventos de autenticação
  const lastEventTimeRef = useRef<number>(0);
  const lastProcessedSessionRef = useRef<string | null>(null); // Armazena o access_token da última sessão processada

  useEffect(() => {
    let isMounted = true;
    let initialSessionLoaded = false;

    const verifyAdminStatus = async (userId: string) => {
      if (!isMounted) return;
      
      // Verificar cache
      const cached = adminCheckCacheRef.current;
      if (cached && cached.userId === userId && Date.now() - cached.timestamp < ADMIN_CACHE_TTL) {
        console.log('[useAuth] Usando cache de admin para usuário:', userId);
        if (isMounted) {
          setIsAdmin(cached.isAdmin);
          setAdminChecked(true);
        }
        return;
      }

      setAdminChecked(false);

      try {
        const { data, error } = await supabase.rpc('user_is_admin', { user_id: userId });

        if (!error) {
          const adminStatus = Boolean(data);
          console.log('[useAuth] isAdmin state set to:', adminStatus);
          
          // Atualizar cache
          adminCheckCacheRef.current = {
            userId,
            isAdmin: adminStatus,
            timestamp: Date.now()
          };
          
          if (isMounted) {
            setIsAdmin(adminStatus);
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

        const adminStatus = roleData?.rbac_auth_role?.nome === 'admin';
        
        // Atualizar cache
        adminCheckCacheRef.current = {
          userId,
          isAdmin: adminStatus,
          timestamp: Date.now()
        };
        
        if (isMounted) {
          setIsAdmin(adminStatus);
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
        // Limpar cache quando não há sessão
        adminCheckCacheRef.current = null;
        // Limpar referência da sessão processada
        lastProcessedSessionRef.current = null;
      }

      if (isMounted) {
        console.log('[useAuth] Finalizando handleSession, setLoading(false)');
        setLoading(false);
      }
    };

    console.log('[useAuth] Configurando listener de mudanças de autenticação');
    
    // Debounce para evitar múltiplos processamentos do mesmo evento
    // O Supabase pode disparar múltiplos eventos SIGNED_IN em sequência
    const DEBOUNCE_MS = 300; // 300ms é suficiente para filtrar eventos duplicados
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      // Debounce: ignorar eventos muito próximos
      const now = Date.now();
      if (now - lastEventTimeRef.current < DEBOUNCE_MS && event === 'SIGNED_IN') {
        console.log('⏭️ [useAuth] Ignorando evento SIGNED_IN duplicado (debounce)');
        return;
      }
      lastEventTimeRef.current = now;
      
      // Ignorar INITIAL_SESSION se já carregamos a sessão inicial
      if (event === 'INITIAL_SESSION' && initialSessionLoaded) {
        console.log('⏭️ [useAuth] Ignorando INITIAL_SESSION duplicado');
        return;
      }
      
      console.log('[useAuth] Auth state changed:', event, session ? 'com sessão' : 'sem sessão');
      
      // Identificar a sessão atual pelo access_token (ou null se não houver sessão)
      const currentSessionToken = session?.access_token || null;
      
      // Verificar se esta é a mesma sessão que já foi processada
      if (currentSessionToken && currentSessionToken === lastProcessedSessionRef.current) {
        console.log('⏭️ [useAuth] Ignorando evento - mesma sessão já processada:', event);
        return;
      }
      
      // Processar eventos importantes sempre, mas com proteção contra duplicatas
      const isImportantEvent = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED';
      
      // Para eventos importantes, verificar se já foi processado recentemente (via debounce)
      // Para outros eventos, usar sessionHandledRef normalmente
      if (isImportantEvent || !sessionHandledRef.current) {
        console.log('[useAuth] Processando sessão do evento:', event);
        sessionHandledRef.current = true;
        
        // Atualizar referência da sessão processada
        lastProcessedSessionRef.current = currentSessionToken;
        
        try {
          await handleSession(session);
          
          // Marcar que sessão inicial foi carregada
          if (event === 'INITIAL_SESSION') {
            initialSessionLoaded = true;
          }
        } catch (err) {
          console.error('[useAuth] Erro em handleSession:', err);
          if (isMounted) {
            setLoading(false);
            setAdminChecked(true);
          }
        }
      } else {
        console.log('⏭️ [useAuth] Ignorando evento (já processado):', event);
      }
    });

    // Timeout de segurança: se demorar mais de 3 segundos sem resposta do listener, tentar getSession
    const timeoutId = setTimeout(() => {
      if (isMounted && !sessionHandledRef.current) {
        console.warn('[useAuth] Listener não respondeu em 3s, tentando getSession()...');
        
        supabase.auth
          .getSession()
          .then(async ({ data: { session }, error }) => {
            if (!isMounted) return;
            
            if (error) {
              console.error('[useAuth] Erro ao obter sessão:', error);
              if (!sessionHandledRef.current) {
                sessionHandledRef.current = true;
                setLoading(false);
                setAdminChecked(true);
                setIsAdmin(false);
                setUser(null);
                setSession(null);
              }
              return;
            }
            
            if (!sessionHandledRef.current) {
              console.log('[useAuth] Sessão obtida via getSession():', session ? 'sessão válida' : 'sem sessão');
              sessionHandledRef.current = true;
              await handleSession(session);
            }
          })
          .catch((err) => {
            console.error('[useAuth] Erro ao obter sessão (catch):', err);
            if (!sessionHandledRef.current && isMounted) {
              sessionHandledRef.current = true;
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

      // Limpar localStorage e sessionStorage ANTES de fazer signOut
      // Isso evita que dados persistidos sejam restaurados
      localStorage.removeItem('arruda_sso_user');
      localStorage.removeItem('arruda_sso_token');
      localStorage.removeItem('arruda_sso_expires');
      clearSSOTokens(); // Limpar tokens SSO pré-gerados
      localStorage.clear();
      sessionStorage.clear();

      // Limpar estado local ANTES de fazer signOut no Supabase
      // Isso evita que o AuthGuard redirecione de volta
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setAdminChecked(false);
      
      // Fazer signOut no Supabase com scope 'local' para limpar apenas sessão local
      // e 'global' para limpar todas as sessões em todos os dispositivos
      await supabase.auth.signOut({ scope: 'local' });
      
      // Limpar novamente após signOut para garantir
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (err) {
      console.error('Error signing out:', err);
      
      // Mesmo com erro, limpar estado local e storage
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setAdminChecked(false);
      localStorage.clear();
      sessionStorage.clear();
      
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