import { Users, Shield, Activity, User, LogOut, Building2, Home } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/hooks/useAuth';
import { useProjects, useProjectModules } from '@/hooks/useProjects';
import { useProjectContext } from '@/contexts/ProjectContext';

function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuthState();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const { currentProject, setCurrentProject, setProjects } = useProjectContext();
  const { modules, loading: modulesLoading } = useProjectModules(currentProject?.id || null);

  // Atualizar projetos no contexto quando carregados
  useEffect(() => {
    if (!projectsLoading && projects.length > 0) {
      setProjects(projects);
      
      // Se não há projeto atual, selecionar o primeiro
      if (!currentProject && projects.length > 0) {
        setCurrentProject(projects[0]);
      }
    }
  }, [projects, projectsLoading, currentProject, setProjects, setCurrentProject]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Mapa de ícones disponíveis
  const iconMap: Record<string, React.ComponentType<any>> = {
    Users,
    Shield,
    FileText: Activity,
    User,
    Building2,
    LogOut,
    Home,
  };

  // Função para obter ícone dinâmico
  const getIcon = (iconName: string | null): React.ComponentType<any> => {
    if (!iconName) return User;
    
    return iconMap[iconName] || User;
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="p-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Sistema de Gestão
              </h2>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {currentProject && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {isCollapsed ? "•••" : currentProject.nome}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(() => {
                  if (modulesLoading) {
                    return (
                      <div className="p-2 text-sm text-muted-foreground">
                        {isCollapsed ? "..." : "Carregando módulos..."}
                      </div>
                    );
                  }
                  
                  if (modules.length === 0) {
                    return (
                      <div className="p-2 text-sm text-muted-foreground">
                        {isCollapsed ? "❌" : "Nenhum módulo disponível"}
                      </div>
                    );
                  }
                  
                  return modules
                    .filter((module) => module.rota && !module.rota.startsWith('http'))
                    .map((module) => {
                      const IconComponent = getIcon(module.icone);
                      const targetRoute = module.rota || '/';
                      return (
                        <SidebarMenuItem key={module.id}>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to={targetRoute}
                              end
                              className={({ isActive }) => 
                                isActive 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                                  : 'hover:bg-sidebar-accent/50'
                              }
                            >
                              <IconComponent className="h-4 w-4" />
                              {!isCollapsed && <span>{module.nome}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    });
                })()}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto p-4 space-y-2">
          {/* Botão para voltar ao Hub */}
          <Button 
            onClick={() => navigate('/hub')}
            variant="ghost" 
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Home className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Voltar ao Hub</span>}
          </Button>
          
          {!isCollapsed && (
            <div className="text-xs text-sidebar-foreground/70 mb-2">
              {user?.email}
            </div>
          )}
          <Button 
            onClick={handleSignOut}
            variant="ghost" 
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { currentProject } = useProjectContext();
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger />
            <div className="ml-4 flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-card-foreground">
                {currentProject?.nome || "Sistema de Gestão"}
              </h1>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/hub')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4 mr-2" />
                Hub
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
