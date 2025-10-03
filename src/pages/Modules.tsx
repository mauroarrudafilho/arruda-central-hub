import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  Globe, 
  ExternalLink, 
  Activity, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor,
  Link
} from 'lucide-react';

interface FrontendModule {
  id: string;
  project_id: string;
  module_name: string;
  display_name: string;
  frontend_url: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  description?: string;
  created_at: string;
  updated_at: string;
  last_health_check?: string;
  health_status?: 'healthy' | 'warning' | 'error';
}

interface ModuleEndpoint {
  id: string;
  module_id: string;
  endpoint_name: string;
  endpoint_url: string;
  method: string;
  status: 'ativo' | 'inativo';
  last_check?: string;
  response_time?: number;
}

const Modules = () => {
  const [modules, setModules] = useState<FrontendModule[]>([]);
  const [endpoints, setEndpoints] = useState<ModuleEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<FrontendModule | null>(null);
  const [formData, setFormData] = useState({
    module_name: '',
    display_name: '',
    frontend_url: '',
    status: 'ativo' as const,
    description: ''
  });

  useEffect(() => {
    fetchModulesData();
  }, []);

  const fetchModulesData = async () => {
    try {
      setLoading(true);

      // Buscar módulos frontend
      const { data: modulesData } = await supabase
        .from('frontend_modules')
        .select('*')
        .order('created_at', { ascending: false });

      // Simular endpoints (em um sistema real, isso viria de uma tabela específica)
      const mockEndpoints: ModuleEndpoint[] = [
        {
          id: '1',
          module_id: '1',
          endpoint_name: 'API Principal',
          endpoint_url: '/api/v1',
          method: 'GET',
          status: 'ativo',
          last_check: new Date().toISOString(),
          response_time: 150
        },
        {
          id: '2',
          module_id: '1',
          endpoint_name: 'Health Check',
          endpoint_url: '/health',
          method: 'GET',
          status: 'ativo',
          last_check: new Date().toISOString(),
          response_time: 50
        }
      ];

      setModules(modulesData || []);
      setEndpoints(mockEndpoints);

    } catch (error) {
      console.error('Error fetching modules data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'manutencao': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const handleSaveModule = async () => {
    try {
      if (editingModule) {
        // Atualizar módulo existente
        const { error } = await supabase
          .from('frontend_modules')
          .update({
            module_name: formData.module_name,
            display_name: formData.display_name,
            frontend_url: formData.frontend_url,
            status: formData.status,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingModule.id);

        if (error) throw error;
      } else {
        // Criar novo módulo
        const { error } = await supabase
          .from('frontend_modules')
          .insert({
            project_id: '1', // Assumindo projeto padrão
            module_name: formData.module_name,
            display_name: formData.display_name,
            frontend_url: formData.frontend_url,
            status: formData.status,
            description: formData.description
          });

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setEditingModule(null);
      setFormData({
        module_name: '',
        display_name: '',
        frontend_url: '',
        status: 'ativo',
        description: ''
      });
      fetchModulesData();

    } catch (error) {
      console.error('Error saving module:', error);
    }
  };

  const handleEditModule = (module: FrontendModule) => {
    setEditingModule(module);
    setFormData({
      module_name: module.module_name,
      display_name: module.display_name,
      frontend_url: module.frontend_url,
      status: module.status,
      description: module.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('Tem certeza que deseja excluir este módulo?')) {
      try {
        const { error } = await supabase
          .from('frontend_modules')
          .delete()
          .eq('id', moduleId);

        if (error) throw error;
        fetchModulesData();
      } catch (error) {
        console.error('Error deleting module:', error);
      }
    }
  };

  const checkModuleHealth = async (module: FrontendModule) => {
    try {
      // Simular verificação de saúde
      await fetch(module.frontend_url + '/health', {
        method: 'GET',
        mode: 'no-cors' // Para evitar CORS
      });

      // Atualizar status de saúde (simulado)
      const healthStatus = Math.random() > 0.2 ? 'healthy' : 'warning';
      
      // Em um sistema real, você atualizaria o banco de dados
      console.log(`Health check for ${module.display_name}: ${healthStatus}`);
      
    } catch (error) {
      console.error('Error checking module health:', error);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Módulos</h1>
          <p className="text-gray-600">Configuração e monitoramento dos módulos frontend</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingModule(null);
              setFormData({
                module_name: '',
                display_name: '',
                frontend_url: '',
                status: 'ativo',
                description: ''
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações do módulo frontend
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module_name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="module_name"
                  value={formData.module_name}
                  onChange={(e) => setFormData({...formData, module_name: e.target.value})}
                  className="col-span-3"
                  placeholder="ex: acordos"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="display_name" className="text-right">
                  Nome Exibição
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  className="col-span-3"
                  placeholder="ex: Acordos Comerciais"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frontend_url" className="text-right">
                  URL
                </Label>
                <Input
                  id="frontend_url"
                  value={formData.frontend_url}
                  onChange={(e) => setFormData({...formData, frontend_url: e.target.value})}
                  className="col-span-3"
                  placeholder="https://exemplo.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="col-span-3"
                  placeholder="Descrição do módulo..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveModule}>
                {editingModule ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="frontend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frontend">Frontend Modules</TabsTrigger>
          <TabsTrigger value="endpoints">URLs e Endpoints</TabsTrigger>
          <TabsTrigger value="status">Status dos Módulos</TabsTrigger>
        </TabsList>

        {/* Frontend Modules */}
        <TabsContent value="frontend" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <span>{module.display_name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(module.status)}>
                        {module.status}
                      </Badge>
                      <div className={`flex items-center space-x-1 ${getHealthColor(module.health_status)}`}>
                        {getHealthIcon(module.health_status)}
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    {module.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">URL:</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {module.frontend_url}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nome do Módulo:</p>
                    <p className="text-sm text-muted-foreground">{module.module_name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(module.frontend_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Acessar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => checkModuleHealth(module)}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Health Check
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditModule(module)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteModule(module.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* URLs e Endpoints */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link className="h-5 w-5 text-green-500" />
                <span>Endpoints dos Módulos</span>
              </CardTitle>
              <CardDescription>
                Monitoramento de APIs e endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{endpoint.method}</Badge>
                        <div>
                          <p className="font-medium">{endpoint.endpoint_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {endpoint.endpoint_url}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {endpoint.response_time}ms
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status dos Módulos */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-purple-500" />
                <span>Status dos Módulos</span>
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real da saúde dos módulos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 ${getHealthColor(module.health_status)}`}>
                          {getHealthIcon(module.health_status)}
                          <span className="font-medium">{module.display_name}</span>
                        </div>
                        <Badge className={getStatusColor(module.status)}>
                          {module.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Última verificação: {module.last_health_check ? 
                            new Date(module.last_health_check).toLocaleString('pt-BR') : 
                            'Nunca'
                          }
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => checkModuleHealth(module)}
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          Verificar
                        </Button>
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

export default Modules;
