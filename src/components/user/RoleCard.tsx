import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  MoreVertical, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserRoles, UserRole } from '@/hooks/useUserRoles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RoleCardProps {
  role: UserRole;
  userId: string;
  onRoleUpdate?: () => void;
  showActions?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  userId,
  onRoleUpdate,
  showActions = true
}) => {
  const { toggleRoleStatus, removeRoleFromUser } = useUserRoles(userId);
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const isExpired = role.data_expiracao && new Date(role.data_expiracao) < new Date();
  const isExpiringSoon = role.data_expiracao && 
    new Date(role.data_expiracao) > new Date() && 
    new Date(role.data_expiracao) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const handleToggleStatus = async (active: boolean) => {
    try {
      setIsUpdating(true);
      await toggleRoleStatus(role.id, active);
      onRoleUpdate?.();
    } catch (error) {
      console.error('Erro ao alterar status do role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveRole = async () => {
    try {
      setIsUpdating(true);
      await removeRoleFromUser(role.id);
      onRoleUpdate?.();
      setShowRemoveDialog(false);
    } catch (error) {
      console.error('Erro ao remover role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = () => {
    if (isExpired) return <XCircle className="h-4 w-4 text-red-500" />;
    if (isExpiringSoon) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (role.ativo) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isExpired) return 'Expirado';
    if (isExpiringSoon) return 'Expira em breve';
    if (role.ativo) return 'Ativo';
    return 'Inativo';
  };

  const getStatusVariant = () => {
    if (isExpired) return 'destructive';
    if (isExpiringSoon) return 'secondary';
    if (role.ativo) return 'default';
    return 'outline';
  };

  const getExpirationTextColor = () => {
    if (isExpired) return 'text-red-600';
    if (isExpiringSoon) return 'text-yellow-600';
    return '';
  };

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: role.cor }}
              />
              <CardTitle className="text-lg font-semibold">
                {role.nome}
              </CardTitle>
            </div>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowRemoveDialog(true)}>
                    Remover Role
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {role.descricao && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {role.descricao}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={getStatusVariant() as any}>
                {getStatusText()}
              </Badge>
            </div>

            {showActions && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ativo</span>
                <Switch
                  checked={role.ativo}
                  onCheckedChange={handleToggleStatus}
                  disabled={isUpdating}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Concedido em {format(new Date(role.data_concessao), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>

            {role.data_expiracao && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className={getExpirationTextColor()}>
                  Expira em {format(new Date(role.data_expiracao), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          {isExpired && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Este role expirou e precisa ser renovado
                </span>
              </div>
            </div>
          )}

          {isExpiringSoon && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Este role expira em breve
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Role</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o role "{role.nome}" deste usuário? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              className="bg-red-600 hover:bg-red-700"
              disabled={isUpdating}
            >
              {isUpdating ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
