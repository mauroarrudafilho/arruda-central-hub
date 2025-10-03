import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  Clock,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Line, LineChart, XAxis, YAxis } from 'recharts';

interface PerformanceMetrics {
  avg_response_time: number;
  total_requests: number;
  success_rate: number;
  error_rate: number;
  peak_hour: string;
}

// Dados de exemplo para gráficos
const performanceData = [
  { hora: '00:00', requests: 12, tempo: 120 },
  { hora: '01:00', requests: 8, tempo: 115 },
  { hora: '02:00', requests: 5, tempo: 110 },
  { hora: '03:00', requests: 3, tempo: 105 },
  { hora: '04:00', requests: 2, tempo: 100 },
  { hora: '05:00', requests: 4, tempo: 102 },
  { hora: '06:00', requests: 15, tempo: 125 },
  { hora: '07:00', requests: 28, tempo: 140 },
  { hora: '08:00', requests: 45, tempo: 160 },
  { hora: '09:00', requests: 62, tempo: 180 },
  { hora: '10:00', requests: 78, tempo: 200 },
  { hora: '11:00', requests: 85, tempo: 220 },
  { hora: '12:00', requests: 92, tempo: 240 },
  { hora: '13:00', requests: 88, tempo: 230 },
  { hora: '14:00', requests: 95, tempo: 250 },
  { hora: '15:00', requests: 98, tempo: 260 },
  { hora: '16:00', requests: 85, tempo: 220 },
  { hora: '17:00', requests: 72, tempo: 190 },
  { hora: '18:00', requests: 58, tempo: 170 },
  { hora: '19:00', requests: 42, tempo: 150 },
  { hora: '20:00', requests: 35, tempo: 135 },
  { hora: '21:00', requests: 28, tempo: 125 },
  { hora: '22:00', requests: 18, tempo: 115 },
  { hora: '23:00', requests: 12, tempo: 110 },
];

const chartConfig = {
  requests: {
    label: "Requisições",
    color: "#003366", // Navy - Primary
  },
  tempo: {
    label: "Tempo (ms)",
    color: "#008080", // Teal - Secondary
  },
};

const AnalyticsPerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simular busca de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPerformanceMetrics({
        avg_response_time: 180,
        total_requests: 1250,
        success_rate: 98.5,
        error_rate: 1.5,
        peak_hour: '15:00'
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Métricas de Performance</h1>
          <p className="text-gray-600">Análise de performance e tempo de resposta</p>
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
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Requisições por Hora</span>
            </CardTitle>
            <CardDescription>
              Volume de requisições ao longo do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={performanceData}>
                <XAxis dataKey="hora" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#003366" 
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <span>Tempo de Resposta</span>
            </CardTitle>
            <CardDescription>
              Tempo médio de resposta por hora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={performanceData}>
                <XAxis dataKey="hora" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="tempo"
                  stroke="#008080"
                  fill="#008080"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métricas */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.avg_response_time}ms</div>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
              <BarChart3 className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.total_requests}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.success_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Requisições bem-sucedidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
              <Activity className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.error_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Requisições com erro
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informações Adicionais */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <span>Informações Adicionais</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Hora de Pico</p>
                <p className="text-lg font-semibold">{performanceMetrics.peak_hour}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período de Análise</p>
                <p className="text-lg font-semibold">Últimas 24 horas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPerformance;
