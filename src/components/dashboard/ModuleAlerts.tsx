import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, X, Clock } from 'lucide-react';
import { useDesignTokens } from '@/hooks/useDesignTokens';

interface Alert {
  id: string;
  module: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved?: boolean;
}

interface ModuleAlertsProps {
  alerts?: Alert[];
  loading?: boolean;
  onDismiss?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

const ModuleAlerts: React.FC<ModuleAlertsProps> = ({ 
  alerts = [
    {
      id: '1',
      module: 'Financeiro',
      type: 'warning',
      title: 'Sincronização de dados atrasada',
      description: 'A última sincronização com o sistema financeiro foi há 2 horas.',
      timestamp: '2025-01-30T10:30:00Z'
    },
    {
      id: '2',
      module: 'Logística',
      type: 'info',
      title: 'Atualização de sistema disponível',
      description: 'Nova versão do módulo de logística está disponível para atualização.',
      timestamp: '2025-01-30T09:15:00Z'
    },
    {
      id: '3',
      module: 'Analytics',
      type: 'critical',
      title: 'Falha na geração de relatórios',
      description: 'Sistema não está conseguindo gerar relatórios de analytics.',
      timestamp: '2025-01-30T08:45:00Z'
    }
  ], 
  loading = false,
  onDismiss,
  onResolve
}) => {
  const designTokens = useDesignTokens();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    onDismiss?.(alertId);
  };

  const handleResolve = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    onResolve?.(alertId);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bg: designTokens.colors.destructive[50],
          text: designTokens.colors.destructive[800],
          border: designTokens.colors.destructive[200],
          icon: designTokens.colors.destructive.DEFAULT
        };
      case 'warning':
        return {
          bg: designTokens.colors.warning[50],
          text: designTokens.colors.warning[800],
          border: designTokens.colors.warning[200],
          icon: designTokens.colors.warning.DEFAULT
        };
      case 'info':
        return {
          bg: designTokens.colors.primary[50],
          text: designTokens.colors.primary[800],
          border: designTokens.colors.primary[200],
          icon: designTokens.colors.primary.DEFAULT
        };
      default:
        return {
          bg: designTokens.colors.neutral[50],
          text: designTokens.colors.neutral[800],
          border: designTokens.colors.neutral[200],
          icon: designTokens.colors.neutral.DEFAULT
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  if (loading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle 
            className="text-lg font-semibold"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Alertas do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={`alert-loading-${index}`} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card 
        className="p-6"
        style={{ 
          borderColor: designTokens.colors.neutral[200],
          fontFamily: designTokens.typography.fontFamily.sans.join(', ')
        }}
      >
        <CardHeader>
          <CardTitle 
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Alertas do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: designTokens.colors.success.DEFAULT }}
            />
            <p 
              className="text-gray-600"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              Nenhum alerta ativo no momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="p-6"
      style={{ 
        borderColor: designTokens.colors.neutral[200],
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
    >
      <CardHeader>
        <CardTitle 
          className="text-lg font-semibold text-gray-900"
          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
        >
          Alertas do Sistema
        </CardTitle>
        <p 
          className="text-sm text-gray-600"
          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
        >
          {visibleAlerts.length} alerta{visibleAlerts.length !== 1 ? 's' : ''} ativo{visibleAlerts.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleAlerts.map((alert) => {
            const colors = getAlertColor(alert.type);
            
            return (
              <div
                key={alert.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div 
                      className="mt-0.5"
                      style={{ color: colors.icon }}
                    >
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant="outline"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.text,
                            fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                          }}
                        >
                          {alert.module}
                        </Badge>
                        <Badge 
                          variant="outline"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.text,
                            fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                          }}
                        >
                          {alert.type}
                        </Badge>
                      </div>
                      <h4 
                        className="font-medium text-gray-900 mb-1"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      >
                        {alert.title}
                      </h4>
                      <p 
                        className="text-sm text-gray-600 mb-2"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      >
                        {alert.description}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}>
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {alert.type === 'critical' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id)}
                        style={{
                          borderColor: designTokens.colors.success[300],
                          color: designTokens.colors.success[700],
                          fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                        }}
                      >
                        Resolver
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(alert.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleAlerts;
