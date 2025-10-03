import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  Building2, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthState();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleInfo, setModuleInfo] = useState<{
    name: string;
    url: string;
    displayName: string;
  } | null>(null);

  const fromModule = searchParams.get('from');
  const targetModule = searchParams.get('to');

  useEffect(() => {
    if (fromModule && targetModule) {
      handleModuleRedirect();
    } else {
      setError('Parâmetros de redirecionamento inválidos');
      setLoading(false);
    }
  }, [fromModule, targetModule]);

  const handleModuleRedirect = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      // Buscar informações do módulo de destino
      const { data: moduleData, error: moduleError } = await supabase
        .from('frontend_modules')
        .select('*')
        .eq('module_name', targetModule)
        .eq('status', 'ativo')
        .single();

      if (moduleError || !moduleData) {
        setError('Módulo não encontrado ou indisponível');
        setLoading(false);
        return;
      }

      setModuleInfo({
        name: moduleData.module_name,
        url: moduleData.frontend_url,
        displayName: moduleData.display_name
      });

      // Buscar ID do projeto dinamicamente
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', 'gestao')
        .single();

      if (!projectData) {
        setError('Projeto não encontrado');
        setLoading(false);
        return;
      }

      // Criar sessão para o módulo de destino
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('create_frontend_session', {
          _project_id: projectData.id,
          _frontend_module: targetModule,
          _frontend_origin: window.location.origin,
        });

      if (sessionError) {
        setError('Erro ao criar sessão para o módulo');
        setLoading(false);
        return;
      }

      const sessionInfo = sessionData[0];

      // Log de redirecionamento
      await supabase
        .from('resource_access_log')
        .insert({
          user_id: user.id,
          resource_type: 'module_redirect',
          resource_path: `/redirect?from=${fromModule}&to=${targetModule}`,
          action: 'redirect',
          success: true,
          metadata: {
            from_module: fromModule,
            to_module: targetModule,
            module_url: moduleData.frontend_url
          }
        });

      // Preparar URL de destino com token
      const targetUrl = new URL(moduleData.frontend_url);
      targetUrl.searchParams.set('token', sessionInfo.session_token);
      targetUrl.searchParams.set('from_hub', 'true');
      targetUrl.searchParams.set('redirected_from', fromModule || '');

      // Salvar token no localStorage
      localStorage.setItem(`arruda_token_${targetModule}`, sessionInfo.session_token);
      localStorage.setItem(`arruda_token_expires_${targetModule}`, sessionInfo.expires_at);

      setLoading(false);
      setRedirecting(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = targetUrl.toString();
      }, 2000);

    } catch (error) {
      console.error('Error during redirect:', error);
      setError('Erro interno do servidor');
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    if (moduleInfo) {
      const targetUrl = new URL(moduleInfo.url);
      targetUrl.searchParams.set('from_hub', 'true');
      window.location.href = targetUrl.toString();
    }
  };

  const handleBackToHub = () => {
    window.location.href = '/hub';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Preparando Redirecionamento</CardTitle>
            <CardDescription>
              Aguarde enquanto preparamos seu acesso...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Validando permissões e criando sessão segura
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-red-700">Erro no Redirecionamento</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Não foi possível redirecionar para o módulo solicitado.
              </p>
              <div className="space-y-2">
                <Button onClick={handleBackToHub} className="w-full">
                  <Building2 className="h-4 w-4 mr-2" />
                  Voltar ao Hub
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-green-700">Redirecionando...</CardTitle>
            <CardDescription>
              Você será redirecionado para {moduleInfo?.displayName} em instantes
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Abrindo módulo em nova aba...
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Se não for redirecionado automaticamente,</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={handleManualRedirect}
                  className="p-0 h-auto"
                >
                  clique aqui
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <ExternalLink className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Redirecionamento</CardTitle>
          <CardDescription>
            Preparando acesso ao módulo
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleBackToHub} className="w-full">
            <Building2 className="h-4 w-4 mr-2" />
            Voltar ao Hub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Redirect;
