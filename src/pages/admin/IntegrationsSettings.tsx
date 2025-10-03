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
import { ArrowLeft, Save, Link, Database, Mail, Globe, Webhook, CheckCircle, AlertCircle } from 'lucide-react';

const IntegrationsSettings = () => {
  const navigate = useNavigate();
  const designTokens = useDesignTokens();
  const [loading, setLoading] = useState(false);

  // Estados para as configurações de integrações
  const [integrations, setIntegrations] = useState({
    // Supabase
    supabase: {
      enabled: true,
      url: 'https://your-project.supabase.co',
      anonKey: '••••••••••••••••••••••••••••••••',
      serviceKey: '••••••••••••••••••••••••••••••••',
      status: 'connected'
    },
    
    // Resend
    resend: {
      enabled: true,
      apiKey: '••••••••••••••••••••••••••••••••',
      fromEmail: 'noreply@arrudahub.com',
      status: 'connected'
    },
    
    // Webhooks
    webhooks: {
      enabled: true,
      url: 'https://api.arrudahub.com/webhooks',
      secret: '••••••••••••••••••••••••••••••••',
      status: 'active'
    },
    
    // SSO/LDAP
    sso: {
      enabled: false,
      provider: 'ldap',
      serverUrl: '',
      domain: '',
      status: 'disabled'
    }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações de Integrações Salvas",
        description: "As configurações de integrações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving integrations settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de integrações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = (service: string, key: string, value: any) => {
    setIntegrations(prev => ({
      ...prev,
      [service]: {
        ...prev[service as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const testConnection = async (service: string) => {
    toast({
      title: "Testando Conexão",
      description: `Testando conexão com ${service}...`,
    });
    
    // Simular teste de conexão
    setTimeout(() => {
      toast({
        title: "Conexão Testada",
        description: `Conexão com ${service} foi bem-sucedida!`,
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disabled':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'disabled':
        return <Badge variant="secondary">Desabilitado</Badge>;
      default:
        return <Badge variant="destructive">Erro</Badge>;
    }
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
              style={{ backgroundColor: designTokens.colors.secondary[50] }}
            >
              <Link className="h-5 w-5" style={{ color: designTokens.colors.secondary.DEFAULT }} />
            </div>
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Configurações de Integrações
              </h1>
              <p 
                className="text-lg text-gray-600"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Gerenciar integrações com serviços externos
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Supabase */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Supabase</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integrations.supabase.status)}
                  {getStatusBadge(integrations.supabase.status)}
                </div>
              </CardTitle>
              <CardDescription>
                Configurações do banco de dados e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Supabase Habilitado</Label>
                  <p className="text-sm text-gray-600">
                    Conectar com o Supabase para banco de dados e auth
                  </p>
                </div>
                <Switch
                  checked={integrations.supabase.enabled}
                  onCheckedChange={(checked) => updateIntegration('supabase', 'enabled', checked)}
                />
              </div>
              
              {integrations.supabase.enabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="supabaseUrl">URL do Projeto</Label>
                      <Input
                        id="supabaseUrl"
                        value={integrations.supabase.url}
                        onChange={(e) => updateIntegration('supabase', 'url', e.target.value)}
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supabaseAnonKey">Chave Anônima</Label>
                      <Input
                        id="supabaseAnonKey"
                        type="password"
                        value={integrations.supabase.anonKey}
                        onChange={(e) => updateIntegration('supabase', 'anonKey', e.target.value)}
                        placeholder="Sua chave anônima do Supabase"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supabaseServiceKey">Chave de Serviço</Label>
                      <Input
                        id="supabaseServiceKey"
                        type="password"
                        value={integrations.supabase.serviceKey}
                        onChange={(e) => updateIntegration('supabase', 'serviceKey', e.target.value)}
                        placeholder="Sua chave de serviço do Supabase"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => testConnection('Supabase')}
                      className="w-full"
                    >
                      Testar Conexão
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Resend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Resend</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integrations.resend.status)}
                  {getStatusBadge(integrations.resend.status)}
                </div>
              </CardTitle>
              <CardDescription>
                Configurações do serviço de e-mail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resend Habilitado</Label>
                  <p className="text-sm text-gray-600">
                    Conectar com o Resend para envio de e-mails
                  </p>
                </div>
                <Switch
                  checked={integrations.resend.enabled}
                  onCheckedChange={(checked) => updateIntegration('resend', 'enabled', checked)}
                />
              </div>
              
              {integrations.resend.enabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resendApiKey">API Key</Label>
                      <Input
                        id="resendApiKey"
                        type="password"
                        value={integrations.resend.apiKey}
                        onChange={(e) => updateIntegration('resend', 'apiKey', e.target.value)}
                        placeholder="Sua API key do Resend"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="resendFromEmail">E-mail Remetente</Label>
                      <Input
                        id="resendFromEmail"
                        type="email"
                        value={integrations.resend.fromEmail}
                        onChange={(e) => updateIntegration('resend', 'fromEmail', e.target.value)}
                        placeholder="noreply@arrudahub.com"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => testConnection('Resend')}
                      className="w-full"
                    >
                      Testar Conexão
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Webhook className="h-5 w-5" />
                  <span>Webhooks</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integrations.webhooks.status)}
                  {getStatusBadge(integrations.webhooks.status)}
                </div>
              </CardTitle>
              <CardDescription>
                Configurações de webhooks para integrações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhooks Habilitados</Label>
                  <p className="text-sm text-gray-600">
                    Ativar sistema de webhooks
                  </p>
                </div>
                <Switch
                  checked={integrations.webhooks.enabled}
                  onCheckedChange={(checked) => updateIntegration('webhooks', 'enabled', checked)}
                />
              </div>
              
              {integrations.webhooks.enabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">URL Base dos Webhooks</Label>
                      <Input
                        id="webhookUrl"
                        value={integrations.webhooks.url}
                        onChange={(e) => updateIntegration('webhooks', 'url', e.target.value)}
                        placeholder="https://api.arrudahub.com/webhooks"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="webhookSecret">Secret dos Webhooks</Label>
                      <Input
                        id="webhookSecret"
                        type="password"
                        value={integrations.webhooks.secret}
                        onChange={(e) => updateIntegration('webhooks', 'secret', e.target.value)}
                        placeholder="Seu secret para validação de webhooks"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SSO/LDAP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>SSO/LDAP</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integrations.sso.status)}
                  {getStatusBadge(integrations.sso.status)}
                </div>
              </CardTitle>
              <CardDescription>
                Configurações de Single Sign-On e LDAP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SSO/LDAP Habilitado</Label>
                  <p className="text-sm text-gray-600">
                    Conectar com servidor LDAP ou SSO
                  </p>
                </div>
                <Switch
                  checked={integrations.sso.enabled}
                  onCheckedChange={(checked) => updateIntegration('sso', 'enabled', checked)}
                />
              </div>
              
              {integrations.sso.enabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ssoServerUrl">URL do Servidor</Label>
                      <Input
                        id="ssoServerUrl"
                        value={integrations.sso.serverUrl}
                        onChange={(e) => updateIntegration('sso', 'serverUrl', e.target.value)}
                        placeholder="ldap://company.com:389"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ssoDomain">Domínio</Label>
                      <Input
                        id="ssoDomain"
                        value={integrations.sso.domain}
                        onChange={(e) => updateIntegration('sso', 'domain', e.target.value)}
                        placeholder="company.com"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => testConnection('SSO/LDAP')}
                      className="w-full"
                    >
                      Testar Conexão
                    </Button>
                  </div>
                </>
              )}
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

export default IntegrationsSettings;
