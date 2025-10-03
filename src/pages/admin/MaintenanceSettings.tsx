import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Wrench, Trash2, Database, AlertTriangle, CheckCircle, Clock, Settings } from 'lucide-react';

const MaintenanceSettings = () => {
  const navigate = useNavigate();
  const designTokens = useDesignTokens();
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);

  // Estados para configurações de manutenção
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    // Limpeza de Logs
    logCleanup: {
      enabled: true,
      retentionDays: 90,
      autoCleanup: true,
      cleanupTime: '03:00'
    },
    
    // Otimização de Banco
    databaseOptimization: {
      enabled: true,
      frequency: 'weekly',
      vacuumTables: true,
      analyzeTables: true,
      reindexTables: false
    },
    
    // Configurações de Sistema
    systemMaintenance: {
      clearCache: true,
      optimizeMemory: true,
      checkDiskSpace: true,
      updateIndexes: true
    }
  });

  // Estatísticas do sistema mockadas
  const [systemStats] = useState({
    logsSize: '2.3 GB',
    databaseSize: '1.8 GB',
    cacheSize: '450 MB',
    diskUsage: 68,
    lastOptimization: '2025-01-10 03:00:00',
    nextCleanup: '2025-01-16 03:00:00'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações de Manutenção Salvas",
        description: "As configurações de manutenção foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error('Error saving maintenance settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de manutenção. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setMaintenanceSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const toggleMaintenanceMode = async () => {
    const newMode = !maintenanceMode;
    setMaintenanceMode(newMode);
    
    toast({
      title: newMode ? "Modo de Manutenção Ativado" : "Modo de Manutenção Desativado",
      description: newMode 
        ? "O sistema está em modo de manutenção. Usuários não conseguem acessar." 
        : "O sistema voltou ao normal. Usuários podem acessar novamente.",
      variant: newMode ? "destructive" : "default"
    });
  };

  const startCleanup = async () => {
    setIsCleaning(true);
    setCleanupProgress(0);
    
    // Simular progresso da limpeza
    const interval = setInterval(() => {
      setCleanupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCleaning(false);
          toast({
            title: "Limpeza Concluída",
            description: "A limpeza do sistema foi realizada com sucesso!",
          });
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const optimizeDatabase = async () => {
    toast({
      title: "Otimização Iniciada",
      description: "A otimização do banco de dados foi iniciada...",
    });
    
    // Simular otimização
    setTimeout(() => {
      toast({
        title: "Otimização Concluída",
        description: "O banco de dados foi otimizado com sucesso!",
      });
    }, 3000);
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
              style={{ backgroundColor: designTokens.colors.warning[50] }}
            >
              <Wrench className="h-5 w-5" style={{ color: designTokens.colors.warning.DEFAULT }} />
            </div>
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Manutenção do Sistema
              </h1>
              <p 
                className="text-lg text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Ferramentas de manutenção e otimização do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Modo de Manutenção */}
        {maintenanceMode && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Modo de Manutenção Ativo</h3>
                <p className="text-sm text-red-600">
                  O sistema está em modo de manutenção. Usuários não conseguem acessar o sistema.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Limpeza de Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Limpeza de Logs</span>
                </CardTitle>
                <CardDescription>
                  Configurações para limpeza automática de logs antigos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Limpeza Automática Habilitada</Label>
                    <p className="text-sm text-gray-600">
                      Remover logs antigos automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceSettings.logCleanup.enabled}
                    onCheckedChange={(checked) => updateSetting('logCleanup', 'enabled', checked)}
                  />
                </div>
                
                {maintenanceSettings.logCleanup.enabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="retentionDays">Retenção (dias)</Label>
                        <Input
                          id="retentionDays"
                          type="number"
                          value={maintenanceSettings.logCleanup.retentionDays}
                          onChange={(e) => updateSetting('logCleanup', 'retentionDays', parseInt(e.target.value))}
                          min="7"
                          max="365"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cleanupTime">Horário da Limpeza</Label>
                        <Input
                          id="cleanupTime"
                          type="time"
                          value={maintenanceSettings.logCleanup.cleanupTime}
                          onChange={(e) => updateSetting('logCleanup', 'cleanupTime', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Limpeza Automática Diária</Label>
                        <p className="text-sm text-gray-600">
                          Executar limpeza todos os dias no horário configurado
                        </p>
                      </div>
                      <Switch
                        checked={maintenanceSettings.logCleanup.autoCleanup}
                        onCheckedChange={(checked) => updateSetting('logCleanup', 'autoCleanup', checked)}
                      />
                    </div>
                  </>
                )}
                
                <div className="pt-4">
                  <Button
                    onClick={startCleanup}
                    disabled={isCleaning}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    {isCleaning ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>Limpando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Executar Limpeza Manual</span>
                      </>
                    )}
                  </Button>
                  
                  {isCleaning && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progresso da Limpeza</span>
                        <span className="text-sm font-medium text-gray-900">{cleanupProgress}%</span>
                      </div>
                      <Progress value={cleanupProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Otimização de Banco de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Otimização de Banco de Dados</span>
                </CardTitle>
                <CardDescription>
                  Configurações para otimização automática do banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otimização Automática Habilitada</Label>
                    <p className="text-sm text-gray-600">
                      Executar otimizações automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceSettings.databaseOptimization.enabled}
                    onCheckedChange={(checked) => updateSetting('databaseOptimization', 'enabled', checked)}
                  />
                </div>
                
                {maintenanceSettings.databaseOptimization.enabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>VACUUM de Tabelas</Label>
                          <p className="text-sm text-gray-600">
                            Executar VACUUM para recuperar espaço em disco
                          </p>
                        </div>
                        <Switch
                          checked={maintenanceSettings.databaseOptimization.vacuumTables}
                          onCheckedChange={(checked) => updateSetting('databaseOptimization', 'vacuumTables', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>ANALYZE de Tabelas</Label>
                          <p className="text-sm text-gray-600">
                            Atualizar estatísticas das tabelas
                          </p>
                        </div>
                        <Switch
                          checked={maintenanceSettings.databaseOptimization.analyzeTables}
                          onCheckedChange={(checked) => updateSetting('databaseOptimization', 'analyzeTables', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>REINDEX de Tabelas</Label>
                          <p className="text-sm text-gray-600">
                            Reconstruir índices das tabelas (pode ser lento)
                          </p>
                        </div>
                        <Switch
                          checked={maintenanceSettings.databaseOptimization.reindexTables}
                          onCheckedChange={(checked) => updateSetting('databaseOptimization', 'reindexTables', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="pt-4">
                  <Button
                    onClick={optimizeDatabase}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <Database className="h-4 w-4" />
                    <span>Executar Otimização Manual</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações de Sistema</span>
                </CardTitle>
                <CardDescription>
                  Configurações gerais de manutenção do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Limpar Cache</Label>
                      <p className="text-sm text-gray-600">
                        Limpar cache do sistema durante manutenção
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceSettings.systemMaintenance.clearCache}
                      onCheckedChange={(checked) => updateSetting('systemMaintenance', 'clearCache', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Otimizar Memória</Label>
                      <p className="text-sm text-gray-600">
                        Otimizar uso de memória do sistema
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceSettings.systemMaintenance.optimizeMemory}
                      onCheckedChange={(checked) => updateSetting('systemMaintenance', 'optimizeMemory', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Verificar Espaço em Disco</Label>
                      <p className="text-sm text-gray-600">
                        Verificar e alertar sobre espaço em disco
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceSettings.systemMaintenance.checkDiskSpace}
                      onCheckedChange={(checked) => updateSetting('systemMaintenance', 'checkDiskSpace', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Atualizar Índices</Label>
                      <p className="text-sm text-gray-600">
                        Atualizar índices de busca e performance
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceSettings.systemMaintenance.updateIndexes}
                      onCheckedChange={(checked) => updateSetting('systemMaintenance', 'updateIndexes', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Estatísticas do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Informações sobre uso de recursos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tamanho dos Logs</span>
                    <span className="text-sm font-bold text-gray-900">{systemStats.logsSize}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tamanho do Banco</span>
                    <span className="text-sm font-bold text-gray-900">{systemStats.databaseSize}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tamanho do Cache</span>
                    <span className="text-sm font-bold text-gray-900">{systemStats.cacheSize}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Uso do Disco</span>
                      <span className="text-sm font-bold text-gray-900">{systemStats.diskUsage}%</span>
                    </div>
                    <Progress value={systemStats.diskUsage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modo de Manutenção */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Modo de Manutenção</span>
                </CardTitle>
                <CardDescription>
                  Controle de acesso ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-xs text-gray-600">
                      {maintenanceMode ? 'Sistema em manutenção' : 'Sistema operacional'}
                    </p>
                  </div>
                  <Badge variant={maintenanceMode ? "destructive" : "default"}>
                    {maintenanceMode ? 'Manutenção' : 'Normal'}
                  </Badge>
                </div>
                
                <Button
                  onClick={toggleMaintenanceMode}
                  variant={maintenanceMode ? "default" : "destructive"}
                  className="w-full"
                >
                  {maintenanceMode ? 'Desativar Manutenção' : 'Ativar Manutenção'}
                </Button>
                
                {maintenanceMode && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">
                      ⚠️ Usuários não conseguem acessar o sistema durante a manutenção.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Próximas Tarefas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Próximas Tarefas</span>
                </CardTitle>
                <CardDescription>
                  Agendamento de manutenção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Limpeza de Logs</p>
                    <p className="text-xs text-gray-600">{systemStats.nextCleanup}</p>
                  </div>
                  <Badge variant="secondary">Agendado</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Otimização do Banco</p>
                    <p className="text-xs text-gray-600">Domingo 03:00</p>
                  </div>
                  <Badge variant="secondary">Agendado</Badge>
                </div>
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

export default MaintenanceSettings;
