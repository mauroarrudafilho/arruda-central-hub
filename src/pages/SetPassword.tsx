import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const designTokens = useDesignTokens();
  
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);

  // Validar token ao montar
  useEffect(() => {
    if (!token) {
      console.error('❌ Nenhum token fornecido na URL');
      setValidatingToken(false);
      toast({
        title: "Link inválido",
        description: "Token não encontrado no link.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Token encontrado na URL:', token);
    setValidatingToken(false);
  }, [token]);

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "Erro",
        description: "A senha não atende aos critérios de segurança.",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Erro",
        description: "Token não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Enviando requisição para definir senha...');
      
      const { data, error } = await supabase.functions.invoke('set-password', {
        body: {
          token,
          password,
        },
      });

      if (error) {
        console.error('❌ Erro ao definir senha:', error);
        throw new Error(error.message || 'Erro ao definir senha');
      }

      if (data?.error) {
        console.error('❌ Erro retornado pela função:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Senha definida com sucesso!');
      setSuccess(true);
      
      toast({
        title: "Sucesso",
        description: "Sua senha foi criada com sucesso!",
      });

    } catch (error) {
      console.error('❌ Erro ao definir senha:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao definir senha. Tente novamente.";
      toast({
        title: "Erro",
        description: errorMessage,
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
                Senha Criada com Sucesso!
              </h2>
              <div className="space-y-3">
                <p 
                  className="text-gray-700"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  Sua senha foi criada com sucesso. Agora você pode acessar o sistema.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p 
                    className="text-sm text-blue-800 mb-2 font-semibold"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Próximo passo:
                  </p>
                  <p 
                    className="text-sm text-blue-700 mb-3"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Você receberá em breve um link de acesso enviado pelo administrador para acessar o sistema comercial.
                  </p>
                  <div className="bg-white border border-blue-300 rounded-md p-3 mt-3">
                    <p 
                      className="text-xs text-blue-600 mb-2"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Link de acesso:
                    </p>
                    <a 
                      href="https://arruda-sales-boost.vercel.app/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-800 underline break-all"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      https://arruda-sales-boost.vercel.app/
                    </a>
                  </div>
                  <p 
                    className="text-xs text-blue-600 mt-3"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Aguarde as instruções por e-mail ou entre em contato com o administrador do sistema.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h2 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Verificando link...
              </h2>
              <p 
                className="text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Aguarde um momento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Link Inválido
              </h2>
              <p 
                className="text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                O link é inválido ou expirou. Por favor, solicite um novo convite.
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
                style={{ 
                  backgroundColor: designTokens.colors.primary.DEFAULT,
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                Voltar para Login
              </Button>
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
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle 
            className="text-2xl font-bold"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Criar Senha
          </CardTitle>
          <p 
            className="text-gray-600"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Crie uma senha segura para sua conta
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Senha
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {password && (
                <div className="mt-2 space-y-1">
                  <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.minLength ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    Mínimo 8 caracteres
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasUpperCase ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    Uma letra maiúscula
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasLowerCase ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    Uma letra minúscula
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasNumbers ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    Um número
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasSpecialChar ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    Um caractere especial
                  </div>
                </div>
              )}
            </div>

            <div>
              <label 
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-600 text-xs mt-1">As senhas não coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
              className="w-full"
              style={{ 
                backgroundColor: designTokens.colors.primary.DEFAULT,
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              {loading ? 'Criando senha...' : 'Criar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPassword;

