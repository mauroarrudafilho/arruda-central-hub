import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Server, Database, Globe, Mail } from 'lucide-react';

const MonitoringSettings = () => {
  const navigate = useNavigate();
  const designTokens = useDesignTokens();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Estados para métricas do sistema
  const [metrics, setMetrics] = useState({
    system: {
      cpu: 45,
      memory: 68,
      disk: 32,
      uptime: '99.9%'
    },
    services: [
      { name: 'Supabase', status: 'online', responseTime: '120ms', uptime: '99.9%' },
      { name: 'Resend API', status: 'online', responseTime: '85ms', uptime: '100%' },
      { name: 'Database', status: 'online', responseTime: '45ms', uptime: '99.8%' },
      { name: 'Storage', status: 'online', responseTime: '200ms', uptime: '99.9%' }
    ],
    alerts: [
      { type: 'warning', message: 'Uso de memória acima de 70%', time: '2 min atrás' },
      { type: 'info', message: 'Backup automático concluído', time: '1 hora atrás' },
      { type: 'success', message: 'Sistema funcionando normalmente', time: '5 min atrás' }
    ]
  });

  const refreshMetrics = async () => {
    setLoading(true);
    try {
      // Simular atualização de métricas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular variação nas métricas
      setMetrics(prev => ({
        ...prev,
        system: {
          cpu: Math.floor(Math.random() * 30) + 30,
          memory: Math.floor(Math.random() * 20) + 60,
          disk: Math.floor(Math.random() * 10) + 30,
          uptime: '99.9%'
        }
      }));
      
      setLastUpdate(new Date());
      
      toast({
        title: "Métricas Atualizadas",
        description: "As métricas do sistema foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar métricas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    return status === 'online' ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    return status === 'online' ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge> : 
      <Badge variant="destructive">Offline</Badge>;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Info</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Admin Panel</span>
              </Button>
            </div>
            
            <Button
              onClick={refreshMetrics}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>
          </div>
          
          <div className="mt-4 flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: designTokens.colors.primary[50] }}
            >
              <Server className="h-5 w-5" style={{ color: designTokens.colors.primary.DEFAULT }} />
            </div>
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Monitoramento do Sistema
              </h1>
              <p 
                className="text-lg text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Dashboard de saúde e métricas em tempo real
              </p>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métricas do Sistema */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>Métricas do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Uso de recursos e performance do servidor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">CPU</span>
                      <span className="text-sm font-bold text-gray-900">{metrics.system.cpu}%</span>
                    </div>
                    <Progress value={metrics.system.cpu} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Memória</span>
                      <span className="text-sm font-bold text-gray-900">{metrics.system.memory}%</span>
                    </div>
                    <Progress value={metrics.system.memory} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Disco</span>
                      <span className="text-sm font-bold text-gray-900">{metrics.system.disk}%</span>
                    </div>
                    <Progress value={metrics.system.disk} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Uptime</span>
                      <span className="text-sm font-bold text-green-600">{metrics.system.uptime}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: '99.9%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status dos Serviços */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Status dos Serviços</span>
                </CardTitle>
                <CardDescription>
                  Monitoramento de todos os serviços integrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-600">Tempo de resposta: {service.responseTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(service.status)}
                        <p className="text-xs text-gray-500 mt-1">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Alertas e Informações */}
          <div className="space-y-6">
            {/* Alertas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Alertas Recentes</span>
                </CardTitle>
                <CardDescription>
                  Últimos eventos e notificações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.alerts.map((alert) => (
                    <div key={`${alert.type}-${alert.message}-${alert.time}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{alert.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          {getAlertBadge(alert.type)}
                          <span className="text-xs text-gray-500">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumo do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Resumo do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Visão geral da saúde do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status Geral</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Operacional</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Serviços Online</span>
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.services.filter(s => s.status === 'online').length}/{metrics.services.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime Médio</span>
                  <span className="text-sm font-bold text-green-600">99.9%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Alertas Ativos</span>
                  <span className="text-sm font-bold text-yellow-600">
                    {metrics.alerts.filter(a => a.type === 'warning' || a.type === 'error').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Ações administrativas comuns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Verificar Banco de Dados
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Testar E-mail
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Verificar APIs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringSettings;
