import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { SecurityLogger } from '@/lib/security-logger';
import { 
  Users, 
  Activity, 
  Search,
  Download,
  RefreshCw,
  Shield
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_path: string;
  success: boolean;
  ip_address: string;
  user_agent: string;
  created_at: string;
  response_time_ms: number;
  metadata: any;
}

interface SecurityEvent {
  id: string;
  user_id: string;
  user_email: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address: string;
  created_at: string;
  resolved: boolean;
}

const Audit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSuccess, setFilterSuccess] = useState('all');

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);

      // Buscar logs de auditoria (resource_access_log)
      const { data: auditData } = await supabase
        .from('resource_access_log')
        .select(`
          id,
          user_id,
          action,
          resource_type,
          resource_path,
          success,
          ip_address,
          user_agent,
          created_at,
          response_time_ms,
          metadata,
          auth_profile!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Processar logs de auditoria
      const logs: AuditLog[] = auditData?.map(log => ({
        id: log.id,
        user_id: log.user_id,
        user_email: log.auth_profile?.email || 'Usuário desconhecido',
        action: log.action,
        resource_type: log.resource_type,
        resource_path: log.resource_path,
        success: log.success,
        ip_address: log.ip_address || 'N/A',
        user_agent: log.user_agent || 'N/A',
        created_at: log.created_at,
        response_time_ms: log.response_time_ms || 0,
        metadata: log.metadata
      })) || [];

      // Buscar logs de segurança
      const securityLogs = await SecurityLogger.getSecurityLogs({ limit: 100 });
      
      // Converter logs de segurança para eventos de segurança
      const securityEvents: SecurityEvent[] = securityLogs
        .filter(log => ['high', 'critical'].includes(log.severity) || !log.success)
        .map(log => ({
          id: log.id,
          user_id: log.user_id || '',
          user_email: log.auth_profile?.email || 'Sistema',
          event_type: log.event_type,
          severity: log.severity,
          description: log.description,
          ip_address: log.ip_address || 'N/A',
          created_at: log.created_at,
          resolved: false
        }));

      setAuditLogs(logs);
      setSecurityEvents(securityEvents);

    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessColor = (success: boolean) => {
    return success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getSuccessBadgeText = (success: boolean) => {
    return success ? 'Sucesso' : 'Falha';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource_path.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.resource_type === filterType;
    const matchesSuccess = filterSuccess === 'all' || 
                          (filterSuccess === 'success' && log.success) ||
                          (filterSuccess === 'failure' && !log.success);

    return matchesSearch && matchesType && matchesSuccess;
  });

  const exportLogs = () => {
    const csvContent = [
      ['Data', 'Usuário', 'Ação', 'Tipo', 'Recurso', 'Sucesso', 'IP', 'Tempo Resposta'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.created_at),
        log.user_email,
        log.action,
        log.resource_type,
        log.resource_path,
        log.success ? 'Sim' : 'Não',
        log.ip_address,
        log.response_time_ms + 'ms'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
          <h1 className="text-3xl font-bold text-gray-900">Auditoria</h1>
          <p className="text-gray-600">Logs de acesso e eventos de segurança</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={fetchAuditData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Log de Usuários</TabsTrigger>
          <TabsTrigger value="access">Log de Acessos</TabsTrigger>
          <TabsTrigger value="security">Log de Segurança</TabsTrigger>
        </TabsList>

        {/* Log de Usuários */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Atividades dos Usuários</span>
              </CardTitle>
              <CardDescription>
                Histórico completo de ações realizadas pelos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por usuário, ação ou recurso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tipo de recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="page">Páginas</SelectItem>
                      <SelectItem value="api">APIs</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="data">Dados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterSuccess} onValueChange={setFilterSuccess}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="failure">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de logs */}
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSuccessColor(log.success)}>
                              {getSuccessBadgeText(log.success)}
                            </Badge>
                            <Badge variant="outline">{log.resource_type}</Badge>
                          </div>
                          <div>
                            <p className="font-medium">{log.user_email}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.action} - {log.resource_path}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatTimestamp(log.created_at)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.response_time_ms}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log de Acessos */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span>Log de Acessos</span>
              </CardTitle>
              <CardDescription>
                Detalhamento de todos os acessos ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.slice(0, 50).map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium">Usuário</p>
                        <p className="text-sm text-muted-foreground">{log.user_email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ação</p>
                        <p className="text-sm text-muted-foreground">{log.action}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Recurso</p>
                        <p className="text-sm text-muted-foreground">{log.resource_path}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge className={getSuccessColor(log.success)}>
                          {getSuccessBadgeText(log.success)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">IP:</span> {log.ip_address}
                        </div>
                        <div>
                          <span className="font-medium">Tempo:</span> {log.response_time_ms}ms
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {formatTimestamp(log.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log de Segurança */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-500" />
                <span>Eventos de Segurança</span>
              </CardTitle>
              <CardDescription>
                Alertas e eventos relacionados à segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg border-red-200 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{event.user_email}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(event.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IP: {event.ip_address}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Audit;