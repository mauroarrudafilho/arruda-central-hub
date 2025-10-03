import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { 
  TrendingUp, 
  Activity
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis } from 'recharts';

interface ModuleStats {
  module_name: string;
  display_name: string;
  total_access: number;
  unique_users: number;
  avg_session_time: number;
  last_access: string;
}

// Dados de exemplo para gráficos
const moduleAccessData = [
  { name: 'RBAC', acessos: 245, usuarios: 12 },
  { name: 'Acordos', acessos: 189, usuarios: 8 },
  { name: 'Degustação', acessos: 156, usuarios: 6 },
];

// Chart configuration will be created inside component to use design tokens

const AnalyticsModules = () => {
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const designTokens = useDesignTokens();

  // Chart configuration using design tokens
  const chartConfig = {
    acessos: {
      label: "Acessos",
      color: designTokens.chartColors.primary,
    },
    usuarios: {
      label: "Usuários",
      color: designTokens.chartColors.secondary,
    },
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simular busca de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      setModuleStats([]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Acessos por Módulo</h1>
          <p className="text-gray-600">Análise de uso e performance por módulo</p>
        </div>
        <Button onClick={fetchAnalyticsData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" style={{ color: designTokens.iconColors.primary }} />
                  <span>Acessos por Módulo</span>
                </CardTitle>
            <CardDescription>
              Comparação de acessos entre módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={moduleAccessData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="acessos" fill={designTokens.chartColors.primary} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" style={{ color: designTokens.iconColors.secondary }} />
                  <span>Usuários por Módulo</span>
                </CardTitle>
            <CardDescription>
              Distribuição de usuários únicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={moduleAccessData}
                  dataKey="usuarios"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {moduleAccessData.map((entry, index) => {
                    const colors = [
                      designTokens.chartColors.primary,
                      designTokens.chartColors.secondary,
                      designTokens.chartColors.success
                    ];
                    return <Cell key={`cell-${entry.name}`} fill={colors[index]} />;
                  })}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleStats.map((module) => (
          <Card key={module.module_name}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>{module.display_name}</span>
              </CardTitle>
              <CardDescription>
                Estatísticas dos últimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Acessos</p>
                  <p className="text-2xl font-bold">{module.total_access}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Únicos</p>
                  <p className="text-2xl font-bold">{module.unique_users}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio de Sessão</p>
                <p className="text-lg font-semibold">
                  {Math.round(module.avg_session_time / 1000)}s
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Acesso</p>
                <p className="text-sm">
                  {module.last_access ? formatTimestamp(module.last_access) : 'Nunca'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsModules;
