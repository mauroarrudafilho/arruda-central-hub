import React from 'react';
import { Search, Bell, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthState } from '@/hooks/useAuth';
import { useDesignTokens } from '@/hooks/useDesignTokens';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onLogout, searchTerm = '', onSearchChange }) => {
  const { user, signOut } = useAuthState();
  const designTokens = useDesignTokens();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange?.(value);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onLogout?.();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getUserInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };


  return (
    <header 
      className="w-full border-b border-gray-200 bg-white shadow-sm"
      style={{ 
        backgroundColor: designTokens.colors.primary.DEFAULT,
        borderColor: designTokens.colors.primary[200]
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Nome */}
          <div className="flex items-center space-x-4">
            <img 
              src="/logoarrudahub_white.png" 
              alt="Arruda Hub" 
              className="h-8 w-auto" 
            />
            <div className="border-l border-white/20 pl-4">
              <h1 
                className="text-lg font-semibold text-white"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Arruda Hub
              </h1>
              <p 
                className="text-xs text-white/80"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Portal Central
              </p>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
              />
              <Input
                type="text"
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              />
            </form>
          </div>

          {/* Ações do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notificações</p>
              </TooltipContent>
            </Tooltip>

            {/* Configurações */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações</p>
              </TooltipContent>
            </Tooltip>

            {/* Perfil do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0 hover:bg-white/10"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.email} />
                    <AvatarFallback 
                      className="text-xs font-medium"
                      style={{ 
                        backgroundColor: designTokens.colors.secondary.DEFAULT,
                        color: 'white',
                        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                      }}
                    >
                      {user?.email ? getUserInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p 
                      className="text-sm font-medium leading-none"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      {user?.email}
                    </p>
                    <p 
                      className="text-xs leading-none text-muted-foreground"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Administrador
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notificações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
