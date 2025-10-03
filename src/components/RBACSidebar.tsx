import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthState } from '@/hooks/useAuth';
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
import {
  Home,
  Users,
  Shield,
  BarChart3,
  Eye,
  Settings,
  ExternalLink,
  LogOut,
  Building2,
  Globe,
} from 'lucide-react';

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Usuários',
    url: '/users',
    icon: Users,
  },
  {
    title: 'Roles e Permissões',
    url: '/rbac',
    icon: Shield,
  },
  {
    title: 'Auditoria',
    url: '/audit',
    icon: Eye,
  },
  {
    title: 'Logs de Segurança',
    url: '/security-logs',
    icon: Shield,
  },
  {
    title: 'Módulos e Sistema',
    url: '/modules',
    icon: Globe,
  },
  {
    title: 'Admin Panel',
    url: '/admin',
    icon: Settings,
  },
];

function RBACSidebar() {
  const { state } = useSidebar();
  const { signOut, user, isAdmin } = useAuthState();
  const navigate = useNavigate();

  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const renderSidebarItem = (item: SidebarItem) => {
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink 
            to={item.url}
            end
            className={({ isActive }) => 
              isActive 
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                : 'hover:bg-sidebar-accent/50'
            }
          >
            <item.icon className="h-4 w-4" />
            {!isCollapsed && (
              <>
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="p-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                RBAC Manager
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
        {/* Hub Central Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('/hub', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {!isCollapsed && <span>Hub Central</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {isCollapsed ? "•••" : "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map(item => renderSidebarItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {isCollapsed ? "🔧" : "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin"
                      className={({ isActive }) => 
                        isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <Settings className="h-4 w-4" />
                      {!isCollapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Info & Logout */}
        <div className="mt-auto p-4 space-y-2">
          {!isCollapsed && (
            <div className="text-xs text-sidebar-foreground/70 mb-2">
              <div className="font-medium">{user?.email}</div>
              <div className="flex items-center space-x-1">
                {isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
                <span>RBAC Manager</span>
              </div>
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

interface RBACLayoutProps {
  children: React.ReactNode;
}

export const RBACLayout = ({ children }: RBACLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <RBACSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-card-foreground">
                Sistema de Gestão RBAC
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
