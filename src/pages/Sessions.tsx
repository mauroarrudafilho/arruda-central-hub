import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Monitor, 
  Users, 
  Activity, 
  Clock, 
  MapPin, 
  Smartphone,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SessionData {
  id: string;
  user_name: string;
  user_email: string;
  project_name: string;
  frontend_module: string;
  frontend_origin: string;
  last_activity: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  expired_sessions: number;
  unique_users: number;
  modules_in_use: { module: string; count: number }[];
}

const Sessions = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSessionsData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchSessionsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessionsData = async () => {
    try {
      if (!loading) setRefreshing(true);
      
      // Buscar sessões ativas com informações dos usuários
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select(`
          id,
          frontend_module,
          frontend_origin,
          last_activity,
          expires_at,
          ip_address,
          user_agent,
          created_at,
          auth_profile:user_id (
            nome,
            email
          ),
          projects:project_id (
            nome
          )
        `)
        .order('last_activity', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Transformar dados para o formato esperado
      const formattedSessions: SessionData[] = sessionsData?.map(session => ({
        id: session.id,
        user_name: session.auth_profile?.nome || 'N/A',
        user_email: session.auth_profile?.email || 'N/A',
        project_name: session.projects?.nome || 'N/A',
        frontend_module: session.frontend_module,
        frontend_origin: session.frontend_origin,
        last_activity: session.last_activity,
        expires_at: session.expires_at,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        created_at: session.created_at,
      })) || [];

      setSessions(formattedSessions);

      // Calcular estatísticas
      const now = new Date();
      const activeSessions = formattedSessions.filter(s => new Date(s.expires_at) > now);
      const expiredSessions = formattedSessions.filter(s => new Date(s.expires_at) <= now);
      const uniqueUsers = new Set(formattedSessions.map(s => s.user_email)).size;
      
      const moduleCounts = formattedSessions.reduce((acc, session) => {
        acc[session.frontend_module] = (acc[session.frontend_module] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const modulesInUse = Object.entries(moduleCounts).map(([module, count]) => ({
        module,
        count
      }));

      setStats({
        total_sessions: formattedSessions.length,
        active_sessions: activeSessions.length,
        expired_sessions: expiredSessions.length,
        unique_users: uniqueUsers,
        modules_in_use: modulesInUse
      });

    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das sessões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ expires_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Sessão terminada",
        description: "A sessão foi terminada com sucesso",
      });

      fetchSessionsData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao terminar sessão",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent?.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const isSessionActive = (expiresAt: string) => {
    return new Date(expiresAt) > new Date();
  };

  const getTimeSinceLastActivity = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const columns = [
    {
      accessorKey: 'user_name',
      header: 'Usuário',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.user_name}</div>
          <div className="text-sm text-muted-foreground">{row.original.user_email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'frontend_module',
      header: 'Módulo',
      cell: ({ row }: any) => (
        <div>
          <Badge variant="outline" className="capitalize">
            {row.original.frontend_module}
          </Badge>
          <div className="text-xs text-muted-foreground mt-1">
            {row.original.project_name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'last_activity',
      header: 'Última Atividade',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm">
              {getTimeSinceLastActivity(row.original.last_activity)} atrás
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(row.original.last_activity).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const active = isSessionActive(row.original.expires_at);
        return (
          <Badge variant={active ? "default" : "destructive"}>
            {active ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativa
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Expirada
              </>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'device_info',
      header: 'Dispositivo/Local',
      cell: ({ row }: any) => (
        <div className="flex items-start gap-2">
          {getDeviceIcon(row.original.user_agent)}
          <div>
            <div className="text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {row.original.ip_address || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-48">
              {row.original.user_agent?.split(' ')[0] || 'N/A'}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          {isSessionActive(row.original.expires_at) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => terminateSession(row.original.id)}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Terminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Sessões Ativas
          </h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real das sessões dos usuários
          </p>
        </div>
        <Button 
          onClick={fetchSessionsData} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sessions}</div>
              <p className="text-xs text-muted-foreground">
                Todas as sessões registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_sessions}</div>
              <p className="text-xs text-muted-foreground">
                Usuários conectados agora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões Expiradas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.expired_sessions}</div>
              <p className="text-xs text-muted-foreground">
                Sessões que expiraram
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unique_users}</div>
              <p className="text-xs text-muted-foreground">
                Usuários diferentes conectados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Módulos em uso */}
      {stats && stats.modules_in_use.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Módulos em Uso</CardTitle>
            <CardDescription>
              Distribuição de sessões por módulo do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.modules_in_use.map(({ module, count }) => (
                <div key={module} className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {module}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de sessões */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões Detalhadas</CardTitle>
          <CardDescription>
            {sessions.length} sessão(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={sessions}
            loading={refreshing}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Sessions;

