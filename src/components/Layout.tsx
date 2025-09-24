import { Users, Shield, Activity, User, LogOut, Building2 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
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
import { ProjectSelector } from '@/components/ProjectSelector';

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
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Sistema de Gestão
            </h2>
          )}
          {isCollapsed && (
            <Building2 className="h-4 w-4 mx-auto" />
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
                {modulesLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {isCollapsed ? "..." : "Carregando módulos..."}
                  </div>
                ) : modules.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {isCollapsed ? "❌" : "Nenhum módulo disponível"}
                  </div>
                ) : (
                  modules.map((module) => {
                    const IconComponent = getIcon(module.icone);
                    return (
                      <SidebarMenuItem key={module.id}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={module.rota}
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
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto p-4">
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
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-card-foreground">
                {currentProject?.nome || "Sistema de Gestão"}
              </h1>
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