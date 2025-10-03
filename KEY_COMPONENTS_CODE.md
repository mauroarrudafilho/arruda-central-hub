# 🔑 Códigos Principais - RBAC Manager

## 📱 **Componentes Principais**

### **1. Dashboard Principal**
```typescript
// src/pages/Dashboard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useDashboardData } from '@/hooks/useDashboardData';
import { 
  Users, Shield, Activity, Clock, AlertTriangle, CheckCircle,
  ExternalLink, BarChart3, Eye, Database
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts';

const Dashboard = () => {
  const { stats, recentActivity, loading } = useDashboardData();
  const designTokens = useDesignTokens();

  const chartConfig = {
    users: { label: "Usuários", color: designTokens.chartColors.primary },
    sessions: { label: "Sessões", color: designTokens.chartColors.secondary },
    modules: { label: "Módulos", color: designTokens.chartColors.success },
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-semibold">Carregando Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-600">Visão geral do sistema de gestão de usuários e acessos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4" style={{ color: designTokens.iconColors.primary }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} ativos nas últimas 24h
            </p>
          </CardContent>
        </Card>
        {/* Mais cards... */}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" style={{ color: designTokens.iconColors.primary }} />
              <span>Crescimento de Usuários</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={designTokens.chartColors.primary}
                  fill={designTokens.chartColors.primary}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

### **2. Analytics Dashboard**
```typescript
// src/pages/Analytics.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { 
  TrendingUp, TrendingDown, Activity, Users, Eye, Clock,
  BarChart3, LineChart as LineChartIcon, ArrowRight, Zap, Target, Globe
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const { summary, moduleSummaries, trendData, loading, error } = useAnalyticsData();
  const designTokens = useDesignTokens();
  const navigate = useNavigate();

  const chartConfig = {
    accesses: { label: "Acessos", color: designTokens.chartColors.primary },
    users: { label: "Usuários", color: designTokens.chartColors.secondary },
    responseTime: { label: "Tempo (ms)", color: designTokens.chartColors.success },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600">Visão geral consolidada de uso e performance do sistema</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <Activity className="h-4 w-4" />
          <span>Atualizar Dados</span>
        </Button>
      </div>

      {/* KPIs Principais */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Acessos</CardTitle>
              <Eye className="h-4 w-4" style={{ color: designTokens.iconColors.primary }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAccesses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{summary.growthRate}%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
          {/* Mais KPIs... */}
        </div>
      )}

      {/* Links Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" style={{ color: designTokens.iconColors.warning }} />
            <span>Acesso Rápido</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => navigate('/analytics/modules')}
            >
              <div className="flex items-center space-x-2 w-full">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Acessos por Módulo</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <p className="text-sm text-gray-600 text-left">
                Análise detalhada de acessos e usuários por módulo
              </p>
            </Button>
            {/* Mais botões... */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### **3. Gestão de Usuários**
```typescript
// src/pages/Users.tsx
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
  status: 'ativo' | 'inativo' | 'pendente' | 'suspenso';
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
      const { data, error } = await supabase
        .from('auth_profile')
        .select(`
          id, nome, email, status, ultimo_login, created_at,
          auth_user_role(auth_role(nome))
        `);

      if (error) throw error;

      const formattedUsers: User[] = data.map(profile => ({
        id: profile.id,
        nome: profile.nome || 'N/A',
        email: profile.email,
        status: profile.status as 'ativo' | 'inativo' | 'pendente' | 'suspenso',
        ultimo_login: profile.ultimo_login,
        created_at: profile.created_at,
        roles: profile.auth_user_role.map((ur: any) => ur.auth_role?.nome).filter(Boolean) || [],
      }));
      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
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

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
          <p className="text-gray-600">Gerencie os usuários e seus acessos ao sistema.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Usuário
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Visualize e gerencie todos os usuários do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" className="ml-auto">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### **4. Design System Hook**
```typescript
// src/hooks/useDesignTokens.ts
import { tokens } from '../../design-system/tokens';

export const useDesignTokens = () => {
  const chartColors = {
    primary: tokens.colors.primary.DEFAULT,
    secondary: tokens.colors.secondary.DEFAULT,
    success: tokens.colors.success.DEFAULT,
    warning: tokens.colors.warning.DEFAULT,
    destructive: tokens.colors.destructive.DEFAULT,
    neutral: tokens.colors.neutral.DEFAULT,
  };

  const badgeColors = {
    success: { bg: tokens.colors.success[100], text: tokens.colors.success[800] },
    destructive: { bg: tokens.colors.destructive[100], text: tokens.colors.destructive[800] },
    info: { bg: tokens.colors.primary[100], text: tokens.colors.primary[800] },
    warning: { bg: tokens.colors.warning[100], text: tokens.colors.warning[800] },
    neutral: { bg: tokens.colors.neutral[100], text: tokens.colors.neutral[800] },
  };

  const iconColors = {
    primary: tokens.colors.primary.DEFAULT,
    secondary: tokens.colors.secondary.DEFAULT,
    success: tokens.colors.success.DEFAULT,
    warning: tokens.colors.warning.DEFAULT,
    destructive: tokens.colors.destructive.DEFAULT,
    neutral: tokens.colors.neutral.DEFAULT,
  };

  return {
    chartColors,
    badgeColors,
    iconColors,
  };
};
```

### **5. Sidebar Navigation**
```typescript
// src/components/RBACSidebar.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, BarChart3, Users, Shield, FileText, 
  Settings, Monitor, ChevronDown, ChevronRight,
  ExternalLink, LogOut
} from 'lucide-react';

const RBACSidebar = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['analytics']);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      children: [
        { name: 'Acessos por Módulo', href: '/analytics/modules' },
        { name: 'Uso de Telas', href: '/analytics/screens' },
        { name: 'Métricas de Performance', href: '/analytics/performance' },
      ],
    },
    {
      name: 'Usuários',
      href: '/users',
      icon: Users,
    },
    {
      name: 'Roles & Permissões',
      href: '/roles',
      icon: Shield,
    },
    {
      name: 'Auditoria',
      href: '/audit',
      icon: FileText,
    },
    {
      name: 'Módulos',
      href: '/modules',
      icon: Monitor,
    },
    {
      name: 'Sistema',
      href: '/settings',
      icon: Settings,
    },
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Link to="/hub" className="flex items-center space-x-2">
          <img src="/logoarrudahub_white" alt="Arruda Hub" className="h-8 w-8" />
          <span className="text-xl font-bold">RBAC Manager</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link to="/hub">
              <ExternalLink className="mr-2 h-4 w-4" />
              Hub Central
            </Link>
          </Button>
        </div>

        <nav className="mt-6 px-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.name.toLowerCase())}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </div>
                      {expandedItems.includes(item.name.toLowerCase()) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedItems.includes(item.name.toLowerCase()) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm transition-colors",
                              location.pathname === child.href
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <p className="text-sm font-medium">maurofilho@grupoarruda.com</p>
            <p className="text-xs text-gray-500">Admin RBAC Manager</p>
          </div>
          <Button variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎨 **Design Tokens**
```typescript
// design-system/tokens.ts
export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#003366', // Navy
      50: '#f0f4f8',
      100: '#d9e2ec',
      // ... mais variações
    },
    secondary: {
      DEFAULT: '#008080', // Teal
      50: '#f0fdfa',
      100: '#ccfbf1',
      // ... mais variações
    },
    success: {
      DEFAULT: '#22C55E',
      // ... variações
    },
    warning: {
      DEFAULT: '#FACC15',
      // ... variações
    },
    destructive: {
      DEFAULT: '#EF4444',
      // ... variações
    },
  },
  // ... mais tokens
};
```

---

## 🔐 **Autenticação Hook**
```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setIsLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('auth_user_role')
        .select('auth_role!inner(nome)')
        .eq('user_id', userId)
        .eq('auth_role.nome', 'admin')
        .single();

      setIsAdmin(!error && !!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  return {
    user,
    session,
    isAuthenticated: !!user,
    isAdmin,
    isLoading,
  };
};
```

---

**📦 Este pacote contém os códigos principais para análise do SuperDesign, incluindo:**
- Componentes de UI principais
- Hooks customizados
- Sistema de design
- Estrutura de navegação
- Autenticação e autorização
