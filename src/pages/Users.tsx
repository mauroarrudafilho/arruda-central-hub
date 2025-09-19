import { useState, useEffect } from 'react';
import { Plus, Search, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('auth_profile')
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
          .from('auth_user_role')
          .select(`
            auth_role:role_id (
              nome
            )
          `)
          .eq('user_id', profile.user_id)
          .eq('ativo', true);

        const roles = userRoles?.map(ur => ur.auth_role?.nome).filter(Boolean) || [];

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

  const columns = [
    {
      accessorKey: 'nome',
      header: 'Nome',
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
    },
    {
      accessorKey: 'roles',
      header: 'Papéis',
      cell: ({ row }: any) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.roles.map((role: string) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge 
          variant={row.original.status === 'ativo' ? 'default' : 'destructive'}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'ultimo_login',
      header: 'Último Login',
      cell: ({ row }: any) => {
        const date = row.original.ultimo_login;
        return date ? new Date(date).toLocaleDateString('pt-BR') : 'Nunca';
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString('pt-BR'),
    },
  ];

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
          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
            onRowClick={(user: User) => navigate(`/users/${user.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;