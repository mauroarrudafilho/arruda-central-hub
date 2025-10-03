import React from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Shield,
  User,
  Settings,
  Trash2,
  Plus,
  Edit
} from 'lucide-react';

export interface FeedbackOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const showFeedback = (options: FeedbackOptions) => {
  const { title, description, type = 'info', duration = 5000, action } = options;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
      default:
        return 'default';
    }
  };

  toast({
    title: (
      <div className="flex items-center gap-2">
        {getIcon()}
        {title}
      </div>
    ),
    description,
    variant: getVariant() as any,
    duration,
    action: action ? (
      <button
        onClick={action.onClick}
        className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        {action.label}
      </button>
    ) : undefined
  });
};

// Funções específicas para diferentes tipos de feedback
export const showSuccessFeedback = (title: string, description?: string) => {
  showFeedback({
    title,
    description,
    type: 'success'
  });
};

export const showErrorFeedback = (title: string, description?: string) => {
  showFeedback({
    title,
    description,
    type: 'error'
  });
};

export const showWarningFeedback = (title: string, description?: string) => {
  showFeedback({
    title,
    description,
    type: 'warning'
  });
};

export const showInfoFeedback = (title: string, description?: string) => {
  showFeedback({
    title,
    description,
    type: 'info'
  });
};

// Funções específicas para operações de usuário
export const showRoleFeedback = (action: 'add' | 'remove' | 'activate' | 'deactivate', roleName: string, success: boolean) => {
  const actionText = {
    add: 'adicionado',
    remove: 'removido',
    activate: 'ativado',
    deactivate: 'desativado'
  }[action];

  if (success) {
    showSuccessFeedback(
      `Role ${actionText}`,
      `O role "${roleName}" foi ${actionText} com sucesso.`
    );
  } else {
    showErrorFeedback(
      `Erro ao ${actionText} role`,
      `Não foi possível ${actionText} o role "${roleName}". Tente novamente.`
    );
  }
};

export const showPermissionFeedback = (action: 'add' | 'remove' | 'activate' | 'deactivate', permissionName: string, success: boolean) => {
  const actionText = {
    add: 'adicionada',
    remove: 'removida',
    activate: 'ativada',
    deactivate: 'desativada'
  }[action];

  if (success) {
    showSuccessFeedback(
      `Permissão ${actionText}`,
      `A permissão "${permissionName}" foi ${actionText} com sucesso.`
    );
  } else {
    showErrorFeedback(
      `Erro ao ${actionText} permissão`,
      `Não foi possível ${actionText} a permissão "${permissionName}". Tente novamente.`
    );
  }
};

export const showProjectFeedback = (action: 'add' | 'remove' | 'update', projectName: string, success: boolean) => {
  const actionText = {
    add: 'adicionado',
    remove: 'removido',
    update: 'atualizado'
  }[action];

  if (success) {
    showSuccessFeedback(
      `Projeto ${actionText}`,
      `O acesso ao projeto "${projectName}" foi ${actionText} com sucesso.`
    );
  } else {
    showErrorFeedback(
      `Erro ao ${actionText} projeto`,
      `Não foi possível ${actionText} o acesso ao projeto "${projectName}". Tente novamente.`
    );
  }
};

export const showUserFeedback = (action: 'update' | 'delete' | 'create', userName: string, success: boolean) => {
  const actionText = {
    update: 'atualizado',
    delete: 'removido',
    create: 'criado'
  }[action];

  if (success) {
    showSuccessFeedback(
      `Usuário ${actionText}`,
      `O usuário "${userName}" foi ${actionText} com sucesso.`
    );
  } else {
    showErrorFeedback(
      `Erro ao ${actionText} usuário`,
      `Não foi possível ${actionText} o usuário "${userName}". Tente novamente.`
    );
  }
};

export const showSessionFeedback = (action: 'terminate' | 'extend', success: boolean) => {
  const actionText = {
    terminate: 'terminada',
    extend: 'estendida'
  }[action];

  if (success) {
    showSuccessFeedback(
      `Sessão ${actionText}`,
      `A sessão foi ${actionText} com sucesso.`
    );
  } else {
    showErrorFeedback(
      `Erro ao ${actionText} sessão`,
      `Não foi possível ${actionText} a sessão. Tente novamente.`
    );
  }
};

export const showSecurityFeedback = (action: 'resolve' | 'escalate', success: boolean) => {
  const actionText = {
    resolve: 'resolvido',
    escalate: 'escalado'
  }[action];

  if (success) {
    showSuccessFeedback(
      `Log de segurança ${actionText}`,
      `O log de segurança foi ${actionText} com sucesso.`
    );
  } else {
    showErrorFeedback(
      `Erro ao ${actionText} log de segurança`,
      `Não foi possível ${actionText} o log de segurança. Tente novamente.`
    );
  }
};

// Hook para feedback com loading
export const useFeedback = () => {
  const [loading, setLoading] = React.useState(false);

  const withFeedback = async <T,>(
    operation: () => Promise<T>,
    successMessage: string,
    errorMessage: string,
    options?: Partial<FeedbackOptions>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await operation();
      showSuccessFeedback(successMessage, options?.description);
      return result;
    } catch (error) {
      showErrorFeedback(errorMessage, error instanceof Error ? error.message : undefined);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    withFeedback
  };
};



