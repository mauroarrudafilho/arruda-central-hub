import { Users, Shield, Activity, User, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/hooks/useAuth';

const menuItems = [
  { title: 'Usuários', url: '/users', icon: Users },
  { title: 'Papéis & Permissões', url: '/roles', icon: Shield },
  { title: 'Auditoria', url: '/audit', icon: Activity },
  { title: 'Meu Perfil', url: '/profile', icon: User },
];

function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuthState();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <h2 className={`font-bold text-sidebar-foreground ${isCollapsed ? 'hidden' : 'block'}`}>
            Gestão de Usuários
          </h2>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-card-foreground">
                Gestão de Usuários
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