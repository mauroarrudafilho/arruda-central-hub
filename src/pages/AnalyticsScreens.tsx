import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Activity
} from 'lucide-react';

interface ScreenStats {
  resource_path: string;
  access_count: number;
  unique_users: number;
  avg_response_time: number;
  last_access: string;
}

const AnalyticsScreens = () => {
  const [screenStats, setScreenStats] = useState<ScreenStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simular busca de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      setScreenStats([]);
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
          <h1 className="text-3xl font-bold text-gray-900">Uso de Telas</h1>
          <p className="text-gray-600">Análise de uso e performance das telas</p>
        </div>
        <Button onClick={fetchAnalyticsData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Lista de Telas Mais Acessadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>Páginas Mais Acessadas</span>
          </CardTitle>
          <CardDescription>
            Últimos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {screenStats.length > 0 ? (
              screenStats.map((screen, index) => (
                <div key={screen.resource_path} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{screen.resource_path}</p>
                      <p className="text-sm text-muted-foreground">
                        {screen.unique_users} usuários únicos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{screen.access_count}</p>
                    <p className="text-sm text-muted-foreground">acessos</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado de uso de telas disponível</p>
                <p className="text-sm">Os dados aparecerão conforme o uso do sistema</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsScreens;
