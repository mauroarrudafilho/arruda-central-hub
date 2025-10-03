import { useEffect, useState } from 'react';
import { SessionManager } from '../session/SessionManager';
import { AuthState } from '../types';

let globalSessionManager: SessionManager | null = null;

export function useArrudaAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    project: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!globalSessionManager) {
      console.warn('SessionManager not initialized. Call initializeArrudaAuth first.');
      return;
    }

    // Obter estado inicial
    setAuthState(globalSessionManager.getAuthState());

    // Subscribe a mudanças
    const unsubscribe = globalSessionManager.subscribe((state) => {
      setAuthState(state);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!globalSessionManager) throw new Error('SessionManager not initialized');
    return globalSessionManager.signIn(email, password);
  };

  const signOut = async () => {
    if (!globalSessionManager) throw new Error('SessionManager not initialized');
    return globalSessionManager.signOut();
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!globalSessionManager) return false;
    return globalSessionManager.hasPermission(module, action);
  };

  const logResourceAccess = async (
    resourceType: string,
    resourcePath: string,
    action: string,
    success?: boolean,
    responseTime?: number,
    errorMessage?: string,
    metadata?: any
  ) => {
    if (!globalSessionManager) return false;
    return globalSessionManager.logResourceAccess(
      resourceType,
      resourcePath,
      action,
      success,
      responseTime,
      errorMessage,
      metadata
    );
  };

  return {
    ...authState,
    signIn,
    signOut,
    hasPermission,
    logResourceAccess,
    isAuthenticated: !!authState.user,
    isAdmin: authState.session?.permissions.some(p => p.permission.includes('admin')) || false,
  };
}

// Função para inicializar o SessionManager globalmente
export function initializeArrudaAuth(config: {
  supabaseUrl: string;
  supabaseKey: string;
  projectId: string;
  moduleName: string;
  frontendOrigin: string;
  enableLogging?: boolean;
}) {
  if (globalSessionManager) {
    console.warn('ArrudaAuth already initialized');
    return globalSessionManager;
  }

  globalSessionManager = new SessionManager(config);
  return globalSessionManager;
}

// Função para obter o SessionManager atual
export function getSessionManager(): SessionManager | null {
  return globalSessionManager;
}

