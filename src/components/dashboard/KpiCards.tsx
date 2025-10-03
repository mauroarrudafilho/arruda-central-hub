import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Activity, Shield, Clock } from 'lucide-react';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useKpiData } from '@/hooks/useKpiData';

const KpiCards: React.FC = () => {
  const designTokens = useDesignTokens();
  const { data, isLoading, error } = useKpiData();

  if (isLoading) {
    return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, index) => (
                <Card key={`kpi-loading-skeleton-${index}`} className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar KPIs:', error);
  }

  // Fallback para dados mockados se não houver dados
  const kpiData = data || {
    totalModules: 17,
    todayAccess: 243,
    uptime: 99.8,
    activeUsers: 12
  };

  const kpiItems = [
    {
      title: 'Total de Módulos',
      value: kpiData.totalModules,
      icon: Building2,
      color: designTokens.colors.primary.DEFAULT,
      bgColor: designTokens.colors.primary[50],
      description: 'Módulos disponíveis no sistema'
    },
    {
      title: 'Acessos Hoje',
      value: kpiData.todayAccess,
      icon: Activity,
      color: designTokens.colors.success.DEFAULT,
      bgColor: designTokens.colors.success[50],
      description: 'Acessos realizados hoje'
    },
    {
      title: 'Tempo Online',
      value: `${kpiData.uptime}%`,
      icon: Clock,
      color: designTokens.colors.secondary.DEFAULT,
      bgColor: designTokens.colors.secondary[50],
      description: 'Uptime do sistema'
    },
    {
      title: 'Usuários Ativos',
      value: kpiData.activeUsers,
      icon: Shield,
      color: designTokens.colors.warning.DEFAULT,
      bgColor: designTokens.colors.warning[50],
      description: 'Usuários online agora'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiItems.map((item) => {
        const IconComponent = item.icon;
        
        return (
          <Card 
            key={item.title} 
            className="p-6 hover:shadow-md transition-shadow duration-200"
            style={{ 
              borderColor: designTokens.colors.neutral[200],
              fontFamily: designTokens.typography.fontFamily.sans.join(', ')
            }}
          >
            <CardHeader className="flex items-start space-x-3 space-y-0 pb-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.bgColor }}
              >
                <IconComponent 
                  className="h-6 w-6" 
                  style={{ color: item.color }}
                />
              </div>
              <div className="flex-1">
                <CardTitle 
                  className="text-base font-bold text-gray-700"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {item.title}
                </CardTitle>
                <p 
                  className="text-xs text-gray-500 mt-0.5"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {item.description}
                </p>
                <div 
                  className="text-2xl font-bold text-gray-900 mt-1"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {item.value}
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};

export default KpiCards;
