import { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  user_id: string;
  acao: string;
  modulo: string;
  recurso_tipo: string;
  recurso_id: string;
  nivel: string;
  dados_anteriores: any;
  dados_novos: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  auth_profile?: {
    nome: string;
    email: string;
  };
}

const Audit = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('auth_audit')
        .select(`
          *,
          auth_profile:user_id (
            nome,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs((data || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string || null,
        user_agent: log.user_agent as string || null,
        auth_profile: log.auth_profile && typeof log.auth_profile === 'object' && !Array.isArray(log.auth_profile) && 'nome' in log.auth_profile 
          ? log.auth_profile as { nome: string; email: string }
          : undefined
      })));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de auditoria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.auth_profile?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.auth_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = moduleFilter === 'all' || log.modulo === moduleFilter;
    const matchesLevel = levelFilter === 'all' || log.nivel === levelFilter;

    return matchesSearch && matchesModule && matchesLevel;
  });

  const modules = [...new Set(logs.map(log => log.modulo))];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge variant="secondary">Aviso</Badge>;
      case 'info':
      default:
        return <Badge variant="default">Info</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Email', 'Módulo', 'Ação', 'Nível', 'IP', 'User Agent'],
      ...filteredLogs.map(log => [
        formatDateTime(log.created_at),
        log.auth_profile?.nome || 'Sistema',
        log.auth_profile?.email || '-',
        log.modulo,
        log.acao,
        log.nivel,
        log.ip_address || '-',
        log.user_agent || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria</h1>
          <p className="text-muted-foreground">
            Acompanhe as atividades do sistema
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação, módulo, usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {modules.map(module => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            {filteredLogs.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getLevelBadge(log.nivel)}
                        <Badge variant="outline" className="text-xs">
                          {log.modulo}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="font-medium">{log.acao}</span>
                        {log.recurso_tipo && (
                          <span className="text-muted-foreground ml-2">
                            em {log.recurso_tipo}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span>
                          Por: {log.auth_profile?.nome || 'Sistema'} 
                          {log.auth_profile?.email && ` (${log.auth_profile.email})`}
                        </span>
                        {log.ip_address && (
                          <span className="ml-4">IP: {log.ip_address}</span>
                        )}
                      </div>

                      {(log.dados_anteriores || log.dados_novos) && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                            Ver detalhes das alterações
                          </summary>
                          <div className="mt-2 p-3 bg-muted/30 rounded text-xs">
                            {log.dados_anteriores && (
                              <div className="mb-2">
                                <strong>Antes:</strong>
                                <pre className="mt-1 overflow-x-auto">
                                  {JSON.stringify(log.dados_anteriores, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.dados_novos && (
                              <div>
                                <strong>Depois:</strong>
                                <pre className="mt-1 overflow-x-auto">
                                  {JSON.stringify(log.dados_novos, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;