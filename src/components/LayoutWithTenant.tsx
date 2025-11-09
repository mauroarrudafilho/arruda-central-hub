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
import { useAuth } from '@/hooks/useAuthWithTenant';
import { useProjectsWithTenant } from '@/hooks/useProjectsWithTenant';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useTenant } from '@/contexts/TenantContext';
import TenantSelector from '@/components/TenantSelector';

function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user, currentTenant } = useAuth();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjectsWithTenant();
  const { currentProject, setCurrentProject, setProjects } = useProjectContext();

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
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" />
          </div>
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {currentTenant?.nome || 'Arruda Hub'}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {currentTenant?.slug || 'Sistema'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Seletor de Tenant */}
        <SidebarGroup>
          <SidebarGroupLabel>Organização</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <TenantSelector variant="compact" showLabel={!isCollapsed} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navegação Principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/hub">
                    <Home className="size-4" />
                    <span>Hub</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projetos */}
        {projects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Projetos</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => {
                  const Icon = getIcon('Building2');
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentProject?.id === project.id}
                        onClick={() => setCurrentProject(project)}
                      >
                        <div className="flex items-center gap-2 cursor-pointer">
                          <Icon className="size-4" />
                          <span className="truncate">{project.nome}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulos do Sistema */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/users">
                    <Users className="size-4" />
                    <span>Usuários</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/roles">
                    <Shield className="size-4" />
                    <span>Roles</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Usuário */}
        <SidebarGroup>
          <SidebarGroupLabel>Usuário</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/profile">
                    <User className="size-4" />
                    <span>Perfil</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="size-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export const LayoutWithTenant = ({ children }: LayoutProps) => {
  const { currentProject } = useProjectContext();
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger />
            <div className="ml-4 flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-card-foreground">
                {currentProject?.nome || currentTenant?.nome || "Sistema de Gestão"}
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
            
            {/* Indicador de Tenant no Header */}
            <div className="ml-auto flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{currentTenant?.nome}</span>
              </div>
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









