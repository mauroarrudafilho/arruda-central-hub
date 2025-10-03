import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Download, Filter, Search, Users, Shield, Activity } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchRolesAndPermissions();
    logAuditEvent('roles_page_view');
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

  const logAuditEvent = async (action: string, metadata?: any) => {
    try {
      await supabase.from('auth_audit').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        acao: action,
        modulo: 'rbac',
        dados_novos: metadata,
        nivel: 'info',
        ip_address: '0.0.0.0', // Will be captured by backend
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.log('Audit log error:', error); // Silent fail
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    logAuditEvent('roles_export', { format, timestamp: new Date().toISOString() });
    
    const exportData = {
      roles: roles.map(role => ({
        nome: role.nome,
        descricao: role.descricao,
        ativo: role.ativo,
        permissoes_concedidas: role.permissions.filter(p => p.granted).length,
        total_permissoes: role.permissions.length
      })),
      permissions: permissions.map(p => ({
        nome: p.nome,
        modulo: p.modulo,
        acao: p.acao,
        descricao: p.descricao
      })),
      matrix: roles.map(role => ({
        papel: role.nome,
        permissoes: role.permissions.reduce((acc, perm) => {
          acc[`${perm.modulo}.${perm.acao}`] = perm.granted ? 'SIM' : 'NÃO';
          return acc;
        }, {} as Record<string, string>)
      }))
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rbac_matrix_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      // CSV format for matrix
      const csvContent = [
        ['Permissão', ...roles.map(r => r.nome)].join(','),
        ...permissions.map(perm => [
          `${perm.modulo}.${perm.acao}`,
          ...roles.map(role => {
            const rolePermission = role.permissions.find(p => p.id === perm.id);
            return rolePermission?.granted ? 'SIM' : 'NÃO';
          })
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rbac_matrix_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }

    toast({
      title: "Export realizado",
      description: `Dados exportados em formato ${format.toUpperCase()}`,
    });
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.modulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'all' || permission.modulo === filterModule;
    return matchesSearch && matchesModule;
  });

  const filteredRoles = roles.filter(role => {
    if (filterRole === 'all') return true;
    if (filterRole === 'active') return role.ativo;
    if (filterRole === 'inactive') return !role.ativo;
    return true;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
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
      {/* Header com estatísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Papéis & Permissões
          </h1>
          <p className="text-muted-foreground flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {roles.length} papéis
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              {permissions.length} permissões
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Matrix RBAC ativa
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('json')}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Filtros avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros & Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar permissões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {Array.from(new Set(permissions.map(p => p.modulo))).map(module => (
                  <SelectItem key={module} value={module} className="capitalize">
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar papéis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="active">Apenas ativos</SelectItem>
                <SelectItem value="inactive">Apenas inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Papéis do Sistema</CardTitle>
            <CardDescription>
              {filteredRoles.length} de {roles.length} papel(éis) exibido(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredRoles.map((role) => (
              <div key={role.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{role.nome}</h3>
                  <Badge className={role.ativo ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
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
              {filteredPermissions.length} de {permissions.length} permissão(ões) exibida(s)
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
          <CardTitle>Matrix de Permissões RBAC</CardTitle>
          <CardDescription>
            Matrix interativa com {Object.keys(groupedPermissions).length} módulos • 
            {filteredPermissions.length} permissões • 
            {filteredRoles.length} papéis
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
                  {filteredRoles.map((role) => (
                    <th key={role.id} className="text-center p-3 border-b font-semibold min-w-24">
                      <div className="flex flex-col items-center gap-1">
                        <span>{role.nome}</span>
                        <Badge className={role.ativo ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs" : "bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs"}>
                          {role.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <>
                    <tr key={module}>
                      <td colSpan={filteredRoles.length + 1} className="p-3 bg-primary/5 font-semibold text-sm uppercase tracking-wide border-l-4 border-primary">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {module}
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 ml-auto">
                            {modulePermissions.length} permissões
                          </Badge>
                        </div>
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
                        {filteredRoles.map((role) => {
                          const rolePermission = role.permissions.find(p => p.id === permission.id);
                          const hasPermission = rolePermission?.granted;
                          
                          return (
                            <td key={`${role.id}-${permission.id}`} className="p-3 border-b text-center">
                              <div className="flex items-center justify-center">
                                {hasPermission ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="text-xs font-medium">SIM</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <XCircle className="h-5 w-5" />
                                    <span className="text-xs">NÃO</span>
                                  </div>
                                )}
                              </div>
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