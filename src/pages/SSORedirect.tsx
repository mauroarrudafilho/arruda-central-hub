import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Página intermediária de SSO que valida o token antes de redirecionar
 * Evita que a tela de login do módulo apareça por alguns milissegundos
 */
const SSORedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [status, setStatus] = useState<'validating' | 'valid' | 'error'>('validating');
  const [error, setError] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    const handleSSORedirect = async () => {
      try {
        // Obter parâmetros da URL
        const ssoToken = searchParams.get('sso_token');
        const targetModule = searchParams.get('module');
        const moduleUrl = searchParams.get('url');

        if (!ssoToken || !moduleUrl) {
          setError('Parâmetros de SSO inválidos');
          setStatus('error');
          return;
        }

        // Validar token SSO
        console.log('🔵 Validando token SSO antes de redirecionar...');
        const { data: validationData, error: validationError } = await supabase.rpc(
          'validate_sso_token',
          { _token: ssoToken }
        );

        if (validationError || !validationData || validationData.length === 0 || !validationData[0].is_valid) {
          console.error('❌ Token SSO inválido:', validationError);
          setError('Token SSO inválido ou expirado');
          setStatus('error');
          return;
        }

        const sessionData = validationData[0];
        setProjectName(sessionData.project_name || 'módulo');

        console.log('✅ Token SSO válido! Redirecionando para:', moduleUrl);

        // Construir URL final com token
        const finalUrl = new URL(moduleUrl);
        finalUrl.searchParams.set('sso_token', ssoToken);
        finalUrl.searchParams.set('from', 'arruda-hub');
        finalUrl.searchParams.set('validated', 'true'); // Flag para indicar que já foi validado

        setTargetUrl(finalUrl.toString());
        setStatus('valid');

        // Redirecionar após breve delay para mostrar feedback visual
        setTimeout(() => {
          console.log('🔵 Redirecionando para:', finalUrl.toString());
          window.location.href = finalUrl.toString();
        }, 500); // 500ms é suficiente para mostrar o loading, mas rápido o suficiente para não ser perceptível
      } catch (err: any) {
        console.error('❌ Erro ao processar SSO:', err);
        setError(err.message || 'Erro ao processar autenticação SSO');
        setStatus('error');
      }
    };

    handleSSORedirect();
  }, [searchParams]);

  if (status === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Autenticando...</CardTitle>
            <CardDescription>
              Validando credenciais SSO e preparando acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto autenticamos você automaticamente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'valid' && targetUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-green-700">Autenticação Confirmada</CardTitle>
            <CardDescription>
              Redirecionando para {projectName}...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Abrindo módulo...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-red-700">Erro na Autenticação</CardTitle>
            <CardDescription>
              {error || 'Não foi possível autenticar via SSO'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Você pode tentar acessar o módulo diretamente ou voltar ao Hub.
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate('/hub')} className="w-full">
                  Voltar ao Hub
                </Button>
                {targetUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = targetUrl;
                    }}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tentar Acessar Módulo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default SSORedirect;

