import { useState, useEffect } from 'react';
import { Plus, Search, Download, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useDesignTokens } from '@/hooks/useDesignTokens';

interface User {
  id: string;
  nome: string;
  email: string;
  status: string;
  ultimo_login: string | null;
  created_at: string;
  roles: string[];
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const designTokens = useDesignTokens();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('rbac_auth_profile')
        .select(`
          id,
          user_id,
          nome,
          email,
          status,
          ultimo_login,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const usersWithRoles: User[] = [];
      
      for (const profile of profiles || []) {
        const { data: userRoles } = await supabase
          .from('rbac_auth_user_role')
          .select(`
            rbac_auth_role:role_id (
              nome
            )
          `)
          .eq('user_id', profile.user_id)
          .eq('ativo', true);

        const roles = userRoles?.map(ur => ur.rbac_auth_role?.nome).filter(Boolean) || [];

        usersWithRoles.push({
          id: profile.user_id,
          nome: profile.nome,
          email: profile.email,
          status: profile.status,
          ultimo_login: profile.ultimo_login,
          created_at: profile.created_at,
          roles,
        });
      }

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const handleExport = () => {
    const csvContent = [
      ['Nome', 'E-mail', 'Papéis', 'Status', 'Último Login', 'Criado em'],
      ...filteredUsers.map(user => [
        user.nome,
        user.email,
        user.roles.join(', '),
        user.status,
        user.ultimo_login ? new Date(user.ultimo_login).toLocaleDateString('pt-BR') : 'Nunca',
        new Date(user.created_at).toLocaleDateString('pt-BR'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, papéis e permissões do sistema
          </p>
        </div>
        <Button onClick={() => navigate('/users/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => navigate(`/users/${user.id}`)}>
                      <div>
                        <div className="font-medium">{user.nome}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className="hover:opacity-80"
                        style={{
                          backgroundColor: user.status === 'ativo' 
                            ? designTokens.badgeColors.success.bg 
                            : designTokens.badgeColors.destructive.bg,
                          color: user.status === 'ativo' 
                            ? designTokens.badgeColors.success.text 
                            : designTokens.badgeColors.destructive.text,
                        }}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge 
                            key={role} 
                            className="hover:opacity-80 text-xs"
                            style={{
                              backgroundColor: designTokens.badgeColors.info.bg,
                              color: designTokens.badgeColors.info.text,
                            }}
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.ultimo_login ? new Date(user.ultimo_login).toLocaleDateString('pt-BR') : 'Nunca'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/users/${user.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;