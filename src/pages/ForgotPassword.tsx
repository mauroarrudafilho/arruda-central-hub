import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { securityLogger } from '@/lib/security-logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const designTokens = useDesignTokens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu e-mail.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Log de solicitação de reset de senha
      await securityLogger.log({
        event_type: 'password_reset_request',
        severity: 'medium',
        description: `Solicitação de reset de senha para ${email}`,
        action: 'password_reset',
        success: true,
        metadata: { email }
      });

      setSuccess(true);
      
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });

    } catch (error) {
      console.error('Error sending reset email:', error);
      
      // Log de erro na solicitação de reset
      await securityLogger.log({
        event_type: 'password_reset_request',
        severity: 'medium',
        description: `Erro ao solicitar reset de senha para ${email}`,
        action: 'password_reset',
        success: false,
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        metadata: { email }
      });
      
      toast({
        title: "Erro",
        description: "Erro ao enviar e-mail de redefinição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                E-mail Enviado!
              </h2>
              <p 
                className="text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Enviamos um link para redefinir sua senha para <strong>{email}</strong>. 
                Verifique sua caixa de entrada e siga as instruções.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="w-full"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  Enviar Novamente
                </Button>
                <Link to="/auth">
                  <Button 
                    variant="ghost"
                    className="w-full"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle 
            className="text-2xl font-bold"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Esqueci minha senha
          </CardTitle>
          <p 
            className="text-gray-600"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Digite seu e-mail para receber um link de redefinição
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ 
                backgroundColor: designTokens.colors.primary.DEFAULT,
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/auth"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
