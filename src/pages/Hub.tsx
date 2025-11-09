import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useProjects, useProjectModules, ProjectModule } from '@/hooks/useProjects';
import { useProjectContext } from '@/contexts/ProjectContext';
import { BackgroundGlow } from '@/components/BackgroundGlow';
import { logModuleAccess } from '@/services/persistenceService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Building2,
  BarChart3,
  DollarSign,
  Truck,
  Gift,
  Activity,
  Star,
  Search,
  Calculator,
  TrendingUp,
  FileText,
  Target,
  GraduationCap,
  Package,
  Users,
  Shield,
  Lock,
  Key,
  Settings,
  Globe,
  ChevronRight,
  ChevronLeft,
  Clock3,
  BarChart2,
  UserCheck,
  Menu,
} from 'lucide-react';
import { fetchModuleUsageStats, ModuleUsageStats } from '@/services/metricsService';

type IconComponent = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, IconComponent> = {
  Users,
  Building2,
  DollarSign,
  Activity,
  Truck,
  Gift,
  Calculator,
  TrendingUp,
  BarChart3,
  FileText,
  Target,
  GraduationCap,
  Package,
  Shield,
  Lock,
  Key,
  Settings,
  Globe,
};

interface NormalizedModule extends ProjectModule {
  description: string;
  targetRoute: string | null;
  Icon: IconComponent;
  isAvailable: boolean;
  statusLabel: string;
  accessCount: number;
  uniqueUsers: number;
  lastAccess?: string;
  successRate?: number;
  userAccessCount: number;
  userLastAccess?: string;
  isFavoriteModule: boolean;
}

interface UserStats {
  totalModules: number;
  lastLogin: string;
  sessionExpires: string;
}

const resolveIcon = (iconName: string | null): IconComponent => {
  if (!iconName) return Package;

  const directMatch = ICON_MAP[iconName];
  if (directMatch) return directMatch;

  const cleaned = iconName
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());

  return ICON_MAP[cleaned] || Package;
};

