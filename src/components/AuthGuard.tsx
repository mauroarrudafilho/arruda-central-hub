import { useAuthState } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const AuthGuard = ({ children, requireAdmin = false }: AuthGuardProps) => {
  const { user, loading, isAdmin, adminChecked } = useAuthState();
  const location = useLocation();

  // Se ainda está carregando, mostrar spinner
  if (loading || (requireAdmin && !adminChecked)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário, redirecionar para login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar se o email foi confirmado
  if (!user.email_confirmed_at) {
    // Mostrar toast apenas uma vez
    if (!sessionStorage.getItem('email-confirmation-shown')) {
      toast({
        title: "Email não confirmado",
        description: "Por favor, confirme seu email antes de acessar o sistema.",
        variant: "destructive",
      });
      sessionStorage.setItem('email-confirmation-shown', 'true');
    }
    return <Navigate to="/auth" state={{ from: location, requireEmailConfirmation: true }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};