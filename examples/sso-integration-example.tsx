// Exemplo completo de integração SSO no módulo externo
// Este exemplo mostra como validar o token SSO e autenticar o usuário automaticamente

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';
const HUB_URL = 'https://arruda-central-hub.vercel.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SSOUser {
  id: string;
  email: string;
  name: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  permissions: Array<{
    permission: string;
    module: string;
    action: string;
    granted: boolean;
  }>;
}

export const useSSOAuth = () => {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSSOToken();
  }, []);

  const checkSSOToken = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar se há token SSO na URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      if (ssoToken && fromHub) {
        // 2. Validar token SSO com o Supabase
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (validationError) {
          console.error('Erro ao validar token SSO:', validationError);
          setError('Token SSO inválido');
          redirectToHub();
          return;
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
          setError('Token SSO inválido ou expirado');
          redirectToHub();
          return;
        }

        const sessionData = data[0];

        // 3. Criar sessão local do usuário
        const ssoUser: SSOUser = {
          id: sessionData.user_id,
          email: sessionData.user_email,
          name: sessionData.user_name,
          projectId: sessionData.project_id,
          projectSlug: sessionData.project_slug,
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || [],
        };

        // 4. Salvar no localStorage para persistência
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken);
        localStorage.setItem('arruda_sso_expires', sessionData.expires_at);

        setUser(ssoUser);

        // 5. Limpar token da URL (segurança)
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else {
        // 6. Verificar se há sessão salva localmente
        const savedUser = localStorage.getItem('arruda_sso_user');
        const savedToken = localStorage.getItem('arruda_sso_token');
        const savedExpires = localStorage.getItem('arruda_sso_expires');

        if (savedUser && savedToken && savedExpires) {
          // Verificar se a sessão não expirou
          const expiresAt = new Date(savedExpires);
          if (expiresAt > new Date()) {
            // Validar token novamente para garantir que ainda é válido
            const { data: validationData, error: validationError } = await supabase.rpc('validate_sso_token', {
              _token: savedToken,
            });

            if (!validationError && validationData && validationData.length > 0 && validationData[0].is_valid) {
              const sessionData = validationData[0];
              setUser({
                id: sessionData.user_id,
                email: sessionData.user_email,
                name: sessionData.user_name,
                projectId: sessionData.project_id,
                projectSlug: sessionData.project_slug,
                projectName: sessionData.project_name,
                permissions: sessionData.permissions || [],
              });
            } else {
              // Token inválido, limpar e redirecionar
              clearLocalSession();
              redirectToHub();
            }
          } else {
            // Sessão expirada
            clearLocalSession();
            redirectToHub();
          }
        } else {
          // Sem token e sem sessão salva - redirecionar para Hub
          redirectToHub();
        }
      }
    } catch (err) {
      console.error('Erro ao verificar SSO:', err);
      setError('Erro ao autenticar');
      redirectToHub();
    } finally {
      setLoading(false);
    }
  };

  const clearLocalSession = () => {
    localStorage.removeItem('arruda_sso_user');
    localStorage.removeItem('arruda_sso_token');
    localStorage.removeItem('arruda_sso_expires');
    setUser(null);
  };

  const redirectToHub = () => {
    window.location.href = `${HUB_URL}/hub`;
  };

  const logout = () => {
    clearLocalSession();
    redirectToHub();
  };

  const hasPermission = (permission: string, module?: string, action?: string): boolean => {
    if (!user) return false;

    return user.permissions.some((p) => {
      if (module && p.module !== module) return false;
      if (action && p.action !== action) return false;
      return p.permission === permission && p.granted;
    });
  };

  return {
    user,
    loading,
    error,
    logout,
    hasPermission,
    isAuthenticated: !!user,
  };
};

// Componente de rota protegida
export const ProtectedRoute = ({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) => {
  const { user, loading, hasPermission, redirectToHub } = useSSOAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirectToHub();
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
          <button
            onClick={redirectToHub}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Hub
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Exemplo de uso no App principal
export const AppWithSSO = () => {
  const { user, loading, logout, hasPermission } = useSSOAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Será redirecionado automaticamente
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com informações do usuário */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Meu Módulo</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="p-6">
        <ProtectedRoute requiredPermission="acessar_modulo">
          {/* Seu conteúdo aqui */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Bem-vindo, {user.name}!</h2>
            <p>Você está autenticado via SSO do Arruda Hub.</p>
            <p>Projeto: {user.projectName}</p>
            
            {/* Exemplo de verificação de permissão */}
            {hasPermission('criar_item') && (
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                Criar Novo Item
              </button>
            )}
          </div>
        </ProtectedRoute>
      </main>
    </div>
  );
};

