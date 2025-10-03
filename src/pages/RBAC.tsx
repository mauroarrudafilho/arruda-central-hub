import React from 'react';
import { CardHub, CardHubItem } from '@/components/hub';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { 
  Shield, 
  Database, 
  BarChart3, 
  AlertTriangle,
  Users,
  Settings,
  Key,
  Lock
} from 'lucide-react';

const RBAC = () => {
  const designTokens = useDesignTokens();

  const rbacItems = [
    {
      title: 'Roles',
      description: 'Gerenciar papéis e hierarquias de usuários no sistema',
      icon: Shield,
      href: '/roles',
      badge: 'Gerenciar'
    },
    {
      title: 'Permissões',
      description: 'Configurar permissões específicas e granularidade de acesso',
      icon: Key,
      href: '/roles/permissions',
      badge: 'Configurar'
    },
    {
      title: 'Matriz de Acesso',
      description: 'Visualizar e gerenciar a matriz completa de permissões',
      icon: BarChart3,
      href: '/roles/matrix',
      badge: 'Visualizar'
    },
    {
      title: 'Políticas de Segurança',
      description: 'Configurar políticas RLS e regras de segurança avançadas',
      icon: Lock,
      href: '/roles/policies',
      badge: 'Segurança'
    }
  ];

  const quickStats = [
    {
      title: 'Total de Roles',
      value: '8',
      description: 'Papéis ativos no sistema',
      icon: Shield,
      color: designTokens.colors.primary.DEFAULT
    },
    {
      title: 'Permissões',
      value: '24',
      description: 'Permissões configuradas',
      icon: Key,
      color: designTokens.colors.secondary.DEFAULT
    },
    {
      title: 'Usuários Ativos',
      value: '156',
      description: 'Usuários com acesso',
      icon: Users,
      color: designTokens.colors.success.DEFAULT
    },
    {
      title: 'Políticas RLS',
      value: '12',
      description: 'Políticas de segurança ativas',
      icon: Lock,
      color: designTokens.colors.warning.DEFAULT
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
            Roles e Permissões
          </h1>
          <p 
            className="text-lg text-gray-600"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Gerencie papéis, permissões e políticas de segurança do sistema
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
          title="Gerenciamento de Acesso"
          description="Configure e gerencie todos os aspectos de controle de acesso do sistema"
          icon={Shield}
          badge="RBAC"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rbacItems.map((item) => (
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

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardHub
            title="Documentação"
            description="Recursos e guias para configuração de RBAC"
            icon={Database}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Políticas RLS Ativas
                  </p>
                  <p 
                    className="text-xs text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    12 políticas de segurança configuradas
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Settings className="h-5 w-5 text-blue-500" />
                <div>
                  <p 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Sistema Centralizado
                  </p>
                  <p 
                    className="text-xs text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Todas as políticas gerenciadas em um local
                  </p>
                </div>
              </div>
            </div>
          </CardHub>

          <CardHub
            title="Ações Rápidas"
            description="Acesso rápido às funcionalidades mais utilizadas"
            icon={Settings}
          >
            <div className="space-y-3">
              <button 
                className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                onClick={() => window.location.href = '/roles'}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p 
                      className="text-sm font-medium text-blue-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Criar Novo Role
                    </p>
                    <p 
                      className="text-xs text-blue-700"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Adicionar novo papel ao sistema
                    </p>
                  </div>
                </div>
              </button>
              <button 
                className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                onClick={() => window.location.href = '/roles/permissions'}
              >
                <div className="flex items-center space-x-3">
                  <Key className="h-5 w-5 text-green-600" />
                  <div>
                    <p 
                      className="text-sm font-medium text-green-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Configurar Permissões
                    </p>
                    <p 
                      className="text-xs text-green-700"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Gerenciar permissões específicas
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardHub>
        </div>
      </div>
    </div>
  );
};

export default RBAC;



