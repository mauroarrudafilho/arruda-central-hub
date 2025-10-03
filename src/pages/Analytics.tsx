import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useMockData } from '@/hooks/useMockData';
import { MockDataIcon } from '@/components/ui/MockDataIcon';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Users,
  Eye,
  Clock,
  BarChart3,
  LineChart as LineChartIcon,
  ArrowRight,
  Zap,
  Target,
  Globe
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const { summary, moduleSummaries, trendData, loading, error } = useAnalyticsData();
  const designTokens = useDesignTokens();
  const navigate = useNavigate();
  const { shouldShowMockIndicator } = useMockData();

  // Chart configuration using design tokens
  const chartConfig = {
    accesses: {
      label: "Acessos",
      color: designTokens.chartColors.primary,
    },
    users: {
      label: "Usuários",
      color: designTokens.chartColors.secondary,
    },
    responseTime: {
      label: "Tempo (ms)",
      color: designTokens.chartColors.success,
    },
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" style={{ color: designTokens.colors.success.DEFAULT }} />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" style={{ color: designTokens.colors.destructive.DEFAULT }} />;
    return <Activity className="h-4 w-4" style={{ color: designTokens.colors.neutral.DEFAULT }} />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return designTokens.badgeColors.success;
    if (growth < 0) return designTokens.badgeColors.destructive;
    return designTokens.badgeColors.neutral;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'up': return 'Crescendo';
      case 'down': return 'Declinando';
      default: return 'Estável';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600">Visão geral consolidada de uso e performance do sistema</p>
        </div>
        <Button 
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Atualizar Dados</span>
        </Button>
      </div>

      {/* KPIs Principais */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Acessos</CardTitle>
              <Eye className="h-4 w-4" style={{ color: designTokens.iconColors.primary }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAccesses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-green-600">+{summary.growthRate}%</span> vs mês anterior
                {shouldShowMockIndicator(true) && <MockDataIcon size="sm" />}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4" style={{ color: designTokens.iconColors.secondary }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <Target className="h-4 w-4" style={{ color: designTokens.iconColors.success }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Requisições bem-sucedidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4" style={{ color: designTokens.iconColors.warning }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {summary.avgResponseTime}ms
                {shouldShowMockIndicator(true) && <MockDataIcon size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Tempo de resposta
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico de Tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChartIcon className="h-5 w-5" style={{ color: designTokens.iconColors.primary }} />
              <span>Tendências dos Últimos 7 Dias</span>
              {shouldShowMockIndicator(true) && <MockDataIcon />}
            </CardTitle>
            <CardDescription>
              Evolução de acessos e usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={trendData}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="accesses" 
                  stroke={designTokens.chartColors.primary}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke={designTokens.chartColors.secondary}
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" style={{ color: designTokens.iconColors.secondary }} />
              <span>Performance por Módulo</span>
            </CardTitle>
            <CardDescription>
              Comparação de acessos entre módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={moduleSummaries}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="accesses" fill={designTokens.chartColors.primary} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Módulo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" style={{ color: designTokens.iconColors.primary }} />
            <span>Resumo por Módulo</span>
          </CardTitle>
          <CardDescription>
            Visão detalhada de cada módulo do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moduleSummaries.map((module) => (
              <div key={module.name} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{module.name}</h3>
                  <Badge 
                    className="hover:opacity-80"
                    style={{
                      backgroundColor: getGrowthColor(module.growth).bg,
                      color: getGrowthColor(module.growth).text,
                    }}
                  >
                    {getGrowthIcon(module.growth)}
                    <span className="ml-1">{module.growth > 0 ? '+' : ''}{module.growth}%</span>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Acessos:</span>
                    <span className="font-medium">{module.accesses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usuários:</span>
                    <span className="font-medium">{module.users}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${getStatusColor(module.status)}`}>
                      {getStatusLabel(module.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" style={{ color: designTokens.iconColors.warning }} />
            <span>Acesso Rápido</span>
          </CardTitle>
          <CardDescription>
            Navegue para análises detalhadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => navigate('/analytics/modules')}
            >
              <div className="flex items-center space-x-2 w-full">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Acessos por Módulo</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <p className="text-sm text-gray-600 text-left">
                Análise detalhada de acessos e usuários por módulo
              </p>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => navigate('/analytics/screens')}
            >
              <div className="flex items-center space-x-2 w-full">
                <Eye className="h-5 w-5" />
                <span className="font-medium">Uso de Telas</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <p className="text-sm text-gray-600 text-left">
                Páginas mais acessadas e padrões de navegação
              </p>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => navigate('/analytics/performance')}
            >
              <div className="flex items-center space-x-2 w-full">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Métricas de Performance</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <p className="text-sm text-gray-600 text-left">
                Tempo de resposta, taxa de erro e performance
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;