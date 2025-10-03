import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  MoreVertical, 
  Shield, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
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
import { useUserPermissions, Permission, UserPermission } from '@/hooks/useUserPermissions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PermissionCardProps {
  permission: Permission;
  userPermission?: UserPermission;
  userId: string;
  onPermissionUpdate?: () => void;
  showActions?: boolean;
  source?: 'role' | 'direct' | 'both';
  roles?: string[];
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  userPermission,
  userId,
  onPermissionUpdate,
  showActions = true,
  source = 'role',
  roles = []
}) => {
  const { addDirectPermission, removeDirectPermission, toggleDirectPermission } = useUserPermissions(userId);
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const hasDirectPermission = !!userPermission;
  const isActive = userPermission?.ativo ?? (source === 'role');
  const isExpired = userPermission?.data_expiracao && new Date(userPermission.data_expiracao) < new Date();
  const isExpiringSoon = userPermission?.data_expiracao && 
    new Date(userPermission.data_expiracao) > new Date() && 
    new Date(userPermission.data_expiracao) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'read':
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'write':
      case 'edit':
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
      case 'remove':
        return <Trash2 className="h-4 w-4" />;
      case 'create':
      case 'add':
        return <Plus className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusIcon = () => {
    if (isExpired) return <XCircle className="h-4 w-4 text-red-500" />;
    if (isExpiringSoon) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (isActive) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isExpired) return 'Expirado';
    if (isExpiringSoon) return 'Expira em breve';
    if (isActive) return 'Ativo';
    return 'Inativo';
  };

  const getStatusVariant = () => {
    if (isExpired) return 'destructive';
    if (isExpiringSoon) return 'secondary';
    if (isActive) return 'default';
    return 'outline';
  };

  const getSourceVariant = () => {
    switch (source) {
      case 'direct':
        return 'default';
      case 'role':
        return 'secondary';
      case 'both':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSourceText = () => {
    switch (source) {
      case 'direct':
        return 'Direta';
      case 'role':
        return 'Via Role';
      case 'both':
        return 'Conflito';
      default:
        return 'Desconhecido';
    }
  };

  const getExpirationTextColor = () => {
    if (isExpired) return 'text-red-600';
    if (isExpiringSoon) return 'text-yellow-600';
    return '';
  };

  const handleAddDirectPermission = async () => {
    try {
      setIsUpdating(true);
      await addDirectPermission({
        user_id: userId,
        permission_id: permission.id,
        ativo: true
      });
      onPermissionUpdate?.();
    } catch (error) {
      console.error('Erro ao adicionar permissão:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveDirectPermission = async () => {
    if (!userPermission) return;
    
    try {
      setIsUpdating(true);
      await removeDirectPermission(userPermission.id);
      onPermissionUpdate?.();
      setShowRemoveDialog(false);
    } catch (error) {
      console.error('Erro ao remover permissão:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDirectPermission = async (active: boolean) => {
    if (!userPermission) return;
    
    try {
      setIsUpdating(true);
      await toggleDirectPermission(userPermission.id, active);
      onPermissionUpdate?.();
    } catch (error) {
      console.error('Erro ao alterar status da permissão:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getActionIcon(permission.acao)}
              <CardTitle className="text-lg font-semibold">
                {permission.nome}
              </CardTitle>
            </div>
            
            {showActions && hasDirectPermission && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowRemoveDialog(true)}>
                    Remover Permissão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {permission.descricao && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {permission.descricao}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Módulo:</span>
              <p className="text-gray-600">{permission.modulo}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Ação:</span>
              <p className="text-gray-600">{permission.acao}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Recurso:</span>
              <p className="text-gray-600">{permission.recurso}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Origem:</span>
              <Badge variant={getSourceVariant() as any} className="ml-1">
                {getSourceText()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={getStatusVariant() as any}>
                {getStatusText()}
              </Badge>
            </div>

            {showActions && (
              <div className="flex items-center gap-2">
                {hasDirectPermission ? (
                  <>
                    <span className="text-sm text-gray-600">Ativo</span>
                    <Switch
                      checked={isActive}
                      onCheckedChange={handleToggleDirectPermission}
                      disabled={isUpdating}
                    />
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleAddDirectPermission}
                    disabled={isUpdating}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>
            )}
          </div>

          {source === 'both' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Permissão concedida via role e diretamente
                </span>
              </div>
            </div>
          )}

          {userPermission?.data_expiracao && (
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className={getExpirationTextColor()}>
                  Expira em {format(new Date(userPermission.data_expiracao), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {roles.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Roles:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map(roleId => (
                  <Badge key={roleId} variant="outline" className="text-xs">
                    {roleId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Permissão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a permissão "{permission.nome}" deste usuário? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveDirectPermission}
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
