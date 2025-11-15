/**
 * Hook de SSO para módulos externos do Arruda Hub
 * 
 * COMO USAR:
 * 1. Copie este arquivo para seu projeto
 * 2. Ajuste as constantes SUPABASE_URL e SUPABASE_ANON_KEY
 * 3. Use o hook no seu App.tsx ou componente principal
 * 
 * Exemplo:
 * ```tsx
 * const { user, loading, authenticated } = useSSO();
 * if (loading) return <Loading />;
 * if (!authenticated) return <RedirectToHub />;
 * return <YourApp user={user} />;
 * ```
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ AJUSTE ESTAS CONSTANTES COM OS VALORES DO SEU PROJETO
const SUPABASE_URL = 'https://kgzybpelluftexrewyke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI';
const HUB_URL = 'https://arruda-central-hub.vercel.app/hub';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SSOUser {
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

interface UseSSOReturn {
  user: SSOUser | null;
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  redirectToHub: () => void;
}

export const useSSO = (): UseSSOReturn => {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSSO();
  }, []);

  const redirectToHub = () => {
    window.location.href = HUB_URL;
  };

  const checkSSO = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar token na URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const fromHub = urlParams.get('from') === 'arruda-hub';

      if (ssoToken && fromHub) {
        console.log('🔑 Token SSO encontrado na URL, validando...');
        
        // 2. Validar token SSO
        const { data, error: validationError } = await supabase.rpc('validate_sso_token', {
          _token: ssoToken,
        });

        if (validationError) {
          console.error('❌ Erro ao validar token SSO:', validationError);
          setError('Token SSO inválido');
          redirectToHub();
          return;
        }

        if (!data || data.length === 0 || !data[0].is_valid) {
          console.error('❌ Token SSO inválido ou expirado');
          setError('Token SSO inválido ou expirado');
          redirectToHub();
          return;
        }

        const sessionData = data[0];
        console.log('✅ Token SSO válido!', { user: sessionData.user_email, project: sessionData.project_name });
        
        // 3. Criar objeto de usuário
        const ssoUser: SSOUser = {
          id: sessionData.user_id,
          email: sessionData.user_email,
          name: sessionData.user_name,
          projectId: sessionData.project_id,
          projectSlug: sessionData.project_slug,
          projectName: sessionData.project_name,
          permissions: sessionData.permissions || [],
        };

        setUser(ssoUser);
        setAuthenticated(true);
        
        // 4. Salvar para persistência
        localStorage.setItem('arruda_sso_user', JSON.stringify(ssoUser));
        localStorage.setItem('arruda_sso_token', ssoToken);
        localStorage.setItem('arruda_sso_expires', sessionData.expires_at);
        
        // 5. Limpar token da URL (segurança)
        window.history.replaceState({}, '', window.location.pathname);
        
      } else {
        // Verificar sessão salva no localStorage
        const savedUser = localStorage.getItem('arruda_sso_user');
        const savedToken = localStorage.getItem('arruda_sso_token');
        const savedExpires = localStorage.getItem('arruda_sso_expires');

        if (savedUser && savedToken && savedExpires) {
          // Verificar se não expirou
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
              setAuthenticated(true);
              console.log('✅ Sessão restaurada do localStorage');
            } else {
              // Token inválido, limpar e redirecionar
              console.log('❌ Token salvo inválido, redirecionando...');
              localStorage.removeItem('arruda_sso_user');
              localStorage.removeItem('arruda_sso_token');
              localStorage.removeItem('arruda_sso_expires');
              redirectToHub();
            }
          } else {
            // Sessão expirada
            console.log('❌ Sessão expirada, redirecionando...');
            localStorage.removeItem('arruda_sso_user');
            localStorage.removeItem('arruda_sso_token');
            localStorage.removeItem('arruda_sso_expires');
            redirectToHub();
          }
        } else {
          // Sem token e sem sessão - redirecionar para Hub
          console.log('❌ Sem token SSO, redirecionando para Hub...');
          redirectToHub();
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao verificar SSO:', err);
      setError(err.message || 'Erro ao autenticar');
      redirectToHub();
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, authenticated, error, redirectToHub };
};

