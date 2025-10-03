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
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Shield, Lock, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

const SecuritySettings = () => {
  const navigate = useNavigate();
  const designTokens = useDesignTokens();
  const [loading, setLoading] = useState(false);

  // Estados para as configurações de segurança
  const [securitySettings, setSecuritySettings] = useState({
    // Políticas de Senha
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiration: 90, // dias
    preventReuse: 5, // últimas senhas
    
    // Configurações de 2FA
    twoFactorEnabled: true,
    twoFactorRequired: false,
    backupCodes: 10,
    
    // Políticas de Bloqueio
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutos
    ipWhitelist: '',
    
    // Configurações de Sessão
    requireSecureConnection: true,
    sessionTimeout: 120, // minutos
    concurrentSessionLimit: 3
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações de Segurança Salvas",
        description: "As configurações de segurança foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de segurança. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  // Calcular força da senha baseada nas configurações
  const getPasswordStrength = () => {
    let score = 0;
    if (securitySettings.minPasswordLength >= 8) score += 1;
    if (securitySettings.requireUppercase) score += 1;
    if (securitySettings.requireLowercase) score += 1;
    if (securitySettings.requireNumbers) score += 1;
    if (securitySettings.requireSpecialChars) score += 1;
    
    if (score <= 2) return { level: 'Fraca', color: 'bg-red-500' };
    if (score <= 4) return { level: 'Média', color: 'bg-yellow-500' };
    return { level: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

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
              style={{ backgroundColor: designTokens.colors.destructive[50] }}
            >
              <Shield className="h-5 w-5" style={{ color: designTokens.colors.destructive.DEFAULT }} />
            </div>
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Configurações de Segurança
              </h1>
              <p 
                className="text-lg text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Políticas de segurança e proteção da conta
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Políticas de Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Políticas de Senha</span>
              </CardTitle>
              <CardDescription>
                Configurações de complexidade e expiração de senhas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPasswordLength">Comprimento Mínimo</Label>
                  <Input
                    id="minPasswordLength"
                    type="number"
                    value={securitySettings.minPasswordLength}
                    onChange={(e) => updateSetting('minPasswordLength', parseInt(e.target.value))}
                    min="6"
                    max="32"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiration">Expiração (dias)</Label>
                  <Input
                    id="passwordExpiration"
                    type="number"
                    value={securitySettings.passwordExpiration}
                    onChange={(e) => updateSetting('passwordExpiration', parseInt(e.target.value))}
                    min="30"
                    max="365"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maiúsculas Obrigatórias</Label>
                    <p className="text-sm text-gray-600">
                      Exigir pelo menos uma letra maiúscula
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireUppercase}
                    onCheckedChange={(checked) => updateSetting('requireUppercase', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Minúsculas Obrigatórias</Label>
                    <p className="text-sm text-gray-600">
                      Exigir pelo menos uma letra minúscula
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireLowercase}
                    onCheckedChange={(checked) => updateSetting('requireLowercase', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Números Obrigatórios</Label>
                    <p className="text-sm text-gray-600">
                      Exigir pelo menos um número
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireNumbers}
                    onCheckedChange={(checked) => updateSetting('requireNumbers', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Caracteres Especiais</Label>
                    <p className="text-sm text-gray-600">
                      Exigir pelo menos um caractere especial (!@#$%^&*)
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireSpecialChars}
                    onCheckedChange={(checked) => updateSetting('requireSpecialChars', checked)}
                  />
                </div>
              </div>
              
              {/* Indicador de Força da Senha */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Força da Senha</span>
                  <Badge variant="secondary" className={passwordStrength.color}>
                    {passwordStrength.level}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${passwordStrength.color}`}
                    style={{ 
                      width: `${(() => {
                        if (passwordStrength.level === 'Fraca') return 33;
                        if (passwordStrength.level === 'Média') return 66;
                        return 100;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Autenticação de Dois Fatores (2FA)</span>
              </CardTitle>
              <CardDescription>
                Configurações de autenticação de dois fatores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>2FA Habilitado</Label>
                  <p className="text-sm text-gray-600">
                    Permitir autenticação de dois fatores
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => updateSetting('twoFactorEnabled', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>2FA Obrigatório</Label>
                  <p className="text-sm text-gray-600">
                    Exigir 2FA para todos os usuários
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorRequired}
                  onCheckedChange={(checked) => updateSetting('twoFactorRequired', checked)}
                  disabled={!securitySettings.twoFactorEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backupCodes">Códigos de Backup</Label>
                <Input
                  id="backupCodes"
                  type="number"
                  value={securitySettings.backupCodes}
                  onChange={(e) => updateSetting('backupCodes', parseInt(e.target.value))}
                  min="5"
                  max="20"
                  disabled={!securitySettings.twoFactorEnabled}
                />
                <p className="text-sm text-gray-600">
                  Número de códigos de backup gerados por usuário
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Políticas de Bloqueio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Políticas de Bloqueio</span>
              </CardTitle>
              <CardDescription>
                Configurações de bloqueio de conta e proteção contra ataques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máximo de Tentativas</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Duração do Bloqueio (min)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value))}
                    min="5"
                    max="1440"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                <Input
                  id="ipWhitelist"
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => updateSetting('ipWhitelist', e.target.value)}
                  placeholder="192.168.1.0/24, 10.0.0.0/8"
                />
                <p className="text-sm text-gray-600">
                  IPs ou redes permitidas (separadas por vírgula)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Sessão Segura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Configurações de Sessão Segura</span>
              </CardTitle>
              <CardDescription>
                Configurações adicionais de segurança para sessões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Conexão Segura Obrigatória</Label>
                  <p className="text-sm text-gray-600">
                    Exigir HTTPS para todas as conexões
                  </p>
                </div>
                <Switch
                  checked={securitySettings.requireSecureConnection}
                  onCheckedChange={(checked) => updateSetting('requireSecureConnection', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout da Sessão (min)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    min="15"
                    max="480"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="concurrentSessionLimit">Limite de Sessões Simultâneas</Label>
                  <Input
                    id="concurrentSessionLimit"
                    type="number"
                    value={securitySettings.concurrentSessionLimit}
                    onChange={(e) => updateSetting('concurrentSessionLimit', parseInt(e.target.value))}
                    min="1"
                    max="10"
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

export default SecuritySettings;
