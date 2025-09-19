import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';

interface Role {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  nome: string;
  modulo: string;
  acao: string;
  descricao: string;
  granted?: boolean;
}

const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    try {
      setLoading(true);
      
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('auth_role')
        .select('*')
        .order('nome');

      if (rolesError) throw rolesError;

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('auth_permission')
        .select('*')
        .order('modulo, nome');

      if (permissionsError) throw permissionsError;

      // Fetch role-permission relationships
      const { data: rolePermissions, error: rpError } = await supabase
        .from('auth_role_permission')
        .select(`
          role_id,
          permission_id,
          concedida,
          auth_permission:permission_id (
            id,
            nome,
            modulo,
            acao,
            descricao
          )
        `);

      if (rpError) throw rpError;

      // Build roles with permissions
      const rolesWithPermissions = rolesData?.map(role => ({
        ...role,
        permissions: rolePermissions
          ?.filter(rp => rp.role_id === role.id)
          ?.map(rp => ({
            ...rp.auth_permission,
            granted: rp.concedida
          })) || []
      })) || [];

      setRoles(rolesWithPermissions);
      setPermissions(permissionsData || []);
    } catch (error) {
      console.error('Error fetching roles and permissions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar papéis e permissões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.modulo]) {
      acc[permission.modulo] = [];
    }
    acc[permission.modulo].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Papéis & Permissões</h1>
        <p className="text-muted-foreground">
          Visualize a matriz de permissões do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Papéis do Sistema</CardTitle>
            <CardDescription>
              {roles.length} papel(éis) configurado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{role.nome}</h3>
                  <Badge variant={role.ativo ? "default" : "secondary"}>
                    {role.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {role.descricao && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {role.descricao}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  {role.permissions.filter(p => p.granted).length} permissões concedidas
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permissions by Module */}
        <Card>
          <CardHeader>
            <CardTitle>Permissões por Módulo</CardTitle>
            <CardDescription>
              {permissions.length} permissão(ões) total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
              <div key={module} className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 capitalize">{module}</h3>
                <div className="space-y-1">
                  {modulePermissions.map((permission) => (
                    <div key={permission.id} className="text-sm text-muted-foreground">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded mr-2">
                        {permission.acao}
                      </span>
                      {permission.nome}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matrix de Permissões</CardTitle>
          <CardDescription>
            Visualização completa de permissões por papel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b font-semibold">
                    Permissão
                  </th>
                  {roles.map((role) => (
                    <th key={role.id} className="text-center p-3 border-b font-semibold min-w-24">
                      {role.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <>
                    <tr key={module}>
                      <td colSpan={roles.length + 1} className="p-3 bg-muted/30 font-semibold text-sm uppercase tracking-wide">
                        {module}
                      </td>
                    </tr>
                    {modulePermissions.map((permission) => (
                      <tr key={permission.id} className="hover:bg-muted/20">
                        <td className="p-3 border-b">
                          <div>
                            <div className="font-medium text-sm">{permission.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {permission.descricao}
                            </div>
                          </div>
                        </td>
                        {roles.map((role) => {
                          const rolePermission = role.permissions.find(p => p.id === permission.id);
                          const hasPermission = rolePermission?.granted;
                          
                          return (
                            <td key={`${role.id}-${permission.id}`} className="p-3 border-b text-center">
                              {hasPermission ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-300 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roles;