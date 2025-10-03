import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const designTokens = useDesignTokens();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

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
    
    if (!token) {
      toast({
        title: "Erro",
        description: "Token de redefinição inválido ou expirado.",
        variant: "destructive",
      });
      return;
    }

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

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      
      toast({
        title: "Sucesso",
        description: "Sua senha foi redefinida com sucesso!",
      });

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha. Tente novamente.",
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
                Senha Redefinida!
              </h2>
              <p 
                className="text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Sua senha foi alterada com sucesso. Você será redirecionado para o login em alguns segundos.
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
            Redefinir Senha
          </CardTitle>
          <p 
            className="text-gray-600"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Digite sua nova senha abaixo
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
                Nova Senha
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
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
              
              {/* Validação de senha */}
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
                  placeholder="Confirme sua nova senha"
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
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
