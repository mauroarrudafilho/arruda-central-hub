import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useDesignTokens } from '@/hooks/useDesignTokens';

interface SystemStatusProps {
  loading?: boolean;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ loading = false }) => {
  const designTokens = useDesignTokens();

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  // Status do sistema - mais discreto
  const systemStatus = [
    {
      type: 'success',
      message: 'Todos os sistemas operacionais',
      icon: CheckCircle
    },
    {
      type: 'warning',
      message: '2 módulos em manutenção',
      icon: AlertTriangle
    }
  ];

  return (
    <div className="flex items-center space-x-4">
      {systemStatus.map((status) => {
        const IconComponent = status.icon;
        
        return (
          <Badge
            key={status.message}
            variant="outline"
            className="flex items-center space-x-1 px-3 py-1"
            style={{
              backgroundColor: status.type === 'success' 
                ? designTokens.colors.success[50] 
                : designTokens.colors.warning[50],
              borderColor: status.type === 'success' 
                ? designTokens.colors.success[200] 
                : designTokens.colors.warning[200],
              color: status.type === 'success' 
                ? designTokens.colors.success[800] 
                : designTokens.colors.warning[800],
              fontFamily: designTokens.typography.fontFamily.sans.join(', ')
            }}
          >
            <IconComponent className="h-3 w-3" />
            <span className="text-xs">{status.message}</span>
          </Badge>
        );
      })}
    </div>
  );
};

export default SystemStatus;
