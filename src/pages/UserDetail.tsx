import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Building2, 
  Activity,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditableField } from '@/components/ui/EditableField';
import { MockDataIcon } from '@/components/ui/MockDataIcon';
import { useUserDetails } from '@/hooks/useUserDetails';
import { useAllModules } from '@/hooks/useAllModules';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useMockData } from '@/hooks/useMockData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RoleCard } from '@/components/user/RoleCard';
import { PermissionCard } from '@/components/user/PermissionCard';
import { ActivityTable } from '@/components/user/ActivityTable';
import { UserManagementForm } from '@/components/user/UserManagementForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Hook para gerenciar dados mock vs reais
  const { shouldShowMockIndicator } = useMockData();
  const { toast } = useToast();

  // Hooks para dados do usuário
  const { userDetails, userProjectAccess, loading: userLoading, updateProjectAccess } = useUserDetails(id);
  const { modules, loading: modulesLoading } = useAllModules();
  const { 
    userRoles: roles, 
    availableRoles, 
    loading: rolesLoading,
    fetchUserRoles 
  } = useUserRoles(id || '');
  const { 
    userPermissions, 
    rolePermissions, 
    allPermissions, 
    loading: permissionsLoading,
    fetchUserDirectPermissions,
    fetchUserRolePermissions
  } = useUserPermissions(id || '');
  const { 
    activities, 
    sessions, 
    securityLogs, 
    usagePatterns, 
    activitySummary,
    loading: activityLoading
  } = useUserActivity(id || '');

  const [updatingAccess, setUpdatingAccess] = useState<string | null>(null);

  // Early return if no user ID is provided
  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">ID do usuário não fornecido</h2>
          <p className="text-muted-foreground">É necessário fornecer um ID válido para visualizar os detalhes do usuário.</p>
        </div>
        <Button onClick={() => navigate('/users')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Usuários
        </Button>
      </div>
    );
  }

  if (userLoading || modulesLoading || rolesLoading || permissionsLoading || activityLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">Usuário não encontrado</h2>
          <p className="text-muted-foreground">O usuário solicitado não existe ou foi removido.</p>
        </div>
        <Button onClick={() => navigate('/users')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Usuários
        </Button>
      </div>
    );
  }

  const handleRoleSubmit = async (data: any) => {
    // Implementar lógica para adicionar role
    console.log('Adicionar role:', data);
    setShowRoleForm(false);
    fetchUserRoles();
  };

  const handlePermissionSubmit = async (data: any) => {
    // Implementar lógica para adicionar permissão
    console.log('Adicionar permissão:', data);
    setShowPermissionForm(false);
    fetchUserDirectPermissions();
  };

  const handleProjectSubmit = async (data: any) => {
    // Implementar lógica para adicionar projeto
    console.log('Adicionar projeto:', data);
    setShowProjectForm(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'ativo':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
      case 'inativo':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'ativo':
        return 'default';
      case 'inactive':
      case 'inativo':
        return 'destructive';
      case 'pending':
      case 'pendente':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
            onClick={() => navigate('/users')}
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
            <h1 className="text-3xl font-bold">{userDetails.nome}</h1>
          <p className="text-muted-foreground">{userDetails.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(userDetails.status)}
          <Badge variant={getStatusVariant(userDetails.status) as any}>
            {userDetails.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="projects">Módulos</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditableField
              label="Email"
              value={userDetails.email}
              isMock={false}
              type="email"
              onSave={async (newEmail) => {
                try {
                  const { error } = await supabase
                    .from('rbac_auth_profile')
                    .update({ email: newEmail })
                    .eq('user_id', id);
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Sucesso",
                    description: "Email atualizado com sucesso",
                  });
                  
                  return true;
                } catch (error: any) {
                  toast({
                    title: "Erro",
                    description: error.message || "Erro ao atualizar email",
                    variant: "destructive",
                  });
                  return false;
                }
              }}
            />
            <EditableField
              label="Nome"
              value={userDetails.nome}
              isMock={false}
              onSave={async (newName) => {
                try {
                  const { error } = await supabase
                    .from('rbac_auth_profile')
                    .update({ nome: newName })
                    .eq('user_id', id);
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Sucesso",
                    description: "Nome atualizado com sucesso",
                  });
                  
                  return true;
                } catch (error: any) {
                  toast({
                    title: "Erro",
                    description: error.message || "Erro ao atualizar nome",
                    variant: "destructive",
                  });
                  return false;
                }
              }}
            />
            <EditableField
              label="Data de Criação"
              value={userDetails.created_at}
              isMock={false}
              type="date"
              disabled={true}
            />
            {userDetails.ultimo_login && (
              <EditableField
                label="Último Login"
                value={userDetails.ultimo_login}
                isMock={false}
                type="date"
                disabled={true}
              />
            )}
          </CardContent>
        </Card>

            {/* Resumo de Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
                  Roles Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="space-y-2">
                  {roles.filter(role => role.ativo).length > 0 ? (
                    roles.filter(role => role.ativo).map(role => (
                      <div key={role.id} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.cor }}
                        />
                        <span className="text-sm font-medium">{role.nome}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum role ativo</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Atividades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitySummary ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total de atividades:</span>
                      <span className="text-sm font-medium">{activitySummary.total_activities}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Módulo mais usado:</span>
                      <span className="text-sm font-medium">{activitySummary.most_used_module}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Horário mais ativo:</span>
                      <span className="text-sm font-medium">{activitySummary.most_active_hour}</span>
                    </div>
              </div>
                ) : (
                  <p className="text-sm text-gray-500">Carregando...</p>
            )}
          </CardContent>
        </Card>
      </div>

          {/* Padrões de Uso */}
          {usagePatterns.length > 0 && (
      <Card>
        <CardHeader>
                <CardTitle>Padrões de Uso</CardTitle>
          <CardDescription>
                  Análise dos últimos 30 dias de atividade
          </CardDescription>
        </CardHeader>
        <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {usagePatterns.map(pattern => (
                    <div key={pattern.module} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="h-4 w-4" />
                        <span className="font-medium">{pattern.module}</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Acessos: {pattern.access_count}</div>
                        <div>Tempo total: {Math.round(pattern.total_time_spent)} min</div>
                        <div>Último acesso: {format(new Date(pattern.last_access), 'dd/MM/yyyy', { locale: ptBR })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Roles do Usuário</h2>
              <p className="text-muted-foreground">
                Gerencie os roles atribuídos a este usuário
              </p>
            </div>
            <Button onClick={() => setShowRoleForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Role
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                userId={id || ''}
                onRoleUpdate={fetchUserRoles}
              />
            ))}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Permissões do Usuário</h2>
              <p className="text-muted-foreground">
                Visualize e gerencie as permissões via roles e diretas
              </p>
            </div>
            <Button onClick={() => setShowPermissionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Permissão
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allPermissions.map(permission => {
              const userPermission = userPermissions.find(up => up.permission_id === permission.id);
              const rolePermission = rolePermissions.find(rp => rp.permission_id === permission.id);
              
              let source: 'role' | 'direct' | 'both';
              let roles: string[] = [];
              
              if (userPermission && rolePermission) {
                source = 'both';
                roles = [rolePermission.role_id];
              } else if (userPermission) {
                source = 'direct';
              } else if (rolePermission) {
                source = 'role';
                roles = [rolePermission.role_id];
              } else {
                source = 'role';
              }

              return (
                <PermissionCard
                  key={permission.id}
                  permission={permission}
                  userPermission={userPermission}
                  userId={id || ''}
                  onPermissionUpdate={() => {
                    fetchUserDirectPermissions();
                    fetchUserRolePermissions();
                  }}
                  source={source}
                  roles={roles}
                />
              );
            })}
                    </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Acesso a Módulos</h2>
              <p className="text-muted-foreground">
                Gerencie o acesso deste usuário aos módulos
              </p>
                    </div>
            <Button onClick={() => setShowProjectForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Módulo
            </Button>
                  </div>
                  
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map(module => {
              const access = userProjectAccess.find(upa => upa.project_id === module.id);
              return (
                <Card key={module.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {module.nome}
                    </CardTitle>
                    <CardDescription>{module.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Acesso:</span>
                        <Switch
                          checked={!!access}
                          onCheckedChange={async (checked) => {
                            setUpdatingAccess(module.id);
                            try {
                              await updateProjectAccess(module.id, checked);
                            } finally {
                              setUpdatingAccess(null);
                            }
                          }}
                          disabled={updatingAccess === module.id}
                        />
                      </div>
                      {access && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Nível:</span>
                      <Select
                        value={access.access_level}
                              onValueChange={async (level) => {
                                setUpdatingAccess(module.id);
                                try {
                                  await updateProjectAccess(module.id, true, level);
                                } finally {
                                  setUpdatingAccess(null);
                                }
                              }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                                <SelectItem value="viewer">Visualizador</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                          </div>
                          <div className="text-sm text-gray-600">
                            Concedido em: {format(new Date(access.granted_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Atividades do Usuário</h2>
            <p className="text-muted-foreground">
              Histórico de atividades e sessões
                </p>
              </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sessões Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.filter(s => s.is_active).length > 0 ? (
                  <div className="space-y-2">
                    {sessions.filter(s => s.is_active).map(session => (
                      <div key={session.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{session.frontend_module || 'Sistema'}</div>
                            <div className="text-sm text-gray-600">
                              {session.ip_address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {session.ip_address}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="default">Ativa</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma sessão ativa</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logs de Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                {securityLogs.length > 0 ? (
                  <div className="space-y-2">
                    {securityLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{log.event_type}</div>
                            <div className="text-sm text-gray-600">{log.description}</div>
                          </div>
                          <Badge variant={log.severity === 'high' || log.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {log.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum log de segurança</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTable
                activities={activities}
                loading={activityLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Configurações do Usuário</h2>
            <p className="text-muted-foreground">
              Configurações avançadas e preferências
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Configurações de Segurança
                  {shouldShowMockIndicator(true) && <MockDataIcon />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">2FA Habilitado</span>
                  <Switch defaultChecked={false} disabled={true} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notificações de Login</span>
                  <Switch defaultChecked={true} disabled={true} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sessões Simultâneas</span>
                  <Switch defaultChecked={false} disabled={true} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Preferências
                  {shouldShowMockIndicator(true) && <MockDataIcon />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tema</span>
                  <Select defaultValue="system" disabled={true}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Idioma</span>
                  <Select defaultValue="pt-BR" disabled={true}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <UserManagementForm
        isOpen={showRoleForm}
        onClose={() => setShowRoleForm(false)}
        onSubmit={handleRoleSubmit}
        type="role"
        title="Adicionar Role"
        description="Selecione um role para adicionar ao usuário"
        availableOptions={availableRoles.map(role => ({
          id: role.id,
          name: role.nome,
          description: role.descricao || undefined,
          color: role.cor
        }))}
      />

      <UserManagementForm
        isOpen={showPermissionForm}
        onClose={() => setShowPermissionForm(false)}
        onSubmit={handlePermissionSubmit}
        type="permission"
        title="Adicionar Permissão"
        description="Selecione uma permissão para adicionar diretamente ao usuário"
        availableOptions={allPermissions.map(permission => ({
          id: permission.id,
          name: permission.nome,
          description: permission.descricao || undefined
        }))}
      />

      <UserManagementForm
        isOpen={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        onSubmit={handleProjectSubmit}
        type="project"
        title="Adicionar Módulo"
        description="Selecione um módulo para dar acesso ao usuário"
        availableOptions={modules.map(module => ({
          id: module.id,
          name: module.nome,
          description: module.descricao
        }))}
      />
    </div>
  );
};

export default UserDetail;