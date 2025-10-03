import React, { createContext, useContext, useEffect } from 'react';
import { initializeArrudaAuth, useArrudaAuth } from './useArrudaAuth';
import { SessionConfig } from '../types';

interface AuthProviderProps {
  children: React.ReactNode;
  config: SessionConfig;
}

const AuthContext = createContext<ReturnType<typeof useArrudaAuth> | null>(null);

export const ArrudaAuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config,
}) => {
  useEffect(() => {
    // Inicializar o SessionManager na montagem do provider
    initializeArrudaAuth(config);
  }, []);

  const auth = useArrudaAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within ArrudaAuthProvider');
  }
  return context;
};

