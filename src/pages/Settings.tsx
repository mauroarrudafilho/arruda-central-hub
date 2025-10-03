import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Archive, 
  Wrench, 
  Database,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Save,
  Info
} from 'lucide-react';

interface SystemConfig {
  session_timeout: number;
  max_login_attempts: number;
  password_min_length: number;
  require_2fa: boolean;
  log_retention_days: number;
  backup_frequency: string;
  maintenance_mode: boolean;
  debug_mode: boolean;
}

interface BackupInfo {
  id: string;
  filename: string;
  size: string;
  created_at: string;
  status: 'completed' | 'failed' | 'in_progress';
}

const SettingsPage = () => {
  const [config, setConfig] = useState<SystemConfig>({
    session_timeout: 7200, // 2 horas
    max_login_attempts: 5,
    password_min_length: 8,
    require_2fa: false,
    log_retention_days: 90,
    backup_frequency: 'daily',
    maintenance_mode: false,
    debug_mode: false
  });
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);

      // Simular busca de configurações (em um sistema real, isso viria de uma tabela de configurações)
      // Por enquanto, usamos valores padrão
      
      // Simular lista de backups
      const mockBackups: BackupInfo[] = [
        {
          id: '1',
          filename: 'backup_2024_01_20.sql',
          size: '2.5 MB',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: '2',
          filename: 'backup_2024_01_19.sql',
          size: '2.3 MB',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        }
      ];

      setBackups(mockBackups);

    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      
      // Simular salvamento (em um sistema real, você salvaria no banco de dados)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setSaving(true);
      
      // Simular criação de backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ type: 'success', text: 'Backup criado com sucesso!' });
      fetchSettingsData();

    } catch (error) {
      console.error('Error creating backup:', error);
      setMessage({ type: 'error', text: 'Erro ao criar backup' });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (confirm('Tem certeza que deseja restaurar este backup? Esta ação não pode ser desfeita.')) {
      try {
        setSaving(true);
        
        // Simular restauração
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        setMessage({ type: 'success', text: 'Backup restaurado com sucesso!' });

      } catch (error) {
        console.error('Error restoring backup:', error);
        setMessage({ type: 'error', text: 'Erro ao restaurar backup' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (confirm('Tem certeza que deseja excluir este backup?')) {
      try {
        setSaving(true);
        
        // Simular exclusão
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMessage({ type: 'success', text: 'Backup excluído com sucesso!' });
        fetchSettingsData();

      } catch (error) {
        console.error('Error deleting backup:', error);
        setMessage({ type: 'error', text: 'Erro ao excluir backup' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleMaintenanceMode = async (enabled: boolean) => {
    try {
      setSaving(true);
      
      // Simular alteração do modo de manutenção
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConfig(prev => ({ ...prev, maintenance_mode: enabled }));
      setMessage({ 
        type: 'success', 
        text: `Modo de manutenção ${enabled ? 'ativado' : 'desativado'} com sucesso!` 
      });
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      setMessage({ type: 'error', text: 'Erro ao alterar modo de manutenção' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
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
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerenciamento de configurações e manutenção</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        {/* Configurações Gerais */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações de Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Segurança</span>
                </CardTitle>
                <CardDescription>
                  Configurações de segurança e autenticação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout de Sessão (segundos)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={config.session_timeout}
                    onChange={(e) => setConfig({...config, session_timeout: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Máximo de Tentativas de Login</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={config.max_login_attempts}
                    onChange={(e) => setConfig({...config, max_login_attempts: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Tamanho Mínimo da Senha</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={config.password_min_length}
                    onChange={(e) => setConfig({...config, password_min_length: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require_2fa">Requerer 2FA</Label>
                  <Switch
                    id="require_2fa"
                    checked={config.require_2fa}
                    onCheckedChange={(checked) => setConfig({...config, require_2fa: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-500" />
                  <span>Sistema</span>
                </CardTitle>
                <CardDescription>
                  Configurações gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="log_retention_days">Retenção de Logs (dias)</Label>
                  <Input
                    id="log_retention_days"
                    type="number"
                    value={config.log_retention_days}
                    onChange={(e) => setConfig({...config, log_retention_days: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">Frequência de Backup</Label>
                  <Select value={config.backup_frequency} onValueChange={(value) => setConfig({...config, backup_frequency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="debug_mode">Modo Debug</Label>
                  <Switch
                    id="debug_mode"
                    checked={config.debug_mode}
                    onCheckedChange={(checked) => setConfig({...config, debug_mode: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backup & Restore */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-purple-500" />
                <span>Backup & Restore</span>
              </CardTitle>
              <CardDescription>
                Gerenciamento de backups do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={handleCreateBackup} disabled={saving}>
                  <Download className="h-4 w-4 mr-2" />
                  {saving ? 'Criando...' : 'Criar Backup'}
                </Button>
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar de Arquivo
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Backups Disponíveis</h3>
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{backup.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {backup.size} - {formatTimestamp(backup.created_at)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(backup.status)}>
                            {backup.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Restaurar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteBackup(backup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manutenção */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  <span>Modo de Manutenção</span>
                </CardTitle>
                <CardDescription>
                  Controle do modo de manutenção do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance_mode">Ativar Modo de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloqueia acesso de usuários não-admin
                    </p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={config.maintenance_mode}
                    onCheckedChange={handleMaintenanceMode}
                  />
                </div>
                {config.maintenance_mode && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      O modo de manutenção está ativo. Apenas administradores podem acessar o sistema.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <span>Limpeza do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Ferramentas de limpeza e otimização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Logs Antigos
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Otimizar Banco de Dados
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Limpar Sessões Expiradas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
