import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Activity, 
  Users, 
  TrendingUp,
  Building2,
  Settings,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthWithTenant';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useProjectsWithTenant } from '@/hooks/useProjectsWithTenant';
import { useProjectContext } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { CardHubItem } from '@/components/hub/CardHubItem';
import TenantSelector from '@/components/TenantSelector';
import { DEFAULT_MODULE_DEFINITIONS, ProjectModule } from '@/hooks/useProjects';

type IconComponent = React.ComponentType<any>;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalProjects: number;
  activeProjects: number;
}

interface TenantModule
  extends Omit<
    ProjectModule,
    'ordem' | 'project_id'
  > {
  ordem?: number | null;
  project_id?: string | null;
  organizacao_id?: string | null;
}

interface NormalizedModule extends TenantModule {
  description: string;
  targetRoute: string | null;
  Icon: IconComponent;
  isAvailable: boolean;
  statusLabel: string;
}

const ICON_MAP: Record<string, IconComponent> = {
  Users,
  Shield,
  Activity,
  BarChart3,
  Building2,
  Settings,
  TrendingUp,
};

const resolveIcon = (iconName: string | null | undefined): IconComponent => {
  if (!iconName) return Activity;
  return ICON_MAP[iconName] || Activity;
};

const normalizeRoute = (route: string | null | undefined): string | null => {
  if (!route) return null;
  if (/^https?:\/\//i.test(route)) return route;
  return route.startsWith('/') ? route : `/${route}`;
};

const isModuleAvailable = (module: TenantModule): boolean => {
  const status = (module.status || '').toLowerCase();
  if (status === 'manutencao' || status === 'manutenção') return false;
  if (status === 'desenvolvimento' || status === 'planejado') return false;
  return module.ativo !== false;
};

const getStatusLabel = (module: TenantModule, available: boolean): string => {
  if (available) return 'Disponível';
  const status = (module.status || '').toLowerCase();
  if (status === 'manutencao' || status === 'manutenção') return 'Em manutenção';
  if (status === 'desenvolvimento') return 'Em desenvolvimento';
  if (status === 'planejado') return 'Planejado';
  return 'Indisponível';
};

const buildFallbackModules = (tenantId?: string | null): TenantModule[] => {
  return DEFAULT_MODULE_DEFINITIONS.map((definition, index) => ({
    ...definition,
    id: `fallback-${definition.slug}`,
    ordem: index,
    ativo: true,
    organizacao_id: tenantId ?? null,
  }));
};

const HubWithTenant = () => {
  const navigate = useNavigate();
  const { user, session, currentTenant } = useAuth();
  const { isFavorite, toggleFavorite } = useUserPreferences();

  const { projects, loading: projectsLoading } = useProjectsWithTenant();
  const { currentProject, setCurrentProject, setProjects } = useProjectContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [modules, setModules] = useState<TenantModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [modulesError, setModulesError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectsLoading) {
      setProjects(projects);
      if (!currentProject && projects.length > 0) {
        setCurrentProject(projects[0]);
      }
    }
  }, [projects, projectsLoading, currentProject, setProjects, setCurrentProject]);

  useEffect(() => {
    let isSubscribed = true;

    const loadModules = async () => {
      if (!currentTenant) {
        if (isSubscribed) {
          setModules([]);
          setModulesLoading(false);
        }
        return;
      }

      setModulesLoading(true);
      setModulesError(null);

      try {
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .eq('ativo', true)
          .eq('organizacao_id', currentTenant.id)
          .order('ordem', { ascending: true });

        if (error) throw error;

        if (!isSubscribed) return;

        const sanitized = (data ?? []).filter(Boolean) as TenantModule[];

        if (sanitized.length === 0) {
          setModules(buildFallbackModules(currentTenant.id));
        } else {
          setModules(sanitized);
        }
      } catch (err) {
        console.error('Error loading tenant modules:', err);
        if (!isSubscribed) return;

        setModulesError(err instanceof Error ? err.message : 'Erro ao carregar módulos do tenant');
        setModules(buildFallbackModules(currentTenant?.id));
      } finally {
        if (isSubscribed) {
          setModulesLoading(false);
        }
      }
    };

    loadModules();

    return () => {
      isSubscribed = false;
    };
  }, [currentTenant]);

  const normalizedModules: NormalizedModule[] = useMemo(() => {
    if (!modules) return [];

    return modules.map((module) => {
      const available = isModuleAvailable(module);
      const description = module.descricao || 'Módulo do sistema Arruda Hub';
      const targetRoute = normalizeRoute(module.url_externa ?? module.rota);

      return {
        ...module,
        description,
        targetRoute,
        Icon: resolveIcon(module.icone),
        isAvailable: available && !!targetRoute,
        statusLabel: getStatusLabel(module, available && !!targetRoute),
      };
    });
  }, [modules]);

  const filteredModules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return normalizedModules;

    return normalizedModules.filter((module) => {
      const haystack = [
        module.nome,
        module.slug,
        module.description,
        module.status,
        module.categoria,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [normalizedModules, searchTerm]);

  const loadUserStats = useCallback(async () => {
    if (!user || !currentTenant) return;

    try {
      const { data: stats, error } = await supabase.rpc('get_tenant_stats', {
        _tenant_id: currentTenant.id,
      });

      if (error) throw error;
      if (stats) {
        setUserStats(stats as UserStats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, [user, currentTenant]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  const handleModuleClick = useCallback(
    (module: NormalizedModule) => {
      if (!module.isAvailable || !module.targetRoute) {
        return;
      }

      const isExternal = /^https?:\/\//i.test(module.targetRoute);

      if (isExternal) {
        try {
          const url = new URL(module.targetRoute);
          if (session?.access_token) {
            url.searchParams.set('token', session.access_token);
          }
          if (currentTenant?.slug) {
            url.searchParams.set('tenant', currentTenant.slug);
          }
          window.open(url.toString(), '_blank', 'noopener,noreferrer');
        } catch {
          const separator = module.targetRoute.includes('?') ? '&' : '?';
          const tokenParam = session?.access_token
            ? `token=${encodeURIComponent(session.access_token)}`
            : '';
          const tenantParam = currentTenant?.slug
            ? `tenant=${encodeURIComponent(currentTenant.slug)}`
            : '';
          const query = [tokenParam, tenantParam].filter(Boolean).join('&');
          const url = `${module.targetRoute}${query ? `${separator}${query}` : ''}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } else {
        navigate(module.targetRoute);
      }
    },
    [session?.access_token, currentTenant?.slug, navigate]
  );

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum Tenant Selecionado</h3>
          <p className="text-muted-foreground mb-4">Selecione uma organização para continuar</p>
          <TenantSelector />
        </div>
      </div>
    );
  }

  if (modulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-muted border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando módulos do tenant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hub - {currentTenant.nome}
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao sistema de gestão da {currentTenant.nome}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <TenantSelector />
        </div>
      </div>

      {userStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{userStats.activeUsers} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">{userStats.activeProjects} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Usuários</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.newUsers}</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plano</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {currentTenant.plano || 'Básico'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentTenant.limite_usuarios || 100} usuários
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {modulesError && (
          <span className="text-sm text-destructive">
            {modulesError}
          </span>
        )}
      </div>

      <Tabs defaultValue="disponiveis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="disponiveis">Disponíveis</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
        </TabsList>

        <TabsContent value="disponiveis" className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredModules
              .filter((module) => module.isAvailable)
              .map((module) => (
                <CardHubItem
                  key={module.id}
                  title={module.nome}
                  description={module.description}
                  icon={module.Icon}
                  href={module.targetRoute ?? '#'}
                  external={module.targetRoute ? /^https?:\/\//i.test(module.targetRoute) : false}
                  badge={module.categoria ?? undefined}
                  status={module.statusLabel}
                  isFavorite={isFavorite(module.id)}
                  onToggleFavorite={() => toggleFavorite(module.id)}
                  onClick={() => handleModuleClick(module)}
                  disabled={!module.isAvailable}
                />
              ))}
          </div>
          {filteredModules.filter((module) => module.isAvailable).length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                Nenhum módulo disponível para o tenant selecionado.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="todos" className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((module) => (
              <CardHubItem
                key={module.id}
                title={module.nome}
                description={module.description}
                icon={module.Icon}
                href={module.targetRoute ?? '#'}
                external={module.targetRoute ? /^https?:\/\//i.test(module.targetRoute) : false}
                badge={module.categoria ?? undefined}
                status={module.statusLabel}
                isFavorite={isFavorite(module.id)}
                onToggleFavorite={() => toggleFavorite(module.id)}
                onClick={() => handleModuleClick(module)}
                disabled={!module.isAvailable}
              />
            ))}
          </div>
          {filteredModules.length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                Nenhum módulo encontrado para o termo pesquisado.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favoritos" className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredModules
              .filter((module) => isFavorite(module.id))
              .map((module) => (
                <CardHubItem
                  key={module.id}
                  title={module.nome}
                  description={module.description}
                  icon={module.Icon}
                  href={module.targetRoute ?? '#'}
                  external={module.targetRoute ? /^https?:\/\//i.test(module.targetRoute) : false}
                  badge={module.categoria ?? undefined}
                  status={module.statusLabel}
                  isFavorite={isFavorite(module.id)}
                  onToggleFavorite={() => toggleFavorite(module.id)}
                  onClick={() => handleModuleClick(module)}
                  disabled={!module.isAvailable}
                />
              ))}
          </div>
          {filteredModules.filter((module) => isFavorite(module.id)).length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                Ainda não há módulos favoritados.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Informações da Organização</span>
          </CardTitle>
          {currentTenant.descricao && (
            <CardDescription>{currentTenant.descricao}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium">Nome</h4>
              <p className="text-sm text-muted-foreground">{currentTenant.nome}</p>
            </div>
            <div>
              <h4 className="font-medium">Slug</h4>
              <p className="text-sm text-muted-foreground">{currentTenant.slug}</p>
            </div>
            <div>
              <h4 className="font-medium">Plano</h4>
              <Badge variant="outline" className="capitalize">
                {currentTenant.plano || 'Básico'}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium">Limite de Usuários</h4>
              <p className="text-sm text-muted-foreground">
                {currentTenant.limite_usuarios || 100} usuários
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubWithTenant;









