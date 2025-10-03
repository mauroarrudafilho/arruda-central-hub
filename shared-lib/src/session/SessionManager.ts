import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ArrudaSession, ArrudaUser, ArrudaProject, SessionConfig, AuthState } from '../types';
import { ArrudaLogger } from '../utils/logger';

interface SessionStore extends AuthState {
  setUser: (user: ArrudaUser | null) => void;
  setSession: (session: ArrudaSession | null) => void;
  setProject: (project: ArrudaProject | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      project: null,
      loading: false,
      error: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProject: (project) => set({ project }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearAuth: () => set({ user: null, session: null, project: null, error: null }),
    }),
    {
      name: 'arruda-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        project: state.project,
        session: state.session ? {
          ...state.session,
          // Não persistir token por segurança em alguns casos
          session_token: state.session.session_token
        } : null
      }),
    }
  )
);

export class SessionManager {
  private supabase: SupabaseClient;
  private config: SessionConfig;
  private logger: ArrudaLogger;
  private sessionToken: string | null = null;

  constructor(config: SessionConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.logger = new ArrudaLogger(config.enableLogging);
    
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      useSessionStore.getState().setLoading(true);
      
      // Verificar sessão atual do Supabase
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.user) {
        await this.createOrUpdateFrontendSession(session.user);
      }

      // Listener para mudanças de auth
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        this.logger.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.createOrUpdateFrontendSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.clearSession();
        }
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize auth:', error);
      useSessionStore.getState().setError('Falha na inicialização da autenticação');
    } finally {
      useSessionStore.getState().setLoading(false);
    }
  }

  private async createOrUpdateFrontendSession(user: any) {
    try {
      this.logger.log('Creating frontend session for user:', user.id);

      // Buscar perfil do usuário
      const { data: profile } = await this.supabase
        .from('auth_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Criar sessão de frontend
      const { data: sessionData, error } = await this.supabase
        .rpc('create_frontend_session', {
          _project_id: this.config.projectId,
          _frontend_module: this.config.moduleName,
          _frontend_origin: this.config.frontendOrigin,
        });

      if (error) throw error;

      const sessionInfo = sessionData[0];
      this.sessionToken = sessionInfo.session_token;

      // Validar sessão para obter permissões
      const { data: validationData } = await this.supabase
        .rpc('validate_frontend_session', {
          _session_token: this.sessionToken
        });

      const validation = validationData[0];

      // Buscar projeto
      const { data: project } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', this.config.projectId)
        .single();

      // Atualizar store
      const arrudaUser: ArrudaUser = {
        id: user.id,
        email: profile.email,
        nome: profile.nome,
        status: profile.status,
        ultimo_login: profile.ultimo_login,
        created_at: profile.created_at,
      };

      const arrudaSession: ArrudaSession = {
        session_id: sessionInfo.session_id,
        session_token: this.sessionToken,
        user_id: user.id,
        project_id: this.config.projectId,
        frontend_module: this.config.moduleName,
        permissions: validation.permissions || [],
        expires_at: sessionInfo.expires_at,
      };

      const arrudaProject: ArrudaProject = project ? {
        id: project.id,
        nome: project.nome,
        descricao: project.descricao,
        slug: project.slug,
        status: project.status,
        nivel_acesso: 'visualizador' // TODO: buscar nível real
      } : null;

      useSessionStore.getState().setUser(arrudaUser);
      useSessionStore.getState().setSession(arrudaSession);
      useSessionStore.getState().setProject(arrudaProject);
      useSessionStore.getState().setError(null);

      this.logger.log('Frontend session created successfully');

    } catch (error) {
      this.logger.error('Failed to create frontend session:', error);
      useSessionStore.getState().setError('Falha ao criar sessão do frontend');
    }
  }

  private clearSession() {
    this.sessionToken = null;
    useSessionStore.getState().clearAuth();
    this.logger.log('Session cleared');
  }

  // Método para fazer login
  async signIn(email: string, password: string) {
    try {
      useSessionStore.getState().setLoading(true);
      useSessionStore.getState().setError(null);

      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // A sessão será criada automaticamente pelo listener onAuthStateChange
      
    } catch (error: any) {
      this.logger.error('Sign in failed:', error);
      useSessionStore.getState().setError(error.message);
      throw error;
    } finally {
      useSessionStore.getState().setLoading(false);
    }
  }

  // Método para fazer logout
  async signOut() {
    try {
      await this.supabase.auth.signOut();
      this.clearSession();
    } catch (error) {
      this.logger.error('Sign out failed:', error);
    }
  }

  // Método para log de acesso a recursos
  async logResourceAccess(
    resourceType: string,
    resourcePath: string,
    action: string,
    success: boolean = true,
    responseTime?: number,
    errorMessage?: string,
    metadata?: any
  ) {
    if (!this.sessionToken) return false;

    try {
      const { data } = await this.supabase.rpc('log_resource_access', {
        _session_token: this.sessionToken,
        _resource_type: resourceType,
        _resource_path: resourcePath,
        _action: action,
        _success: success,
        _response_time: responseTime,
        _error_message: errorMessage,
        _metadata: metadata || {}
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to log resource access:', error);
      return false;
    }
  }

  // Método para validar permissão
  hasPermission(module: string, action: string): boolean {
    const session = useSessionStore.getState().session;
    if (!session) return false;

    return session.permissions.some(p => 
      p.module === module && 
      p.action === action && 
      p.granted
    );
  }

  // Método para obter estado atual
  getAuthState(): AuthState {
    return useSessionStore.getState();
  }

  // Método para subscribe a mudanças
  subscribe(callback: (state: AuthState) => void) {
    return useSessionStore.subscribe(callback);
  }
}

export { useSessionStore };

