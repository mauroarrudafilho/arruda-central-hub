import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { SecurityLogger, SecurityEventType, SecuritySeverity } from '@/lib/security-logger';
import { 
  Shield, 
  AlertTriangle, 
  Search,
  Download,
  RefreshCw,
  Eye,
  Clock,
  MapPin,
  User,
  Activity
} from 'lucide-react';

interface SecurityLog {
  id: string;
  user_id?: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  resource_path?: string;
  action?: string;
  success?: boolean;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  error_message?: string;
  created_at: string;
  auth_profile?: {
    email: string;
    nome: string;
  };
}

interface SecurityStats {
  total: number;
  last24h: number;
  last7d: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byEventType: Record<string, number>;
}

const SecurityLogs = () => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [filterSuccess, setFilterSuccess] = useState<string>('all');
  const designTokens = useDesignTokens();

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Buscar logs de segurança
      const logs = await SecurityLogger.getSecurityLogs({ limit: 200 });
      setSecurityLogs(logs);

      // Buscar estatísticas
      const securityStats = await SecurityLogger.getSecurityStats();
      setStats(securityStats);

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: SecurityEventType) => {
    switch (eventType) {
      case 'login_attempt':
      case 'login_success':
      case 'login_failed':
        return <User className="h-4 w-4" />;
      case 'password_reset_request':
      case 'password_reset_success':
        return <Shield className="h-4 w-4" />;
      case 'suspicious_activity':
      case 'brute_force_attempt':
        return <AlertTriangle className="h-4 w-4" />;
      case 'permission_denied':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  const filteredLogs = securityLogs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.auth_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm);

    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesEventType = filterEventType === 'all' || log.event_type === filterEventType;
    const matchesSuccess = filterSuccess === 'all' || 
      (filterSuccess === 'success' && log.success === true) ||
      (filterSuccess === 'failure' && log.success === false);

    return matchesSearch && matchesSeverity && matchesEventType && matchesSuccess;
  });

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Event Type', 'Severity', 'User', 'Description', 'IP Address', 'Success'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.created_at),
        log.event_type,
        log.severity,
        log.auth_profile?.email || 'Sistema',
        log.description,
        log.ip_address || 'N/A',
        log.success ? 'Sim' : 'Não'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Carregando logs de segurança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
        >
          Logs de Segurança
        </h1>
        <p 
          className="text-gray-600"
          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
        >
          Monitoramento e análise de eventos de segurança do sistema
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.last24h} nas últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.bySeverity.critical}</div>
              <p className="text-xs text-muted-foreground">
                {stats.bySeverity.high} de alta prioridade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos 7 dias</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last7d}</div>
              <p className="text-xs text-muted-foreground">
                eventos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Evento</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byEventType).length}</div>
              <p className="text-xs text-muted-foreground">
                categorias diferentes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as severidades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEventType} onValueChange={setFilterEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="login_attempt">Tentativas de login</SelectItem>
                <SelectItem value="password_reset_request">Reset de senha</SelectItem>
                <SelectItem value="suspicious_activity">Atividade suspeita</SelectItem>
                <SelectItem value="permission_denied">Acesso negado</SelectItem>
                <SelectItem value="brute_force_attempt">Força bruta</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={fetchSecurityData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={exportLogs} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Eventos de Segurança ({filteredLogs.length})</span>
          </CardTitle>
          <CardDescription>
            Logs de segurança filtrados e ordenados por data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-4 border rounded-lg ${
                  log.severity === 'critical' ? 'border-red-200 bg-red-50' :
                  log.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                  log.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getEventTypeIcon(log.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {log.event_type.replace(/_/g, ' ')}
                        </Badge>
                        {log.success !== undefined && (
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? 'Sucesso' : 'Falha'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {log.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {log.auth_profile?.email && (
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {log.auth_profile.email}
                          </span>
                        )}
                        {log.ip_address && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {log.ip_address}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-red-600 mt-2">
                          Erro: {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum log de segurança encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityLogs;

