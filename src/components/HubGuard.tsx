import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  ExternalLink, 
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface HubGuardProps {
  children: React.ReactNode;
}

export const HubGuard = ({ children }: HubGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [sessionExpires, setSessionExpires] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      checkHubSession();
    }
  }, [authLoading, user]);

  const checkHubSession = async () => {
    try {
      setCheckingAccess(true);

      if (!user) {
        setHasValidSession(false);
        setCheckingAccess(false);
        return;
      }

      // Verificar se tem sessão ativa do Hub
      const { data: sessionData, error } = await supabase
        .from('user_sessions')
        .select('expires_at, last_activity')
        .eq('user_id', user.id)
        .eq('frontend_module', 'rbac')
        .eq('expires_at', '>', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !sessionData) {
        setHasValidSession(false);
      } else {
        setHasValidSession(true);
        setSessionExpires(sessionData.expires_at);
        
        // Atualizar última atividade
        await supabase
          .from('user_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('frontend_module', 'rbac');
      }
    } catch (error) {
      console.error('Error checking hub session:', error);
      setHasValidSession(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const handleRedirectToHub = () => {
    // Log do redirecionamento
    supabase
      .from('resource_access_log')
      .insert({
        user_id: user?.id,
        resource_type: 'hub_redirect',
        resource_path: location.pathname,
        action: 'redirect_to_hub',
        success: true,
        metadata: {
          current_path: location.pathname,
          reason: 'no_valid_session'
        }
      });

    navigate('/hub');
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

  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Verificando Acesso</CardTitle>
            <CardDescription>
              Validando sua sessão no Arruda Hub...
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle>Login Necessário</CardTitle>
            <CardDescription>
              Você precisa fazer login para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Building2 className="h-8 w-8 text-orange-500" />
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
  if (sessionExpires && isExpiringSoon(sessionExpires)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle className="text-yellow-700">Sessão Expirando</CardTitle>
            <CardDescription>
              Sua sessão expira em {getTimeUntilExpiry(sessionExpires)}
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
                  onClick={() => setCheckingAccess(false)} 
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

