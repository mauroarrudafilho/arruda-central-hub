import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuthWithTenant';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, ChevronDown, Check, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TenantSelectorProps {
  showLabel?: boolean;
  variant?: 'default' | 'compact';
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ 
  showLabel = true, 
  variant = 'default' 
}) => {
  const { currentTenant, availableTenants, switchTenant, loading } = useTenant();
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleTenantSwitch = async (tenantId: string) => {
    try {
      const { error } = await switchTenant(tenantId);
      
      if (error) {
        toast({
          title: "Erro ao trocar de tenant",
          description: error.message || "Não foi possível trocar de tenant",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tenant alterado",
          description: "Você foi redirecionado para o novo tenant",
        });
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao trocar de tenant",
        variant: "destructive",
      });
    }
  };

  const getTenantInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadgeVariant = (plano?: string) => {
    switch (plano) {
      case 'enterprise':
        return 'default';
      case 'premium':
        return 'secondary';
      case 'basico':
      default:
        return 'outline';
    }
  };

  if (!currentTenant) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getTenantInitials(currentTenant.nome)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Trocar de Tenant</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableTenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => handleTenantSwitch(tenant.id)}
              disabled={loading || tenant.id === currentTenant.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getTenantInitials(tenant.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{tenant.nome}</span>
                  <span className="text-xs text-muted-foreground">{tenant.slug}</span>
                </div>
              </div>
              {tenant.id === currentTenant.id && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[200px]">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getTenantInitials(currentTenant.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{currentTenant.nome}</span>
              {showLabel && (
                <span className="text-xs text-muted-foreground">
                  {currentTenant.slug}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Selecionar Tenant</span>
          </DialogTitle>
          <DialogDescription>
            Escolha o tenant que você deseja acessar. Você só pode acessar tenants aos quais tem permissão.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {availableTenants.map((tenant) => (
            <div
              key={tenant.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                tenant.id === currentTenant.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !loading && tenant.id !== currentTenant.id && handleTenantSwitch(tenant.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!loading && tenant.id !== currentTenant.id) {
                    handleTenantSwitch(tenant.id);
                  }
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getTenantInitials(tenant.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{tenant.nome}</span>
                    {tenant.id === currentTenant.id && (
                      <Badge variant="default" className="text-xs">
                        Atual
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {tenant.slug}
                  </span>
                  {tenant.descricao && (
                    <span className="text-xs text-muted-foreground">
                      {tenant.descricao}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1">
                {tenant.plano && (
                  <Badge variant={getPlanBadgeVariant(tenant.plano)} className="text-xs">
                    {tenant.plano}
                  </Badge>
                )}
                {tenant.id === currentTenant.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="pt-3 border-t">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Tenants
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TenantSelector;
