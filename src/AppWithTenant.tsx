import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuthWithTenant';
import { TenantProvider } from '@/contexts/TenantContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { LayoutWithTenant } from '@/components/LayoutWithTenant';
import { AuthGuard } from '@/components/AuthGuard';
import { HubGuard } from '@/components/HubGuard';

// Páginas
import Auth from '@/pages/Auth';
import HubWithTenant from '@/pages/HubWithTenant';
import Users from '@/pages/Users';
import Roles from '@/pages/Roles';
import Profile from '@/pages/Profile';
import Redirect from '@/pages/Redirect';

// Componente de Loading
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <ProjectProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Rota de autenticação */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Rotas protegidas */}
                <Route
                  path="/*"
                  element={
                    <AuthGuard>
                      <TenantGuard>
                        <LayoutWithTenant>
                          <Routes>
                            <Route path="/" element={<Navigate to="/hub" replace />} />
                            <Route path="/hub" element={<HubWithTenant />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/roles" element={<Roles />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/redirect" element={<Redirect />} />
                            <Route path="*" element={<Navigate to="/hub" replace />} />
                          </Routes>
                        </LayoutWithTenant>
                      </TenantGuard>
                    </AuthGuard>
                  }
                />
              </Routes>
              
              <Toaster />
            </div>
          </ProjectProvider>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

// Componente para verificar se tenant está selecionado
const TenantGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTenant, loading } = useTenant();
  const { user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Selecione uma Organização</h2>
          <p className="text-muted-foreground mb-6">
            Você precisa selecionar uma organização para continuar.
          </p>
          <TenantSelector />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default App;









