import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const designTokens = useDesignTokens();

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        setLoading(true);

        if (!accessToken || !refreshToken || type !== 'signup') {
          setStatus('error');
          setMessage('Link de confirmação inválido ou expirado.');
          return;
        }

        // Configurar sessão com os tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('Erro ao configurar sessão:', sessionError);
          setStatus('error');
          setMessage('Erro ao confirmar email. Tente novamente.');
          return;
        }

        // Verificar se o email foi confirmado
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setStatus('error');
          setMessage('Erro ao verificar confirmação do email.');
          return;
        }

        if (user.email_confirmed_at) {
          setStatus('success');
          setMessage('Email confirmado com sucesso! Você já pode fazer login.');
          
          // Log da confirmação
          await supabase
            .from('resource_access_log')
            .insert({
              user_id: user.id,
              resource_type: 'email_confirmation',
              resource_path: '/confirm-email',
              action: 'confirm',
              success: true,
              metadata: {
                email: user.email,
                confirmed_at: user.email_confirmed_at
              }
            });

          // Redirecionar após 3 segundos
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Email ainda não foi confirmado.');
        }

      } catch (error) {
        console.error('Erro ao confirmar email:', error);
        setStatus('error');
        setMessage('Erro interno. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [accessToken, refreshToken, type, navigate]);

  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: searchParams.get('email') || '',
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email reenviado",
        description: "Verifique sua caixa de entrada para o novo link de confirmação.",
      });
    } catch (error: any) {
      console.error('Erro ao reenviar confirmação:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível reenviar o email de confirmação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-12 w-12 text-red-600" />;
      default:
        return <Mail className="h-12 w-12 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
      case 'expired':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50"
      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
    >
      <Card className={`w-full max-w-md ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'loading' && 'Confirmando Email...'}
            {status === 'success' && 'Email Confirmado!'}
            {(status === 'error' || status === 'expired') && 'Erro na Confirmação'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {status === 'loading' && 'Aguarde enquanto confirmamos seu email...'}
            {status === 'success' && 'Sua conta foi ativada com sucesso!'}
            {(status === 'error' || status === 'expired') && 'Não foi possível confirmar seu email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            {message}
          </p>

          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Redirecionando para o login em alguns segundos...
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
                style={{ 
                  backgroundColor: designTokens.colors.primary.DEFAULT,
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                Ir para Login
              </Button>
            </div>
          )}

          {(status === 'error' || status === 'expired') && (
            <div className="space-y-3">
              <Button 
                onClick={handleResendConfirmation}
                disabled={loading}
                variant="outline"
                className="w-full"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                {loading ? 'Enviando...' : 'Reenviar Confirmação'}
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                variant="ghost"
                className="w-full"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Voltar ao Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;