const normalizeRoute = (route: string | null | undefined): string | null => {
  if (!route) return null;
  if (/^https?:\/\//i.test(route)) return route;
  if (route.startsWith('/')) return route;
  return `/${route}`;
};

const isModuleAvailable = (module: ProjectModule) => {
  const status = (module.status || '').toLowerCase();
  if (status === 'manutencao' || status === 'inativo') return false;
  if (status === 'desenvolvimento' || status === 'planejado') return false;
  return module.ativo !== false;
};

const getStatusLabel = (module: ProjectModule, available: boolean) => {
  if (available) return 'Disponível';
  const status = (module.status || '').toLowerCase();
  if (status === 'manutencao') return 'Em manutenção';
  if (status === 'desenvolvimento') return 'Em desenvolvimento';
  if (status === 'planejado') return 'Planejado';
  return 'Indisponível';
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'Nunca acessado';

  try {
    return new Date(dateString).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return 'Nunca acessado';
  }
};

const Hub = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const designTokens = useDesignTokens();
  const { isFavorite, toggleFavorite } = useUserPreferences();
  const userId = user?.id ?? null;

  const { projects, loading: projectsLoading } = useProjects();
  const { currentProject, setCurrentProject, setProjects } = useProjectContext();
  const { modules, loading: modulesLoading } = useProjectModules(currentProject?.id ?? null);

  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [moduleUsageStats, setModuleUsageStats] = useState<ModuleUsageStats[]>([]);
  const [moduleUsageLoading, setModuleUsageLoading] = useState(false);
  const [userModuleInsights, setUserModuleInsights] = useState<Record<string, { count: number; lastAccess?: string }>>({});
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(true);

  const loadModuleUsageStats = useCallback(async () => {
    try {
      setModuleUsageLoading(true);
      const stats = await fetchModuleUsageStats();
      setModuleUsageStats(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de módulos:', error);
    } finally {
      setModuleUsageLoading(false);
    }
  }, []);

  const loadUserModuleInsights = useCallback(async () => {
    if (!userId) {
      setUserModuleInsights({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('resource_access_log')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .eq('resource_type', 'module_access')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const insights = (data || []).reduce<Record<string, { count: number; lastAccess?: string }>>((acc, item) => {
        const metadata = (item as any)?.metadata as { module_name?: string } | null;
        const moduleName = metadata?.module_name;

        if (!moduleName) {
          return acc;
        }

        const current = acc[moduleName] ?? { count: 0, lastAccess: undefined };
        const updatedCount = current.count + 1;
        const currentLastAccess = current.lastAccess;
        const shouldReplaceLastAccess =
          !currentLastAccess || new Date(item.created_at) > new Date(currentLastAccess);

        acc[moduleName] = {
          count: updatedCount,
          lastAccess: shouldReplaceLastAccess ? item.created_at : currentLastAccess,
        };

        return acc;
      }, {});

      setUserModuleInsights(insights);
    } catch (error) {
      console.error('Erro ao buscar insights do usuário para módulos:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadModuleUsageStats();
  }, [loadModuleUsageStats]);

  useEffect(() => {
    loadUserModuleInsights();
  }, [loadUserModuleInsights]);

  const moduleUsageStatsMap = useMemo(() => {
    return moduleUsageStats.reduce<Record<string, ModuleUsageStats>>((acc, stat) => {
      if (stat.moduleName) {
        acc[stat.moduleName] = stat;
      }
      if (stat.displayName) {
        acc[stat.displayName] = stat;
      }
      if (stat.moduleId) {
        acc[stat.moduleId] = stat;
      }
      return acc;
    }, {});
  }, [moduleUsageStats]);

  useEffect(() => {
    if (!projectsLoading) {
      setProjects(projects);
      if (!currentProject && projects.length > 0) {
        setCurrentProject(projects[0]);
      }
    }
  }, [projects, projectsLoading, currentProject, setProjects, setCurrentProject]);

  const normalizedModules: NormalizedModule[] = useMemo(() => {
    return modules.map((module) => {
      const available = isModuleAvailable(module);
      const description = module.descricao || 'Módulo do sistema Arruda Hub';
      const targetRoute = normalizeRoute(module.url_externa ?? module.rota);
      const usageStats =
        moduleUsageStatsMap[module.slug] ??
        moduleUsageStatsMap[module.nome] ??
        moduleUsageStatsMap[module.id];
      const userInsight =
        userModuleInsights[module.slug] ??
        userModuleInsights[module.nome] ??
        userModuleInsights[module.id];

      return {
        ...module,
        description,
        targetRoute,
        Icon: resolveIcon(module.icone),
        isAvailable: available && !!targetRoute,
        statusLabel: getStatusLabel(module, available && !!targetRoute),
        accessCount: usageStats?.accessCount ?? 0,
        uniqueUsers: usageStats?.uniqueUsers ?? 0,
        lastAccess: usageStats?.lastAccess,
        successRate: usageStats?.successRate,
        userAccessCount: userInsight?.count ?? 0,
        userLastAccess: userInsight?.lastAccess,
        isFavoriteModule: isFavorite(module.id),
      };
    });
  }, [modules, moduleUsageStatsMap, userModuleInsights, isFavorite]);

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

  const favorites = useMemo(
    () => filteredModules.filter((module) => module.isFavoriteModule),
    [filteredModules]
  );

  const sortedModules = useMemo(() => {
    return [...filteredModules].sort((a, b) => {
      if (a.isFavoriteModule === b.isFavoriteModule) {
        return a.nome.localeCompare(b.nome, 'pt-BR');
      }
      return a.isFavoriteModule ? -1 : 1;
    });
  }, [filteredModules]);

  const loadUserStats = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: profile } = await supabase
        .from('rbac_auth_profile')
        .select('ultimo_login')
        .eq('user_id', userId)
        .single();

      const availableModules = normalizedModules.filter((module) => module.isAvailable).length;

      setUserStats({
        totalModules: availableModules,
        lastLogin: profile?.ultimo_login || new Date().toISOString(),
        sessionExpires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [userId, normalizedModules]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    setShowLeftIndicator(scrollLeft > 20);
    setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Função para calcular indicadores com múltiplas tentativas
    const updateIndicators = () => {
      if (!container) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth;
      
      setShowLeftIndicator(hasHorizontalScroll && scrollLeft > 20);
      setShowRightIndicator(hasHorizontalScroll && scrollLeft < scrollWidth - clientWidth - 20);
    };

    // Aguardar múltiplos frames e um pequeno delay para garantir que o DOM foi totalmente renderizado
    let timeoutId: NodeJS.Timeout | null = null;
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => {
        // Pequeno delay adicional para garantir que o layout foi calculado
        timeoutId = setTimeout(() => {
          updateIndicators();
        }, 100);
      });
    });

    container.addEventListener('scroll', handleScroll);
    
    // Usar ResizeObserver para detectar mudanças no tamanho do container
    const resizeObserver = new ResizeObserver(() => {
      updateIndicators();
    });
    resizeObserver.observe(container);

    // Também atualizar quando a janela redimensionar
    window.addEventListener('resize', updateIndicators);

    return () => {
      cancelAnimationFrame(frame1);
      if (timeoutId) clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateIndicators);
    };
  }, [handleScroll, sortedModules.length]);

  const handleModuleAccess = async (module: NormalizedModule) => {
    if (!module.isAvailable || !module.targetRoute) {
      toast({
        title: 'Módulo indisponível',
        description: `${module.nome} ainda não está disponível para acesso.`,
        variant: 'default',
      });
      return;
    }

    const isExternal = /^https?:\/\//i.test(module.targetRoute);

    toast({
      title: 'Redirecionando',
      description: `Acessando ${module.nome}...`,
    });

    if (user) {
      try {
        await logModuleAccess(user.id, module.id, module.slug, 'access', {
          targetRoute: module.targetRoute,
          project_id: currentProject?.id ?? null,
        });
      } catch (err) {
        console.warn('Falha ao registrar acesso ao módulo', err);
      }
    }

    if (isExternal) {
      window.open(module.targetRoute, '_blank', 'noopener,noreferrer');
    } else {
      navigate(module.targetRoute);
    }
  };

  const isLoading = projectsLoading || modulesLoading;

  const renderUsageMetrics = (module: NormalizedModule, options?: { compact?: boolean }) => {
    const compact = options?.compact ?? false;

    const iconClass = compact ? 'h-3 w-3 text-blue-500' : 'h-3.5 w-3.5 text-blue-500';
    const containerClass = compact
      ? 'mt-2 flex flex-col gap-1 text-[11px] text-gray-500'
      : 'mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500';
    const successRateText =
      module.successRate !== undefined && module.successRate !== null
        ? ` · ${Math.round(module.successRate)}% sucesso`
        : '';
    const totalUsageText = `${module.accessCount} acessos totais · ${module.uniqueUsers} usuários${successRateText}`;

    return (
      <div className={containerClass}>
        <div className="flex items-center gap-2">
          <Activity className={iconClass} />
          <span>{module.userAccessCount > 0 ? `${module.userAccessCount} acessos seus` : 'Nenhum acesso seu ainda'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className={iconClass} />
          <span>{formatDateTime(module.userLastAccess)}</span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart2 className={iconClass} />
          <span>{totalUsageText}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Carregando módulos e projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative w-full">
      <BackgroundGlow />

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch w-full max-w-full">
          <div className="order-1 flex-1 min-w-0 lg:order-2 w-full">
            <div className="mb-6">
              <h2
                className="mb-2 text-4xl font-bold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Bem-vindo ao Arruda Hub
              </h2>
              <p
                className="text-lg text-gray-600 max-w-2xl"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Sua gestão de ponta a ponta começa aqui.
              </p>
            </div>

            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar módulos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                />
              </div>

              <div className="flex flex-1 flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
                {userStats && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-blue-500" />
                      <span>Último acesso: {formatDateTime(userStats.lastLogin)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span>Sessão expira em: {new Date(userStats.sessionExpires).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </>
                )}

                {moduleUsageLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <BarChart2 className="h-4 w-4 animate-pulse" />
                    <span>Atualizando métricas de uso...</span>
                  </div>
                ) : (
                  moduleUsageStats.length > 0 && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      <span>
                        Módulo mais acessado: {moduleUsageStats[0].displayName || moduleUsageStats[0].moduleName}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <section className="w-full">
              <h3
                className="mb-6 text-2xl font-semibold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Todos os módulos
              </h3>

              {filteredModules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
                  Nenhum módulo encontrado para o projeto selecionado.
                </div>
              ) : (
                <div className="relative w-full overflow-hidden">
                  {showLeftIndicator && (
                    <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-20 flex w-16 items-center justify-start bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent">
                      <div className="ml-2 rounded-full bg-white p-2 shadow-lg border border-gray-200">
                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                      </div>
                    </div>
                  )}

                  {showRightIndicator && (
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 flex w-16 items-center justify-end bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent">
                      <div className="mr-2 rounded-full bg-white p-2 shadow-lg border border-gray-200">
                        <ChevronRight className="h-5 w-5 text-gray-700" />
                      </div>
                    </div>
                  )}

                  <div 
                    ref={scrollContainerRef} 
                    className="overflow-x-auto pb-4 w-full"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridAutoFlow: 'column',
                        gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
                        gap: '1.5rem',
                        width: 'max-content',
                        minWidth: 'max-content',
                      }}
                    >
                      {sortedModules.map((module) => (
                        <button
                          key={module.id}
                          className={`w-80 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:shadow-md ${
                            module.isAvailable ? 'cursor-pointer hover:border-blue-300' : 'cursor-not-allowed opacity-50'
                          }`}
                          onClick={() => module.isAvailable && handleModuleAccess(module)}
                          disabled={!module.isAvailable}
                          aria-label={`Acessar módulo ${module.nome}`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg"
                                style={{ backgroundColor: designTokens.colors.primary[50] }}
                              >
                                <module.Icon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <h3
                                  className="text-lg font-semibold text-gray-900"
                                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                                >
                                  {module.nome}
                                </h3>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(module.id);
                                  }}
                                  className="rounded-full p-1 transition-colors hover:bg-gray-100"
                                  aria-label={isFavorite(module.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                  type="button"
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      isFavorite(module.id)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-400 hover:text-yellow-400'
                                    }`}
                                  />
                                </button>
                              </div>
                              <p
                                className="mb-3 text-sm text-gray-600"
                                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                              >
                                {module.description}
                              </p>
                              <div className="flex items-center text-xs">
                                <span className={module.isAvailable ? 'text-green-600' : 'text-yellow-600'}>
                                  {module.statusLabel}
                                </span>
                              </div>
                              {renderUsageMetrics(module)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside
            className={cn(
              'order-2 w-full lg:order-1 lg:flex-none lg:transition-[width] lg:duration-200 lg:ease-in-out lg:self-stretch',
              isQuickAccessOpen ? 'lg:w-80' : 'lg:w-16'
            )}
          >
            <div className="lg:sticky lg:top-16 lg:h-full lg:min-h-[calc(100vh-4rem)]">
              <div
                className={cn(
                  'flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-[padding] duration-200',
                  !isQuickAccessOpen && 'lg:p-3 lg:items-center'
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-3',
                    isQuickAccessOpen ? 'justify-between' : 'justify-center'
                  )}
                >
                  <div className={cn('flex-1', !isQuickAccessOpen && 'lg:hidden')}>
                    <h3
                      className="text-xl font-semibold text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Atalhos rápidos
                    </h3>
                    {isQuickAccessOpen && (
                      <p className="mt-1 text-sm text-gray-500">Módulos favoritos em formato de acesso rápido.</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsQuickAccessOpen((prev) => !prev)}
                    aria-pressed={isQuickAccessOpen}
                  >
                    <Menu
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        !isQuickAccessOpen && 'rotate-180'
                      )}
                    />
                    <span className="sr-only">Alternar atalhos rápidos</span>
                  </Button>
                </div>

                {favorites.length > 0 ? (
                  <>
                    <div
                      className={cn(
                        'mt-4 hidden flex-col gap-2 lg:flex',
                        !isQuickAccessOpen && 'items-center'
                      )}
                    >
                      {favorites.map((module) => (
                        <button
                          key={`favorite-sidebar-${module.id}`}
                          className={cn(
                            'rounded-lg border border-gray-200 text-left transition-all duration-200',
                            module.isAvailable
                              ? 'hover:border-blue-300 hover:shadow-sm'
                              : 'cursor-not-allowed opacity-60',
                            isQuickAccessOpen
                              ? 'flex w-full items-center gap-3 p-3'
                              : 'flex w-12 flex-col items-center justify-center gap-1 p-2'
                          )}
                          onClick={() => module.isAvailable && handleModuleAccess(module)}
                          disabled={!module.isAvailable}
                          aria-label={`Acessar módulo favorito ${module.nome}`}
                          title={module.nome}
                          type="button"
                        >
                          <div
                            className={cn(
                              'flex flex-shrink-0 items-center justify-center rounded-md transition-all duration-200',
                              isQuickAccessOpen ? 'h-8 w-8' : 'h-10 w-10'
                            )}
                            style={{ backgroundColor: designTokens.colors.primary[50] }}
                          >
                            <module.Icon
                              className={cn(
                                'text-blue-600 transition-all duration-200',
                                isQuickAccessOpen ? 'h-4 w-4' : 'h-5 w-5'
                              )}
                            />
                          </div>
                          {isQuickAccessOpen ? (
                            <span
                              className="truncate text-sm font-medium text-gray-900"
                              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                            >
                              {module.nome}
                            </span>
                          ) : (
                            <span className="sr-only">{module.nome}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {isQuickAccessOpen && (
                      <div className="-mx-5 mt-4 lg:hidden">
                        <div className="flex gap-4 overflow-x-auto px-5 pb-2">
                          {favorites.map((module) => (
                            <button
                              key={`favorite-mobile-${module.id}`}
                              className={cn(
                                'flex w-60 flex-shrink-0 items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors duration-200',
                                module.isAvailable
                                  ? 'hover:border-blue-300 hover:shadow-md'
                                  : 'cursor-not-allowed opacity-60'
                              )}
                              onClick={() => module.isAvailable && handleModuleAccess(module)}
                              disabled={!module.isAvailable}
                              aria-label={`Acessar módulo favorito ${module.nome}`}
                              type="button"
                            >
                              <div
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: designTokens.colors.primary[50] }}
                              >
                                <module.Icon className="h-4 w-4 text-blue-600" />
                              </div>
                              <span
                                className="truncate text-sm font-medium text-gray-900"
                                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                              >
                                {module.nome}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    Selecione módulos favoritos para tê-los aqui como acesso rápido.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Hub;
