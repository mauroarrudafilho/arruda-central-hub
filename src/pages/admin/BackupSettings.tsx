import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Database, Download, Upload, Clock, CheckCircle, AlertTriangle, Play, Pause } from 'lucide-react';

const BackupSettings = () => {
  const navigate = useNavigate();
  const designTokens = useDesignTokens();
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Estados para configurações de backup
  const [backupSettings, setBackupSettings] = useState({
    // Configurações de Backup Automático
    autoBackup: {
      enabled: true,
      frequency: 'daily',
      time: '02:00',
      retention: 30, // dias
      compression: true
    },
    
    // Configurações de Armazenamento
    storage: {
      location: 'local',
      s3Bucket: '',
      s3Region: 'us-east-1',
      encryption: true
    },
    
    // Configurações de Backup Manual
    manual: {
      includeUsers: true,
      includeRoles: true,
      includeLogs: false,
      includeFiles: true
    }
  });

  // Histórico de backups mockado
  const [backupHistory] = useState([
    {
      id: 1,
      type: 'automático',
      date: '2025-01-15 02:00:00',
      size: '2.3 GB',
      status: 'sucesso',
      duration: '15 min'
    },
    {
      id: 2,
      type: 'manual',
      date: '2025-01-14 14:30:00',
      size: '2.1 GB',
      status: 'sucesso',
      duration: '12 min'
    },
    {
      id: 3,
      type: 'automático',
      date: '2025-01-13 02:00:00',
      size: '2.0 GB',
      status: 'sucesso',
      duration: '14 min'
    },
    {
      id: 4,
      type: 'automático',
      date: '2025-01-12 02:00:00',
      size: '1.9 GB',
      status: 'erro',
      duration: '5 min'
    }
  ]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações de Backup Salvas",
        description: "As configurações de backup foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de backup. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setBackupSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const startBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    // Simular progresso do backup
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          toast({
            title: "Backup Concluído",
            description: "O backup foi realizado com sucesso!",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'erro':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      case 'em_andamento':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
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
          
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: designTokens.colors.secondary[50] }}
            >
              <Database className="h-5 w-5" style={{ color: designTokens.colors.secondary.DEFAULT }} />
            </div>
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Backup & Restore
              </h1>
              <p 
                className="text-lg text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Configurações de backup automático e restore de dados
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Backup Automático */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Backup Automático</span>
                </CardTitle>
                <CardDescription>
                  Configurações para backup automático do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup Automático Habilitado</Label>
                    <p className="text-sm text-gray-600">
                      Executar backups automaticamente conforme agendamento
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.autoBackup.enabled}
                    onCheckedChange={(checked) => updateSetting('autoBackup', 'enabled', checked)}
                  />
                </div>
                
                {backupSettings.autoBackup.enabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequência</Label>
                        <Select 
                          value={backupSettings.autoBackup.frequency} 
                          onValueChange={(value) => updateSetting('autoBackup', 'frequency', value)}
                        >
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="time">Horário</Label>
                        <Input
                          id="time"
                          type="time"
                          value={backupSettings.autoBackup.time}
                          onChange={(e) => updateSetting('autoBackup', 'time', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="retention">Retenção (dias)</Label>
                        <Input
                          id="retention"
                          type="number"
                          value={backupSettings.autoBackup.retention}
                          onChange={(e) => updateSetting('autoBackup', 'retention', parseInt(e.target.value))}
                          min="1"
                          max="365"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Compressão</Label>
                          <p className="text-sm text-gray-600">
                            Comprimir arquivos de backup
                          </p>
                        </div>
                        <Switch
                          checked={backupSettings.autoBackup.compression}
                          onCheckedChange={(checked) => updateSetting('autoBackup', 'compression', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Configurações de Armazenamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Armazenamento</span>
                </CardTitle>
                <CardDescription>
                  Configurações de onde armazenar os backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Local de Armazenamento</Label>
                  <Select 
                    value={backupSettings.storage.location} 
                    onValueChange={(value) => updateSetting('storage', 'location', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local (Servidor)</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                      <SelectItem value="azure">Azure Blob Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {backupSettings.storage.location === 's3' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="s3Bucket">Bucket S3</Label>
                      <Input
                        id="s3Bucket"
                        value={backupSettings.storage.s3Bucket}
                        onChange={(e) => updateSetting('storage', 's3Bucket', e.target.value)}
                        placeholder="meu-bucket-backup"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="s3Region">Região</Label>
                      <Select 
                        value={backupSettings.storage.s3Region} 
                        onValueChange={(value) => updateSetting('storage', 's3Region', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                          <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                          <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                          <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Criptografia</Label>
                    <p className="text-sm text-gray-600">
                      Criptografar arquivos de backup
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.storage.encryption}
                    onCheckedChange={(checked) => updateSetting('storage', 'encryption', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Backup Manual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Backup Manual</span>
                </CardTitle>
                <CardDescription>
                  Configurações para backup manual do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Incluir Usuários</Label>
                      <p className="text-sm text-gray-600">
                        Incluir dados de usuários e perfis
                      </p>
                    </div>
                    <Switch
                      checked={backupSettings.manual.includeUsers}
                      onCheckedChange={(checked) => updateSetting('manual', 'includeUsers', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Incluir Roles e Permissões</Label>
                      <p className="text-sm text-gray-600">
                        Incluir configurações de RBAC
                      </p>
                    </div>
                    <Switch
                      checked={backupSettings.manual.includeRoles}
                      onCheckedChange={(checked) => updateSetting('manual', 'includeRoles', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Incluir Logs</Label>
                      <p className="text-sm text-gray-600">
                        Incluir logs de auditoria e sistema
                      </p>
                    </div>
                    <Switch
                      checked={backupSettings.manual.includeLogs}
                      onCheckedChange={(checked) => updateSetting('manual', 'includeLogs', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Incluir Arquivos</Label>
                      <p className="text-sm text-gray-600">
                        Incluir arquivos e documentos
                      </p>
                    </div>
                    <Switch
                      checked={backupSettings.manual.includeFiles}
                      onCheckedChange={(checked) => updateSetting('manual', 'includeFiles', checked)}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    onClick={startBackup}
                    disabled={isBackingUp}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    {isBackingUp ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>Backup em Andamento...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Iniciar Backup Manual</span>
                      </>
                    )}
                  </Button>
                  
                  {isBackingUp && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progresso do Backup</span>
                        <span className="text-sm font-medium text-gray-900">{backupProgress}%</span>
                      </div>
                      <Progress value={backupProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Histórico de Backups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Histórico de Backups</span>
                </CardTitle>
                <CardDescription>
                  Últimos backups realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(backup.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {backup.type === 'automático' ? 'Backup Automático' : 'Backup Manual'}
                          </p>
                          <p className="text-xs text-gray-600">{backup.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(backup.status)}
                        <p className="text-xs text-gray-500 mt-1">{backup.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Ações comuns de backup e restore
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Último Backup
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar Backup
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Verificar Integridade
                </Button>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Salvando...' : 'Salvar Configurações'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin')}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
