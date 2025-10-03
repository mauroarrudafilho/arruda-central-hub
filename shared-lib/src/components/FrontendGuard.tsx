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
  CheckCircle
} from 'lucide-react';

interface FrontendGuardProps {
  children: React.ReactNode;
  moduleName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  hubUrl: string;
}

interface SessionValidation {
  isValid: boolean;
  userId: string | null;
  expiresAt: string | null;
  frontendOrigin: string | null;
}

export const FrontendGuard = ({ 
  children, 
  moduleName, 
  supabaseUrl, 
  supabaseAnonKey, 
  hubUrl 
}: FrontendGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateSession();
  }, []);

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

      // Salvar token no localStorage se veio da URL
      if (tokenFromUrl && !tokenFromStorage) {
        localStorage.setItem(`arruda_token_${moduleName}`, tokenFromUrl);
        
        // Buscar expiração da sessão
        const { data: sessionDetails } = await supabase
          .from('user_sessions')
          .select('expires_at')
          .eq('session_token', sessionToken)
          .eq('frontend_module', moduleName)
          .single();

        if (sessionDetails?.expires_at) {
          localStorage.setItem(`arruda_token_expires_${moduleName}`, sessionDetails.expires_at);
        }
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

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    
    return minutes <= 5; // 5 minutos ou menos
  };

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

  // Aviso de expiração próxima
  if (sessionInfo?.expiresAt && isExpiringSoon(sessionInfo.expiresAt)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle className="text-yellow-700">Sessão Expirando</CardTitle>
            <CardDescription>
              Sua sessão expira em {getTimeUntilExpiry(sessionInfo.expiresAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Para não perder seu trabalho, salve tudo e renove sua sessão.
              </p>
              <div className="space-y-2">
                <Button onClick={handleRedirectToHub} className="w-full">
                  <Building2 className="h-4 w-4 mr-2" />
                  Renovar Sessão
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLoading(false)} 
                  className="w-full"
                >
                  Continuar por Agora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

