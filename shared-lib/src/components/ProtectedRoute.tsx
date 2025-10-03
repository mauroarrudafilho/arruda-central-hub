import React from 'react';
import { useArrudaAuth } from '../auth/useArrudaAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    module: string;
    action: string;
  };
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requireAdmin = false,
  fallback,
  redirectTo,
}) => {
  const { user, loading, hasPermission, isAdmin } = useArrudaAuth();

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    if (redirectTo) {
      window.location.href = redirectTo;
      return null;
    }
    
    return fallback || (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Verificar se é admin quando necessário
  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão de administrador.</p>
        </div>
      </div>
    );
  }

  // Verificar permissão específica
  if (requiredPermission) {
    const hasRequiredPermission = hasPermission(
      requiredPermission.module,
      requiredPermission.action
    );

    if (!hasRequiredPermission) {
      return fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
            <p className="text-muted-foreground mt-2">
              Você não tem permissão para {requiredPermission.action} no módulo {requiredPermission.module}.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

