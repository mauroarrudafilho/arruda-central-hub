import React from 'react';
import { useArrudaAuth } from '../auth/useArrudaAuth';

interface PermissionGateProps {
  children: React.ReactNode;
  module: string;
  action: string;
  fallback?: React.ReactNode;
  requireAdmin?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  module,
  action,
  fallback = null,
  requireAdmin = false,
}) => {
  const { hasPermission, isAdmin, user } = useArrudaAuth();

  // Se não está logado, não mostrar nada
  if (!user) {
    return <>{fallback}</>;
  }

  // Se requer admin e não é admin
  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  // Se não tem a permissão específica
  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

