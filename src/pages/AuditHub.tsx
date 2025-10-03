import React from 'react';
import { CardHub, CardHubItem } from '@/components/hub';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { 
  Eye, 
  Users, 
  Activity, 
  Database, 
  AlertTriangle,
  Clock,
  Shield,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const AuditHub = () => {
  const designTokens = useDesignTokens();

  const auditItems = [
    {
      title: 'Log de Usuários',
      description: 'Histórico completo de ações e atividades dos usuários',
      icon: Users,
      href: '/audit/users',
      badge: 'Usuários'
    },
    {
      title: 'Log de Acessos',
      description: 'Registro de todos os acessos e tentativas de login',
      icon: Activity,
      href: '/audit/access',
      badge: 'Acessos'
    },
    {
      title: 'Log de Recursos',
      description: 'Auditoria de acesso a recursos e dados do sistema',
      icon: Database,
      href: '/audit/resources',
      badge: 'Recursos'
    },
    {
      title: 'Log de Segurança',
      description: 'Eventos de segurança e tentativas de acesso não autorizado',
      icon: AlertTriangle,
      href: '/audit/security',
      badge: 'Segurança'
    }
  ];

  const quickStats = [
    {
      title: 'Eventos Hoje',
      value: '1,247',
      description: 'Eventos registrados nas últimas 24h',
      icon: Activity,
      color: designTokens.colors.primary.DEFAULT
    },
    {
      title: 'Usuários Ativos',
      value: '89',
      description: 'Usuários com atividade recente',
      icon: Users,
      color: designTokens.colors.success.DEFAULT
    },
    {
      title: 'Alertas',
      value: '3',
      description: 'Alertas de segurança pendentes',
      icon: AlertCircle,
      color: designTokens.colors.destructive.DEFAULT
    },
    {
      title: 'Uptime',
      value: '99.9%',
      description: 'Disponibilidade do sistema',
      icon: Shield,
      color: designTokens.colors.secondary.DEFAULT
    }
  ];

  const recentActivity = [
    {
      type: 'login',
      user: 'admin@arrudahub.com',
      action: 'Login realizado',
      time: '2 min atrás',
      status: 'success'
    },
    {
      type: 'access',
      user: 'user@arrudahub.com',
      action: 'Acesso ao módulo Analytics',
      time: '5 min atrás',
      status: 'success'
    },
    {
      type: 'security',
      user: 'unknown@example.com',
      action: 'Tentativa de login falhada',
      time: '12 min atrás',
      status: 'warning'
    },
    {
      type: 'resource',
      user: 'manager@arrudahub.com',
      action: 'Exportação de dados',
      time: '18 min atrás',
      status: 'success'
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
            Auditoria
          </h1>
          <p 
            className="text-lg text-gray-600"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Monitore e audite todas as atividades e eventos do sistema
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => {
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

        {/* Main Hub Card */}
        <CardHub
          title="Logs de Auditoria"
          description="Acesse e monitore todos os tipos de logs e eventos do sistema"
          icon={Eye}
          badge="Auditoria"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {auditItems.map((item) => (
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

        {/* Recent Activity & Additional Info */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardHub
            title="Atividade Recente"
            description="Últimos eventos registrados no sistema"
            icon={Clock}
          >
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                let statusColor = 'bg-red-500';
                if (activity.status === 'success') {
                  statusColor = 'bg-green-500';
                } else if (activity.status === 'warning') {
                  statusColor = 'bg-yellow-500';
                }
                
                return (
                  <div key={`${activity.user}-${activity.action}-${activity.timestamp}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium text-gray-900 truncate"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      {activity.user}
                    </p>
                    <p 
                      className="text-xs text-gray-600"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      {activity.action}
                    </p>
                  </div>
                  <p 
                    className="text-xs text-gray-500"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    {activity.time}
                  </p>
                </div>
                );
              })}
            </div>
          </CardHub>

          <CardHub
            title="Alertas e Notificações"
            description="Eventos que requerem atenção"
            icon={AlertTriangle}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p 
                    className="text-sm font-medium text-red-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Tentativa de Acesso Suspeita
                  </p>
                  <p 
                    className="text-xs text-red-700"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    3 tentativas de login falhadas em 5 minutos
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <div>
                  <p 
                    className="text-sm font-medium text-yellow-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Alto Volume de Acessos
                  </p>
                  <p 
                    className="text-xs text-yellow-700"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Pico de atividade detectado
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p 
                    className="text-sm font-medium text-blue-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Relatório Gerado
                  </p>
                  <p 
                    className="text-xs text-blue-700"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Relatório de auditoria disponível
                  </p>
                </div>
              </div>
            </div>
          </CardHub>
        </div>
      </div>
    </div>
  );
};

export default AuditHub;
