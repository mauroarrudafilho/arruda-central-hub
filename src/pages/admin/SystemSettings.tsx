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
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Globe, Clock, Bell } from 'lucide-react';

const SystemSettings = () => {
  const navigate = useNavigate();
  const designTokens = useDesignTokens();
  const [loading, setLoading] = useState(false);

  // Estados para as configurações
  const [settings, setSettings] = useState({
    // Configurações Gerais
    companyName: 'Arruda Hub',
    timezone: 'America/Sao_Paulo',
    defaultLanguage: 'pt-BR',
    
    // Configurações de Sessão
    sessionTimeout: 120, // minutos
    autoRenewal: true,
    maxConcurrentSessions: 3,
    
    // Configurações de Notificações
    emailNotifications: true,
    pushNotifications: false,
    maintenanceAlerts: true,
    securityAlerts: true
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações Salvas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              style={{ backgroundColor: designTokens.colors.primary[50] }}
            >
              <Globe className="h-5 w-5" style={{ color: designTokens.colors.primary.DEFAULT }} />
            </div>
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Configurações do Sistema
              </h1>
              <p 
                className="text-lg text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Configurações gerais e políticas do sistema
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Configurações Gerais</span>
              </CardTitle>
              <CardDescription>
                Configurações básicas da empresa e localização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    placeholder="Nome da empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Idioma Padrão</Label>
                <Select value={settings.defaultLanguage} onValueChange={(value) => updateSetting('defaultLanguage', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Sessão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Configurações de Sessão</span>
              </CardTitle>
              <CardDescription>
                Políticas de timeout e renovação de sessões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout da Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentSessions">Máximo de Sessões Simultâneas</Label>
                  <Input
                    id="maxConcurrentSessions"
                    type="number"
                    value={settings.maxConcurrentSessions}
                    onChange={(e) => updateSetting('maxConcurrentSessions', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Renovação Automática</Label>
                  <p className="text-sm text-gray-600">
                    Renovar sessão automaticamente durante atividade
                  </p>
                </div>
                <Switch
                  checked={settings.autoRenewal}
                  onCheckedChange={(checked) => updateSetting('autoRenewal', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Configurações de Notificações</span>
              </CardTitle>
              <CardDescription>
                Preferências de notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por E-mail</Label>
                    <p className="text-sm text-gray-600">
                      Receber notificações importantes por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-gray-600">
                      Receber notificações push no navegador
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Manutenção</Label>
                    <p className="text-sm text-gray-600">
                      Notificar sobre janelas de manutenção programada
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceAlerts}
                    onCheckedChange={(checked) => updateSetting('maintenanceAlerts', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Segurança</Label>
                    <p className="text-sm text-gray-600">
                      Notificar sobre eventos de segurança críticos
                    </p>
                  </div>
                  <Switch
                    checked={settings.securityAlerts}
                    onCheckedChange={(checked) => updateSetting('securityAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Configurações'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
