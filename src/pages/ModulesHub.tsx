import React from 'react';
import { CardHub, CardHubItem } from '@/components/hub';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { 
  Globe, 
  ExternalLink, 
  Activity, 
  Settings, 
  Archive, 
  Wrench,
  Server,
  Database,
  Monitor,
  Zap,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const ModulesHub = () => {
  const designTokens = useDesignTokens();

  const moduleItems = [
    {
      title: 'Frontend Modules',
      description: 'Gerenciar módulos frontend e suas configurações',
      icon: Globe,
      href: '/modules/frontend',
      badge: 'Frontend'
    },
    {
      title: 'URLs e Endpoints',
      description: 'Configurar URLs e endpoints dos módulos',
      icon: ExternalLink,
      href: '/modules/endpoints',
      badge: 'Endpoints'
    },
    {
      title: 'Status dos Módulos',
      description: 'Monitorar status e saúde dos módulos',
      icon: Activity,
      href: '/modules/status',
      badge: 'Monitoramento'
    }
  ];

  const systemItems = [
    {
      title: 'Configurações',
      description: 'Configurações gerais do sistema e parâmetros',
      icon: Settings,
      href: '/settings',
      badge: 'Config'
    },
    {
      title: 'Backup & Restore',
      description: 'Gerenciar backups e restauração de dados',
      icon: Archive,
      href: '/settings/backup',
      badge: 'Backup'
    },
    {
      title: 'Manutenção',
      description: 'Ferramentas de manutenção e otimização',
      icon: Wrench,
      href: '/settings/maintenance',
      badge: 'Manutenção'
    }
  ];

  const systemStats = [
    {
      title: 'Módulos Ativos',
      value: '12',
      description: 'Módulos em funcionamento',
      icon: Globe,
      color: designTokens.colors.success.DEFAULT
    },
    {
      title: 'Uptime',
      value: '99.8%',
      description: 'Disponibilidade do sistema',
      icon: Server,
      color: designTokens.colors.primary.DEFAULT
    },
    {
      title: 'Performance',
      value: 'Excelente',
      description: 'Status geral de performance',
      icon: Zap,
      color: designTokens.colors.secondary.DEFAULT
    },
    {
      title: 'Segurança',
      value: 'Alta',
      description: 'Nível de segurança ativo',
      icon: Shield,
      color: designTokens.colors.warning.DEFAULT
    }
  ];

  const moduleStatus = [
    {
      name: 'RBAC Manager',
      status: 'online',
      uptime: '99.9%',
      lastCheck: '2 min atrás'
    },
    {
      name: 'Analytics Hub',
      status: 'online',
      uptime: '99.7%',
      lastCheck: '1 min atrás'
    },
    {
      name: 'User Management',
      status: 'online',
      uptime: '99.8%',
      lastCheck: '3 min atrás'
    },
    {
      name: 'Audit System',
      status: 'warning',
      uptime: '98.5%',
      lastCheck: '5 min atrás'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Módulos e Sistema
          </h1>
          <p 
            className="text-lg text-gray-600"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Gerencie módulos frontend e configurações do sistema
          </p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.title}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                style={{ 
                  borderColor: designTokens.colors.neutral[200],
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <IconComponent 
                      className="h-5 w-5" 
                      style={{ color: stat.color }} 
                    />
                  </div>
                  <div>
                    <p 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      {stat.title}
                    </p>
                    <p 
                      className="text-2xl font-bold text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      {stat.value}
                    </p>
                  </div>
                </div>
                <p 
                  className="text-xs text-gray-500 mt-2"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Modules Hub */}
        <CardHub
          title="Módulos Frontend"
          description="Gerencie e monitore todos os módulos frontend do sistema"
          icon={Globe}
          badge="Módulos"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {moduleItems.map((item) => (
              <CardHubItem
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                href={item.href}
                badge={item.badge}
                badgeVariant="secondary"
              />
            ))}
          </div>
        </CardHub>

        {/* System Hub */}
        <CardHub
          title="Sistema"
          description="Configurações e ferramentas de manutenção do sistema"
          icon={Settings}
          badge="Sistema"
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {systemItems.map((item) => (
              <CardHubItem
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                href={item.href}
                badge={item.badge}
                badgeVariant="outline"
              />
            ))}
          </div>
        </CardHub>

        {/* Module Status & System Info */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardHub
            title="Status dos Módulos"
            description="Monitoramento em tempo real dos módulos"
            icon={Monitor}
          >
            <div className="space-y-3">
              {moduleStatus.map((module) => {
                let statusColor = 'bg-red-500';
                if (module.status === 'online') {
                  statusColor = 'bg-green-500';
                } else if (module.status === 'warning') {
                  statusColor = 'bg-yellow-500';
                }
                
                return (
                  <div key={module.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                    <div>
                      <p 
                        className="text-sm font-medium text-gray-900"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      >
                        {module.name}
                      </p>
                      <p 
                        className="text-xs text-gray-600"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      >
                        Uptime: {module.uptime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p 
                      className="text-xs text-gray-500"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      {module.lastCheck}
                    </p>
                    {module.status === 'online' ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </CardHub>

          <CardHub
            title="Informações do Sistema"
            description="Detalhes técnicos e configurações"
            icon={Database}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Server className="h-5 w-5 text-blue-500" />
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Versão do Sistema
                    </p>
                    <p 
                      className="text-xs text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      v3.2.1
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-green-500" />
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Última Atualização
                    </p>
                    <p 
                      className="text-xs text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Há 2 dias
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Políticas RLS
                    </p>
                    <p 
                      className="text-xs text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      12 políticas ativas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHub>
        </div>
      </div>
    </div>
  );
};

export default ModulesHub;
