import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Hub from "./pages/Hub";
import Redirect from "./pages/Redirect";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import UserCreate from "./pages/UserCreate";
import Roles from "./pages/Roles";
import Audit from "./pages/Audit";
import Profile from "./pages/Profile";
import Sessions from "./pages/Sessions";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import AnalyticsModules from "./pages/AnalyticsModules";
import AnalyticsScreens from "./pages/AnalyticsScreens";
import AnalyticsPerformance from "./pages/AnalyticsPerformance";
import Modules from "./pages/Modules";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import SecurityLogs from "./pages/SecurityLogs";
// New Hub Components
import RBAC from "./pages/RBAC";
import AuditHub from "./pages/AuditHub";
import ModulesHub from "./pages/ModulesHub";
// Admin Panel Components
import AdminPanel from "./pages/AdminPanel";
import SystemSettings from "./pages/admin/SystemSettings";
import SecuritySettings from "./pages/admin/SecuritySettings";
import IntegrationsSettings from "./pages/admin/IntegrationsSettings";
import MonitoringSettings from "./pages/admin/MonitoringSettings";
import BackupSettings from "./pages/admin/BackupSettings";
import MaintenanceSettings from "./pages/admin/MaintenanceSettings";
import { AuthGuard } from "./components/AuthGuard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProjectProvider } from "./contexts/ProjectContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/hub" element={
              <AuthGuard>
                <Hub />
              </AuthGuard>
            } />
            <Route path="/redirect" element={
              <AuthGuard>
                <Redirect />
              </AuthGuard>
            } />
            {/* RBAC Routes with New Layout */}
            <Route path="/" element={<ProtectedRoute component={Dashboard} />} />
            <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
            
            {/* Analytics Hub */}
            <Route path="/analytics" element={<ProtectedRoute component={Analytics} />} />
            <Route path="/analytics/modules" element={<ProtectedRoute component={AnalyticsModules} />} />
            <Route path="/analytics/screens" element={<ProtectedRoute component={AnalyticsScreens} />} />
            <Route path="/analytics/performance" element={<ProtectedRoute component={AnalyticsPerformance} />} />
            
            {/* Users Hub */}
            <Route path="/users" element={<ProtectedRoute component={Users} />} />
            <Route path="/users/new" element={<ProtectedRoute component={UserCreate} />} />
            <Route path="/users/:id" element={<ProtectedRoute component={UserDetail} />} />
            <Route path="/users/:id/edit" element={<ProtectedRoute component={UserDetail} />} />
            <Route path="/gestao-usuarios" element={<Navigate to="/users" replace />} />
            
            {/* RBAC Hub */}
            <Route path="/rbac" element={<ProtectedRoute component={RBAC} requireAdmin />} />
            <Route path="/roles" element={<Navigate to="/rbac" replace />} />
            <Route path="/roles/*" element={<ProtectedRoute component={Roles} requireAdmin />} />
            
            {/* Audit Hub */}
            <Route path="/audit" element={<ProtectedRoute component={AuditHub} requireAdmin />} />
            <Route path="/audit/*" element={<ProtectedRoute component={Audit} requireAdmin />} />
            
            {/* Security Logs */}
            <Route path="/security-logs" element={<ProtectedRoute component={SecurityLogs} requireAdmin />} />
            <Route path="/security-logs/*" element={<ProtectedRoute component={SecurityLogs} requireAdmin />} />
            
            {/* Sessions */}
            <Route path="/sessions" element={<ProtectedRoute component={Sessions} requireAdmin />} />
            
            {/* Modules Hub */}
            <Route path="/modules" element={<ProtectedRoute component={ModulesHub} requireAdmin />} />
            <Route path="/modules/*" element={<ProtectedRoute component={Modules} requireAdmin />} />
            
            {/* Settings */}
            <Route path="/settings" element={<ProtectedRoute component={Settings} requireAdmin />} />
            <Route path="/settings/*" element={<ProtectedRoute component={Settings} requireAdmin />} />
            
            {/* Profile */}
            <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
            
            {/* Admin Panel */}
            <Route path="/admin" element={<ProtectedRoute component={AdminPanel} requireAdmin />} />
            <Route path="/admin/settings" element={<ProtectedRoute component={SystemSettings} requireAdmin />} />
            <Route path="/admin/security" element={<ProtectedRoute component={SecuritySettings} requireAdmin />} />
            <Route path="/admin/integrations" element={<ProtectedRoute component={IntegrationsSettings} requireAdmin />} />
            <Route path="/admin/monitoring" element={<ProtectedRoute component={MonitoringSettings} requireAdmin />} />
            <Route path="/admin/backup" element={<ProtectedRoute component={BackupSettings} requireAdmin />} />
            <Route path="/admin/maintenance" element={<ProtectedRoute component={MaintenanceSettings} requireAdmin />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
