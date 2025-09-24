import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Shield, Building2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserDetails } from '@/hooks/useUserDetails';
import { useProjects } from '@/hooks/useProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails, userRoles, userProjectAccess, loading, updateProjectAccess } = useUserDetails(id);
  const { projects } = useProjects();
  const [updatingAccess, setUpdatingAccess] = useState<string | null>(null);

  if (loading) {
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

  const handleAccessToggle = async (projectId: string, currentHasAccess: boolean, currentLevel: string) => {
    setUpdatingAccess(projectId);
    
    if (currentHasAccess) {
      // Remover acesso
      await updateProjectAccess(projectId, currentLevel as any, false);
    } else {
      // Conceder acesso como visualizador por padrão
      await updateProjectAccess(projectId, 'visualizador', true);
    }
    
    setUpdatingAccess(null);
  };

  const handleAccessLevelChange = async (projectId: string, newLevel: string) => {
    setUpdatingAccess(projectId);
    await updateProjectAccess(projectId, newLevel as any, true);
    setUpdatingAccess(null);
  };

  const getUserProjectAccess = (projectId: string) => {
    return userProjectAccess.find(access => access.project_id === projectId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => navigate('/users')} 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{userDetails.nome}</h1>
          <p className="text-muted-foreground">{userDetails.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{userDetails.email}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Criado em {new Date(userDetails.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Badge variant={userDetails.status === 'ativo' ? 'default' : 'destructive'}>
                {userDetails.status}
              </Badge>
            </div>

            {userDetails.ultimo_login && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Último login: {new Date(userDetails.ultimo_login).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Papéis do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Papéis do Sistema
            </CardTitle>
            <CardDescription>
              Papéis globais atribuídos ao usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum papel atribuído</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((role) => (
                  <Badge 
                    key={role.id} 
                    variant={role.ativo ? 'default' : 'secondary'}
                    style={{ backgroundColor: role.cor }}
                  >
                    {role.nome}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acesso a Projetos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Acesso a Projetos
          </CardTitle>
          <CardDescription>
            Gerencie o acesso do usuário aos projetos e defina níveis de permissão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => {
              const access = getUserProjectAccess(project.id);
              const hasAccess = !!access;
              const isUpdating = updatingAccess === project.id;

              return (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{project.nome}</h4>
                    {project.descricao && (
                      <p className="text-sm text-muted-foreground">{project.descricao}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {hasAccess && (
                      <Select
                        value={access.access_level}
                        onValueChange={(value) => handleAccessLevelChange(project.id, value)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="visualizador">Visualizador</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Switch
                      checked={hasAccess}
                      onCheckedChange={() => handleAccessToggle(project.id, hasAccess, access?.access_level || 'visualizador')}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              );
            })}
            
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum projeto disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetail;