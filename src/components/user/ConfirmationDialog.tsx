import React from 'react';
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
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  Shield,
  Trash2,
  User,
  Settings
} from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = 'info',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  icon
}) => {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      case 'info':
      default:
        return 'default';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'info':
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={getConfirmButtonClass()}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Componentes específicos para diferentes tipos de confirmação
export const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, itemType, loading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Remover ${itemType}`}
    description={`Tem certeza que deseja remover "${itemName}"? Esta ação não pode ser desfeita.`}
    type="danger"
    confirmText="Remover"
    loading={loading}
    icon={<Trash2 className="h-6 w-6 text-red-600" />}
  />
);

export const RoleConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roleName: string;
  action: 'add' | 'remove' | 'activate' | 'deactivate';
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, roleName, action, loading = false }) => {
  const getActionText = () => {
    switch (action) {
      case 'add':
        return 'adicionar';
      case 'remove':
        return 'remover';
      case 'activate':
        return 'ativar';
      case 'deactivate':
        return 'desativar';
      default:
        return 'modificar';
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'add':
        return <User className="h-6 w-6 text-green-600" />;
      case 'remove':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'activate':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'deactivate':
        return <XCircle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Settings className="h-6 w-6 text-blue-600" />;
    }
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${getActionText().charAt(0).toUpperCase() + getActionText().slice(1)} Role`}
      description={`Tem certeza que deseja ${getActionText()} o role "${roleName}"?`}
      type={action === 'remove' ? 'danger' : 'warning'}
      confirmText={getActionText().charAt(0).toUpperCase() + getActionText().slice(1)}
      loading={loading}
      icon={getActionIcon()}
    />
  );
};

export const PermissionConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  permissionName: string;
  action: 'add' | 'remove' | 'activate' | 'deactivate';
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, permissionName, action, loading = false }) => {
  const getActionText = () => {
    switch (action) {
      case 'add':
        return 'adicionar';
      case 'remove':
        return 'remover';
      case 'activate':
        return 'ativar';
      case 'deactivate':
        return 'desativar';
      default:
        return 'modificar';
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'add':
        return <Shield className="h-6 w-6 text-green-600" />;
      case 'remove':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'activate':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'deactivate':
        return <XCircle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Settings className="h-6 w-6 text-blue-600" />;
    }
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${getActionText().charAt(0).toUpperCase() + getActionText().slice(1)} Permissão`}
      description={`Tem certeza que deseja ${getActionText()} a permissão "${permissionName}"?`}
      type={action === 'remove' ? 'danger' : 'warning'}
      confirmText={getActionText().charAt(0).toUpperCase() + getActionText().slice(1)}
      loading={loading}
      icon={getActionIcon()}
    />
  );
};



