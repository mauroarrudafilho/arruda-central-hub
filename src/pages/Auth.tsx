import React, { useState, useRef, useEffect } from 'react';
// Removido motion para otimizar performance
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight, BarChart3, Users, DollarSign, Truck, FileText, Package, GraduationCap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const Auth = () => {
  // SOLUÇÃO DEFINITIVA: Usar refs para evitar reloads
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [keepConnected, setKeepConnected] = useState(false);

  const { toast } = useToast();
  const { signIn, signUp, resendConfirmation, user } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Verificar se precisa mostrar aviso de confirmação de email
  useEffect(() => {
    if (location.state?.requireEmailConfirmation) {
      toast({
        title: "Confirmação de Email Necessária",
        description: "Por favor, verifique sua caixa de entrada e confirme seu email para acessar o sistema.",
        variant: "default",
      });
    }
  }, [location.state]);

  // FUNÇÃO UNIVERSAL DE PRESERVAÇÃO DE VALORES - SOLUÇÃO DEFINITIVA
  const preserveAllValues = () => {
    return {
      email: emailRef.current?.value || '',
      password: passwordRef.current?.value || '',
      confirmPassword: confirmPasswordRef.current?.value || ''
    };
  };

  const restoreAllValues = (values: { email: string; password: string; confirmPassword: string }) => {
    setTimeout(() => {
      if (emailRef.current) emailRef.current.value = values.email;
      if (passwordRef.current) passwordRef.current.value = values.password;
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = values.confirmPassword;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    
    console.log('🚀 Iniciando submit - SOLUÇÃO DEFINITIVA IMPLEMENTADA - Evento:', e.type);

    try {
      // Usar valores dos refs
      const email = emailRef.current?.value || '';
      const password = passwordRef.current?.value || '';
      const confirmPassword = confirmPasswordRef.current?.value || '';
      
      console.log('📧 Email:', email);
      console.log('🔐 Password length:', password.length);

      // Validações básicas
      if (!email || email.trim() === '') {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description: "Por favor, informe seu e-mail.",
        });
        return;
      }

      if (isForgotPassword) {
        // Fluxo de recuperação de senha
        toast({
          title: "E-mail de recuperação enviado!",
          description: "Verifique sua caixa de entrada e spam. O link é válido por 1 hora.",
        });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        // Validações para criar conta
        if (!password || password.length < 6) {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Senha inválida",
            description: "A senha deve ter pelo menos 6 caracteres.",
          });
          return;
        }
        
        if (password !== confirmPassword) {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Senhas não coincidem",
            description: "Por favor, confirme sua senha corretamente.",
          });
          return;
        }

        const result = await signUp(email, password, email.split('@')[0]); // Usar parte do email como nome
        if (!result.error) {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu e-mail para confirmar sua conta.",
          });
        } else {
          // CORREÇÃO: Exibir erro de signup
          console.error('❌ Erro no signup:', result.error);
          toast({
            variant: "destructive",
            title: "Erro ao criar conta",
            description: result.error.message === 'User already registered'
              ? "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail."
              : result.error.message || "Não foi possível criar sua conta. Tente novamente.",
          });
        }
      } else {
        // Fluxo de login
        if (!password) {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Campo obrigatório",
            description: "Por favor, informe sua senha.",
          });
          return;
        }

        const result = await signIn(email, password);
        if (!result.error) {
          toast({
            title: "Login realizado com sucesso!",
            description: "Redirecionando...",
          });
        } else {
          // CORREÇÃO: Exibir erro de senha/email incorreto
          console.error('❌ Erro no login:', result.error);
          toast({
            variant: "destructive",
            title: "Erro no login",
            description: result.error.message === 'Invalid login credentials' 
              ? "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
              : result.error.message || "Não foi possível fazer login. Tente novamente.",
          });
        }
      }
    } catch (error: unknown) {
      console.error('❌ Erro no formulário:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const LoginForm = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl tracking-tight text-gray-900 mb-2">
          {isForgotPassword ? 'Recuperar senha' : 
           isSignUp ? 'Criar conta gratuita' : 'Bem-vindo de volta'}
        </h1>
        
        <p className="text-gray-500 text-sm">
          {isForgotPassword ? 'Digite seu e-mail para receber as instruções' :
           isSignUp ? 'Acesse sua conta do Arruda Hub' : 
           'Acesse sua conta do Arruda Hub'}
        </p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
                <div className="space-y-2">
          <Label htmlFor={isForgotPassword ? "forgot-email" : isSignUp ? "signup-email" : "login-email"} className="text-gray-700">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id={isForgotPassword ? "forgot-email" : isSignUp ? "signup-email" : "login-email"}
              ref={emailRef}
                    type="email"
                    placeholder="seu@email.com"
              className="pl-10 h-12 border border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              key={`email-${showPassword}-${keepConnected}-${isSignUp}-${isForgotPassword}`}
                    required
                  />
                </div>
        </div>

        {/* Password */}
        {!isForgotPassword && (
          <div className="space-y-2">
            <Label htmlFor={isSignUp ? "signup-password" : "login-password"} className="text-gray-700">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id={isSignUp ? "signup-password" : "login-password"}
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                key={`password-${showPassword}`}
                className="pl-10 pr-10 h-12 border border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // PRESERVAR TODOS OS VALORES
                  const values = preserveAllValues();
                  setShowPassword(!showPassword);
                  // RESTAURAR TODOS OS VALORES
                  restoreAllValues(values);
                }}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Password */}
        {isSignUp && !isForgotPassword && (
                <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-gray-700">
              Confirmar Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirm-password"
                ref={confirmPasswordRef}
                    type="password"
                placeholder="Confirme sua senha"
                className="pl-10 h-12 border border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                key={`confirm-password-${isSignUp}-${isForgotPassword}`}
                    required
                  />
                </div>
          </div>
        )}

        {/* Keep connected checkbox (only for login) */}
        {!isSignUp && !isForgotPassword && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={keepConnected}
                onChange={(e) => {
                  e.stopPropagation();
                  // PRESERVAR TODOS OS VALORES
                  const values = preserveAllValues();
                  setKeepConnected(e.target.checked);
                  // RESTAURAR TODOS OS VALORES
                  restoreAllValues(values);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer select-none">
                Manter conectado
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>
                {isForgotPassword ? 'Enviando...' : 
                 isSignUp ? 'Criando conta...' : 'Entrando...'}
              </span>
            </div>
          ) : (
            <>
              <span>
                {isForgotPassword ? 'Enviar e-mail de recuperação' :
                 isSignUp ? 'Criar conta gratuita' : 'Entrar na plataforma'}
              </span>
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
                </Button>
              </form>
      </div>

      {/* Footer Links */}
      <div className="text-center space-y-4 mt-6">
        {/* Forgot Password / Back to Login */}
        {isForgotPassword && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // PRESERVAR TODOS OS VALORES
              const values = preserveAllValues();
              setIsForgotPassword(false);
              // RESTAURAR TODOS OS VALORES
              restoreAllValues(values);
            }}
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            ← Voltar ao login
          </button>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center text-xs text-gray-500">
          <Shield className="w-3 h-3 mr-1 text-green-500" />
          Conexão segura SSL
        </div>

        {/* Sign Up Link */}
        {!isForgotPassword && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // PRESERVAR TODOS OS VALORES
                const values = preserveAllValues();
                setIsSignUp(!isSignUp);
                // RESTAURAR TODOS OS VALORES
                restoreAllValues(values);
              }}
              className="inline-flex items-center justify-center w-full h-12 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              {isSignUp ? 'Fazer login' : 'Criar conta gratuita'}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Resend Confirmation Button */}
        {location.state?.requireEmailConfirmation && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                const email = emailRef.current?.value;
                if (email) {
                  await resendConfirmation(email);
                } else {
                  toast({
                    title: "Email necessário",
                    description: "Digite seu email para reenviar a confirmação.",
                    variant: "destructive",
                  });
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Reenviar email de confirmação
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const BrandSection = () => (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1623760404221-703c6d83fa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGFic3RyYWN0JTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc1NjgyNTkwNnww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Modern Architecture"
          className="w-full h-full object-cover"
                  />
                </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-slate-900/90" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="max-w-lg xl:max-w-xl 2xl:max-w-2xl">
          {/* Brand Identity */}
          <div className="mb-8 lg:mb-12">
            <div className="mb-4 lg:mb-6 flex items-center space-x-4 justify-start">
              <img 
                src="/logoarrudahub_white.png" 
                alt="Arruda Hub" 
                className="h-8 lg:h-10 xl:h-12"
              />
            </div>
            <p className="text-blue-300 text-lg lg:text-xl xl:text-2xl italic font-light">
              Sua gestão de ponta a ponta
            </p>
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl text-white mb-6 lg:mb-8 leading-tight text-left font-light text-balance">
            Mais de{' '}
            <span className="font-normal bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              15 Módulos
            </span>
          </h2>

          <p className="text-base lg:text-lg xl:text-xl text-blue-100 mb-10 lg:mb-12 leading-relaxed">
            Acesse todos os sistemas do Grupo Arruda em um só lugar. Gestão completa e integrada para sua empresa.
          </p>

          {/* Main Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {[
              {
                icon: Users,
                title: 'Gestão de Usuários',
                description: 'Controle de usuários e permissões'
              },
              {
                icon: BarChart3,
                title: 'Trade Marketing',
                description: 'Campanhas e promoções comerciais'
              },
              {
                icon: DollarSign,
                title: 'Financeiro',
                description: 'Controle financeiro e contabilidade'
              },
              {
                icon: Truck,
                title: 'Logística',
                description: 'Controle logístico e distribuição'
              },
              {
                icon: FileText,
                title: 'Acordos Comerciais',
                description: 'Registro de investimentos e concessões'
              },
              {
                icon: Package,
                title: 'Meus Produtos',
                description: 'Repositório central de produtos'
              },
              {
                icon: GraduationCap,
                title: 'LMS',
                description: 'Treinamentos e certificações'
              },
              {
                icon: Activity,
                title: 'Analytics',
                description: 'Relatórios e insights avançados'
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start space-x-3 w-full min-w-0"
              >
                <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20 flex-shrink-0">
                  <feature.icon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white text-sm lg:text-base font-medium mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-blue-200 text-xs lg:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white text-center">
        <div className="flex items-center justify-center mb-4">
          <img src="/logoarrudahub_white.png" alt="Arruda Hub" className="h-8" />
        </div>
        <h2 className="text-xl font-light text-white mb-2">Sua gestão de ponta a ponta</h2>
        <p className="text-blue-100 text-sm font-light">Mais de 15 módulos integrados</p>
      </div>

      {/* Form Container - Fixed responsive width */}
      <div className="w-full lg:w-96 xl:w-[28rem] 2xl:w-[32rem] flex-shrink-0 flex flex-col pt-32 lg:pt-0 h-screen">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12 bg-white">
          <LoginForm />
        </div>
        
        {/* Footer */}
        <div className="p-6 text-center border-t border-gray-200 bg-white">
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-gray-500">
            <button className="hover:text-gray-700 transition-colors">Termos de Uso</button>
            <button className="hover:text-gray-700 transition-colors">Privacidade</button>
            <button className="hover:text-gray-700 transition-colors">Segurança</button>
            <span>© 2024 Arruda Hub</span>
          </div>
        </div>
      </div>

      {/* Hero Container - Flex fill remaining space */}
      <div className="hidden lg:flex flex-1 h-screen">
        <BrandSection />
      </div>
    </div>
  );
};

export default Auth;