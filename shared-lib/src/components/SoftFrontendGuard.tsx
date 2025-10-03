import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  ExternalLink, 
  AlertCircle,
  Clock,
  Loader2,
  CheckCircle,
  Info
} from 'lucide-react';

interface SoftFrontendGuardProps {
  children: React.ReactNode;
  moduleName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  hubUrl: string;
  enabled?: boolean; // Flag para ativar/desativar a proteção
}

interface SessionValidation {
  isValid: boolean;
  userId: string | null;
  expiresAt: string | null;
  frontendOrigin: string | null;
}

export const SoftFrontendGuard = ({ 
  children, 
  moduleName, 
  supabaseUrl, 
  supabaseAnonKey, 
  hubUrl,
  enabled = false // Por padrão desabilitado
}: SoftFrontendGuardProps) => {
  const [loading, setLoading] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (enabled) {
      validateSession();
    } else {
      // Se desabilitado, apenas mostrar aviso informativo
      setShowInfo(true);
    }
  }, [enabled]);

  const validateSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se há token na URL ou localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      const tokenFromStorage = localStorage.getItem(`arruda_token_${moduleName}`);
      
      const sessionToken = tokenFromUrl || tokenFromStorage;

      if (!sessionToken) {
        setError('Token de sessão não encontrado');
        setLoading(false);
        return;
      }

      // Criar cliente Supabase
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Validar sessão no servidor
      const { data, error: validationError } = await supabase
        .rpc('validate_frontend_session', {
          _session_token: sessionToken,
          _frontend_module: moduleName
        });

      if (validationError) {
        console.error('Error validating session:', validationError);
        setError('Erro ao validar sessão');
        setLoading(false);
        return;
      }

      const sessionData = data[0] as SessionValidation;

      if (!sessionData.isValid) {
        setError('Sessão inválida ou expirada');
        setLoading(false);
        return;
      }

      setSessionValid(true);
      setSessionInfo(sessionData);

      // Log de acesso bem-sucedido
      await supabase
        .from('resource_access_log')
        .insert({
          user_id: sessionData.userId,
          resource_type: 'frontend_access',
          resource_path: window.location.pathname,
          action: 'access',
          success: true,
          metadata: {
            module_name: moduleName,
            frontend_origin: window.location.origin,
            user_agent: navigator.userAgent
          }
        });

    } catch (error) {
      console.error('Error during session validation:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToHub = () => {
    // Log do redirecionamento
    if (sessionInfo?.userId) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      supabase
        .from('resource_access_log')
        .insert({
          user_id: sessionInfo.userId,
          resource_type: 'hub_redirect',
          resource_path: window.location.pathname,
          action: 'redirect_to_hub',
          success: true,
          metadata: {
            module_name: moduleName,
            reason: 'no_valid_session'
          }
        });
    }

    // Limpar tokens locais
    localStorage.removeItem(`arruda_token_${moduleName}`);
    localStorage.removeItem(`arruda_token_expires_${moduleName}`);

    // Redirecionar para o hub
    window.location.href = hubUrl;
  };

  // Se desabilitado, apenas mostrar aviso e permitir acesso
  if (!enabled) {
    return (
      <>
        {children}
        {showInfo && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 shadow-lg border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm text-blue-800">
                      Modo Desenvolvimento
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInfo(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs text-blue-700">
                  Acesso direto liberado temporariamente. 
                  O sistema de Hub Central está pronto para ativação.
                </CardDescription>
                <div className="mt-2 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(hubUrl, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Testar Hub
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowInfo(false)}
                    className="text-xs"
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  // Se habilitado, usar validação completa
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Verificando Acesso</CardTitle>
            <CardDescription>
              Validando sua sessão no {moduleName}...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto verificamos suas permissões
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sessionValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-orange-700">Acesso Centralizado</CardTitle>
            <CardDescription>
              Nosso sistema de acesso mudou! Agora você deve acessar através do Hub Central.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Para sua segurança e melhor experiência, todos os módulos agora são acessados através do portal central.
              </p>
              <Button onClick={handleRedirectToHub} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir para o Arruda Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

