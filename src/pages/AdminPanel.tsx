import React from 'react';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { CardHub } from '@/components/hub/CardHub';
import { CardHubItem } from '@/components/hub/CardHubItem';
import { 
  Settings, 
  Shield, 
  Link, 
  Monitor, 
  Database, 
  Wrench,
  CheckCircle,
  Clock,
  Server
} from 'lucide-react';

const AdminPanel = () => {
  const designTokens = useDesignTokens();

  // Dados mockados para status do sistema
  const systemStatus = {
    overall: 'healthy',
    uptime: '99.9%',
    lastBackup: '2 horas atrás',
    activeUsers: 12,
    totalModules: 17
  };

  // Cards principais do Admin Panel
  const adminItems = [
    {
      title: 'Configurações do Sistema',
      description: 'Configurações gerais, timezone, idioma e políticas de sessão',
      icon: Settings,
      href: '/admin/settings',
      badge: 'Configurado',
      badgeVariant: 'default' as const
    },
    {
      title: 'Segurança',
      description: 'Políticas de senha, 2FA, bloqueio de conta e restrições de IP',
      icon: Shield,
      href: '/admin/security',
      badge: 'Ativo',
      badgeVariant: 'default' as const
    },
    {
      title: 'Integrações',
      description: 'Supabase, APIs externas, webhooks e configurações de SSO',
      icon: Link,
      href: '/admin/integrations',
      badge: '3 ativas',
      badgeVariant: 'secondary' as const
    },
    {
      title: 'Monitoramento',
      description: 'Dashboard de saúde, métricas de performance e alertas',
      icon: Monitor,
      href: '/admin/monitoring',
      badge: 'Online',
      badgeVariant: 'default' as const
    },
    {
      title: 'Backup & Restore',
      description: 'Configurações de backup automático e restore de dados',
      icon: Database,
      href: '/admin/backup',
      badge: '2h atrás',
      badgeVariant: 'secondary' as const
    },
    {
      title: 'Manutenção',
      description: 'Limpeza de logs, otimização e modo de manutenção',
      icon: Wrench,
      href: '/admin/maintenance',
      badge: 'Disponível',
      badgeVariant: 'default' as const
    }
  ];

  // Ações rápidas
  const quickActions = [
    {
      title: 'Backup Completo',
      description: 'Executar backup completo do sistema agora',
      icon: Database,
      action: () => {
        // Implementar ação de backup
        console.log('Executando backup completo...');
      },
      badge: 'Crítico',
      badgeVariant: 'destructive' as const
    },
    {
      title: 'Modo Manutenção',
      description: 'Ativar/desativar modo de manutenção',
      icon: Wrench,
      action: () => {
        // Implementar toggle de modo manutenção
        console.log('Alternando modo de manutenção...');
      },
      badge: 'Inativo',
      badgeVariant: 'secondary' as const
    },
    {
      title: 'Limpeza de Logs',
      description: 'Remover logs antigos e otimizar sistema',
      icon: Clock,
      action: () => {
        // Implementar limpeza de logs
        console.log('Executando limpeza de logs...');
      },
      badge: 'Recomendado',
      badgeVariant: 'secondary' as const
    }
  ];

  // Status dos serviços
  const serviceStatus = [
    { name: 'Supabase', status: 'online', uptime: '99.9%' },
    { name: 'Resend API', status: 'online', uptime: '100%' },
    { name: 'Database', status: 'online', uptime: '99.8%' },
    { name: 'Storage', status: 'online', uptime: '99.9%' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Admin Panel
              </h1>
              <p 
                className="text-lg text-gray-600 mt-2"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Centro de controle para configurações e administração do sistema
              </p>
            </div>
            
            {/* Status do Sistema */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span 
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  Sistema Operacional
                </span>
              </div>
              <div 
                className="text-sm text-gray-500"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Uptime: {systemStatus.uptime}
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h2 
            className="text-xl font-semibold text-gray-900 mb-4"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.action}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: designTokens.colors.primary[50] }}
                    >
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: designTokens.colors.primary.DEFAULT }} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 
                          className="text-sm font-semibold text-gray-900"
                          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                        >
                          {action.title}
                        </h3>
                        <span 
                          className={`px-2 py-1 text-xs rounded-full ${
                            action.badgeVariant === 'destructive' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                        >
                          {action.badge}
                        </span>
                      </div>
                      <p 
                        className="text-xs text-gray-600"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      >
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configurações Principais */}
        <div className="mb-8">
          <h2 
            className="text-xl font-semibold text-gray-900 mb-6"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Configurações do Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminItems.map((item) => (
              <CardHubItem
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                href={item.href}
                badge={item.badge}
                badgeVariant={item.badgeVariant}
              />
            ))}
          </div>
        </div>

        {/* Status dos Serviços */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardHub
            title="Status dos Serviços"
            description="Monitoramento em tempo real de todos os serviços"
            icon={Server}
          >
            <div className="space-y-3">
              {serviceStatus.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p 
                        className="text-sm font-medium text-gray-900"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      >
                        {service.name}
                      </p>
                      <p 
                        className="text-xs text-gray-600"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      >
                        {service.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      {service.uptime}
                    </p>
                    <p 
                      className="text-xs text-gray-500"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Uptime
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardHub>

          <CardHub
            title="Métricas do Sistema"
            description="Estatísticas gerais de uso e performance"
            icon={Monitor}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Usuários Ativos
                    </p>
                    <p 
                      className="text-xs text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Agora
                    </p>
                  </div>
                </div>
                <div 
                  className="text-lg font-bold text-gray-900"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {systemStatus.activeUsers}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Server className="h-5 w-5 text-blue-500" />
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Módulos Disponíveis
                    </p>
                    <p 
                      className="text-xs text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Total
                    </p>
                  </div>
                </div>
                <div 
                  className="text-lg font-bold text-gray-900"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {systemStatus.totalModules}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-purple-500" />
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Último Backup
                    </p>
                    <p 
                      className="text-xs text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Automático
                    </p>
                  </div>
                </div>
                <div 
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {systemStatus.lastBackup}
                </div>
              </div>
            </div>
          </CardHub>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
