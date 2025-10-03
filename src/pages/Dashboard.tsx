import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useMockData } from '@/hooks/useMockData';
import { 
  Users, 
  Shield, 
  Activity, 
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { MockDataIcon } from '@/components/ui/MockDataIcon';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts';

// Interfaces moved to useDashboardData hook

// Dados de exemplo para gráficos
const chartData = [
  { name: 'Jan', users: 12, sessions: 45, modules: 2 },
  { name: 'Fev', users: 15, sessions: 52, modules: 2 },
  { name: 'Mar', users: 17, sessions: 48, modules: 3 },
  { name: 'Abr', users: 19, sessions: 61, modules: 3 },
  { name: 'Mai', users: 17, sessions: 55, modules: 3 },
  { name: 'Jun', users: 20, sessions: 67, modules: 3 },
];

// Chart configuration will be created inside component to use design tokens

const Dashboard = () => {
  const { stats, recentActivity, loading } = useDashboardData();
  const designTokens = useDesignTokens();
  const { shouldShowMockIndicator } = useMockData();

  // Chart configuration using design tokens
  const chartConfig = {
    users: {
      label: "Usuários",
      color: designTokens.chartColors.primary,
    },
    sessions: {
      label: "Sessões",
      color: designTokens.chartColors.secondary,
    },
    modules: {
      label: "Módulos",
      color: designTokens.chartColors.success,
    },
  };

  // Data fetching is now handled by useDashboardData hook

  // Data fetching logic moved to useDashboardData hook

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSystemHealthLabel = (health: string) => {
    switch (health) {
      case 'healthy': return 'Saudável';
      case 'warning': return 'Atenção';
      case 'critical': return 'Crítico';
      default: return 'Desconhecido';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR');
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard RBAC</h1>
          <p className="text-gray-600">Visão geral do sistema de gestão de usuários e acessos</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 ${getHealthColor(stats?.systemHealth || 'healthy')}`}>
            {getHealthIcon(stats?.systemHealth || 'healthy')}
            <span className="text-sm font-medium flex items-center gap-1">
              Sistema {getSystemHealthLabel(stats?.systemHealth || 'healthy')}
              {shouldShowMockIndicator(true) && <MockDataIcon size="sm" />}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4" style={{ color: designTokens.iconColors.primary }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.activeUsers || 0} ativos nas últimas 24h
              {shouldShowMockIndicator(true) && <MockDataIcon size="sm" />}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Ativos</CardTitle>
            <Shield className="h-4 w-4" style={{ color: designTokens.iconColors.secondary }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRoles || 0}</div>
            <p className="text-xs text-muted-foreground">
              Permissões configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
            <Activity className="h-4 w-4" style={{ color: designTokens.iconColors.success }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuários conectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos</CardTitle>
            <ExternalLink className="h-4 w-4" style={{ color: designTokens.iconColors.warning }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalModules || 0}</div>
            <p className="text-xs text-muted-foreground">
              Frontends integrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security & Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Alertas de Segurança</span>
            </CardTitle>
            <CardDescription>
              Últimas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tentativas de login falhadas</span>
                <Badge 
                  className="hover:opacity-80"
                  style={{
                    backgroundColor: stats?.securityAlerts > 5 
                      ? designTokens.badgeColors.destructive.bg 
                      : designTokens.badgeColors.info.bg,
                    color: stats?.securityAlerts > 5 
                      ? designTokens.badgeColors.destructive.text 
                      : designTokens.badgeColors.info.text,
                  }}
                >
                  {stats?.securityAlerts || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Logins bem-sucedidos</span>
                <Badge 
                  className="hover:opacity-80"
                  style={{
                    backgroundColor: designTokens.badgeColors.success.bg,
                    color: designTokens.badgeColors.success.text,
                  }}
                >
                  {stats?.recentLogins || 0}
                </Badge>
              </div>
              {stats?.securityAlerts > 5 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800">
                    ⚠️ Alto número de tentativas falhadas detectadas
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" style={{ color: designTokens.iconColors.primary }} />
              <span>Atividade Recente</span>
            </CardTitle>
            <CardDescription>
              Últimas ações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.success ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{activity.user_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.action} - {activity.resource}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" style={{ color: designTokens.iconColors.primary }} />
              <span>Crescimento de Usuários</span>
              {shouldShowMockIndicator(true) && <MockDataIcon />}
            </CardTitle>
            <CardDescription>
              Evolução dos usuários nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={designTokens.chartColors.primary}
                  fill={designTokens.chartColors.primary}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" style={{ color: designTokens.iconColors.secondary }} />
              <span>Sessões por Mês</span>
              {shouldShowMockIndicator(true) && <MockDataIcon />}
            </CardTitle>
            <CardDescription>
              Número de sessões ativas por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sessions" fill={designTokens.chartColors.secondary} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
