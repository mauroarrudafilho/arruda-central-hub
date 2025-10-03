import React from 'react';
import { AuthGuard } from './AuthGuard';
import { RBACLayout } from './RBACSidebar';

interface ProtectedRouteProps {
  component: React.ComponentType;
  requireAdmin?: boolean;
}

/**
 * Higher-Order Component para rotas protegidas
 * Simplifica a definição de rotas que precisam de autenticação e layout RBAC
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  requireAdmin = false 
}) => {
  return (
    <AuthGuard requireAdmin={requireAdmin}>
      <RBACLayout>
        <Component />
      </RBACLayout>
    </AuthGuard>
  );
};
