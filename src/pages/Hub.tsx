import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useProjects, Project } from '@/hooks/useProjects';
import { useProjectDetailedStats } from '@/hooks/useProjectDetailedStats';
import { BackgroundGlow } from '@/components/BackgroundGlow';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Building2,
  BarChart3,
  DollarSign,
  FileText,
  Package,
  Users,
  Search,
  Star,
  ChevronRight,
  ChevronLeft,
  Clock3,
  BarChart2,
  UserCheck,
  Menu,
  Activity,
  LogOut,
} from 'lucide-react';
import { fetchModuleUsageStats, ModuleUsageStats } from '@/services/metricsService';

type IconComponent = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, IconComponent> = {
  Users,
  Building2,
  DollarSign,
  BarChart3,
  FileText,
  Package,
};

interface NormalizedProject extends Project {
  description: string;
  targetRoute: string | null;
  Icon: IconComponent;
  isAvailable: boolean;
  statusLabel: string;
  totalAccessCount: number;
  uniqueUsers: number;
  lastAccess?: string;
  successRate?: number;
  userAccessCount: number;
  userLastAccess?: string;
  isFavoriteProject: boolean;
}

interface UserStats {
  totalProjects: number;
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

const isProjectAvailable = (project: Project) => {
  return !!project.url_vercel;
};

const getStatusLabel = (project: Project, available: boolean) => {
  if (available) return 'Disponível';
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
  console.log('🔵 Hub component renderizado');
  const navigate = useNavigate();
  const { user, signOut } = useAuthState();
  const designTokens = useDesignTokens();
  const { isFavoriteProject, toggleFavoriteProject } = useUserPreferences();
  const userId = user?.id ?? null;

  const { projects, loading: projectsLoading } = useProjects();
  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);
  const { getProjectStats, loading: statsLoading } = useProjectDetailedStats(projectIds);
  
  console.log('🔵 Hub - user:', user?.id, 'projects count:', projects?.length);

  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [moduleUsageStats, setModuleUsageStats] = useState<ModuleUsageStats[]>([]);
  const [moduleUsageLoading, setModuleUsageLoading] = useState(false);
  const [userProjectInsights, setUserProjectInsights] = useState<Record<string, { count: number; lastAccess?: string }>>({});
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(true);

  const loadModuleUsageStats = useCallback(async () => {
    try {
      setModuleUsageLoading(true);
      const stats = await fetchModuleUsageStats();
      setModuleUsageStats(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de projetos:', error);
    } finally {
      setModuleUsageLoading(false);
    }
  }, []);

  const loadUserProjectInsights = useCallback(async () => {
    if (!userId) {
      setUserProjectInsights({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('resource_access_log')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .eq('resource_type', 'project_access')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const insights = (data || []).reduce<Record<string, { count: number; lastAccess?: string }>>((acc, item) => {
        const metadata = (item as any)?.metadata as { project_name?: string; project_id?: string } | null;
        const projectId = metadata?.project_id;

        if (!projectId) {
          return acc;
        }

        const current = acc[projectId] ?? { count: 0, lastAccess: undefined };
        const updatedCount = current.count + 1;
        const currentLastAccess = current.lastAccess;
        const shouldReplaceLastAccess =
          !currentLastAccess || new Date(item.created_at) > new Date(currentLastAccess);

        acc[projectId] = {
          count: updatedCount,
          lastAccess: shouldReplaceLastAccess ? item.created_at : currentLastAccess,
        };

        return acc;
      }, {});

      setUserProjectInsights(insights);
    } catch (error) {
      console.error('Erro ao buscar insights do usuário para projetos:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadModuleUsageStats();
  }, [loadModuleUsageStats]);

  useEffect(() => {
    loadUserProjectInsights();
  }, [loadUserProjectInsights]);

  const normalizedProjects: NormalizedProject[] = useMemo(() => {
    return projects.map((project) => {
      const available = isProjectAvailable(project);
      const description = project.descricao || 'Projeto do sistema Arruda Hub';
      const targetRoute = normalizeRoute(project.url_vercel);

      const stats = getProjectStats(project.id);
      const userInsight = userProjectInsights[project.id];

      return {
        ...project,
        description,
        targetRoute,
        Icon: resolveIcon(project.icone),
        isAvailable: available && !!targetRoute,
        statusLabel: getStatusLabel(project, available && !!targetRoute),
        totalAccessCount: stats?.totalAccessCount ?? 0,
        uniqueUsers: stats?.uniqueUsers ?? 0,
        lastAccess: stats?.lastAccess,
        successRate: stats?.successRate,
        userAccessCount: stats?.userAccessCount ?? userInsight?.count ?? 0,
        userLastAccess: stats?.lastUserAccess ?? userInsight?.lastAccess,
        isFavoriteProject: isFavoriteProject(project.id),
      };
    });
  }, [projects, getProjectStats, userProjectInsights, isFavoriteProject]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return normalizedProjects;

    return normalizedProjects.filter((project) => {
      const haystack = [
        project.nome,
        project.slug,
        project.description,
        project.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [normalizedProjects, searchTerm]);

  const favorites = useMemo(
    () => filteredProjects.filter((project) => project.isFavoriteProject),
    [filteredProjects]
  );

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (a.isFavoriteProject === b.isFavoriteProject) {
        return a.nome.localeCompare(b.nome, 'pt-BR');
      }
      return a.isFavoriteProject ? -1 : 1;
    });
  }, [filteredProjects]);

  const loadUserStats = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: profile } = await supabase
        .from('rbac_auth_profile')
        .select('ultimo_login')
        .eq('user_id', userId)
        .single();

      const availableProjects = normalizedProjects.filter((project) => project.isAvailable).length;

      setUserStats({
        totalProjects: availableProjects,
        lastLogin: profile?.ultimo_login || new Date().toISOString(),
        sessionExpires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [userId, normalizedProjects]);

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

    const updateIndicators = () => {
      if (!container) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth;
      
      setShowLeftIndicator(hasHorizontalScroll && scrollLeft > 20);
      setShowRightIndicator(hasHorizontalScroll && scrollLeft < scrollWidth - clientWidth - 20);
    };

    let timeoutId: NodeJS.Timeout | null = null;
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
          updateIndicators();
        }, 100);
      });
    });

    container.addEventListener('scroll', handleScroll);
    
    const resizeObserver = new ResizeObserver(() => {
      updateIndicators();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateIndicators);

    return () => {
      cancelAnimationFrame(frame1);
      if (timeoutId) clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateIndicators);
    };
  }, [handleScroll, sortedProjects.length]);

  const handleProjectAccess = async (project: NormalizedProject) => {
    console.log('🚀 handleProjectAccess chamado!', {
      project: project.nome,
      isAvailable: project.isAvailable,
      targetRoute: project.targetRoute,
      hasUser: !!user,
    });

    if (!project.isAvailable || !project.targetRoute) {
      console.warn('⚠️ Projeto não disponível:', { isAvailable: project.isAvailable, targetRoute: project.targetRoute });
      toast({
        title: 'Projeto indisponível',
        description: `${project.nome} ainda não está disponível para acesso.`,
        variant: 'default',
      });
      return;
    }

    const isExternal = /^https?:\/\//i.test(project.targetRoute);
    console.log('🔵 Tipo de projeto:', { isExternal, targetRoute: project.targetRoute });

    toast({
      title: 'Redirecionando',
      description: `Acessando ${project.nome}...`,
    });

    if (isExternal) {
      console.log('🔵 Iniciando acesso a projeto externo:', {
        project: project.nome,
        route: project.targetRoute,
        hasUser: !!user,
        userId: user?.id,
      });

      // Adicionar token SSO na URL se disponível
      const url = new URL(project.targetRoute);
      let ssoToken: string | null = null;

      if (user) {
        console.log('🔵 Usuário encontrado, gerando token SSO...');
        try {
          // Gerar token SSO para módulo externo
          console.log('🔵 Chamando generate_sso_token com slug:', project.slug);
          const { data: tokenData, error: tokenError } = await supabase
            .rpc('generate_sso_token', {
              _project_slug: project.slug,
            });

          console.log('🔵 Resposta do generate_sso_token:', {
            hasData: !!tokenData,
            dataLength: tokenData?.length,
            error: tokenError,
          });

          if (!tokenError && tokenData && tokenData.length > 0) {
            ssoToken = tokenData[0].token;
            url.searchParams.set('sso_token', ssoToken);
            url.searchParams.set('from', 'arruda-hub');
            console.log('✅ Token SSO gerado e adicionado à URL:', {
              project: project.nome,
              url: url.toString(),
              hasToken: !!ssoToken,
              tokenLength: ssoToken?.length,
              expiresAt: tokenData[0].expires_at,
            });
            
            toast({
              title: 'Token SSO gerado',
              description: `Token válido por 12 horas. Redirecionando...`,
              duration: 2000,
            });
          } else {
            console.error('⚠️ Falha ao gerar token SSO:', {
              error: tokenError,
              errorMessage: tokenError?.message,
              errorCode: tokenError?.code,
              errorDetails: tokenError?.details,
              hasData: !!tokenData,
              dataLength: tokenData?.length,
            });
            
            toast({
              title: 'Aviso',
              description: 'Token SSO não pôde ser gerado. Você pode precisar fazer login no módulo.',
              variant: 'default',
              duration: 3000,
            });
          }
        } catch (tokenErr) {
          console.error('❌ Erro ao gerar token SSO:', tokenErr);
          // Continua mesmo sem token - o módulo pode pedir login
        }
      } else {
        console.warn('⚠️ Usuário não encontrado, não será gerado token SSO');
      }

      // Registrar acesso ao projeto
      if (user) {
        try {
          await supabase
            .from('resource_access_log')
            .insert({
              user_id: user.id,
              resource_type: 'project_access',
              resource_path: project.targetRoute,
              action: 'access',
              success: true,
              metadata: {
                project_id: project.id,
                project_slug: project.slug,
                project_name: project.nome,
                sso_token_generated: !!ssoToken, // Não armazenar o token em si por segurança
              },
            });
        } catch (err) {
          console.warn('Falha ao registrar acesso ao projeto', err);
        }
      }
      
      // Redirecionar diretamente para o módulo externo com token SSO na URL
      // O módulo externo deve validar o token usando validate_sso_token
      console.log('🔵 Abrindo URL com SSO:', url.toString());
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } else {
      if (user) {
        try {
          await supabase
            .from('resource_access_log')
            .insert({
              user_id: user.id,
              resource_type: 'project_access',
              resource_path: project.targetRoute,
              action: 'access',
              success: true,
              metadata: {
                project_id: project.id,
                project_slug: project.slug,
                project_name: project.nome,
              },
            });
        } catch (err) {
          console.warn('Falha ao registrar acesso ao projeto', err);
        }
      }
      navigate(project.targetRoute);
    }
  };

  const isLoading = projectsLoading || statsLoading;

  const renderUsageMetrics = (project: NormalizedProject, options?: { compact?: boolean }) => {
    const compact = options?.compact ?? false;

    const iconClass = compact ? 'h-3 w-3 text-blue-500' : 'h-3.5 w-3.5 text-blue-500';
    const containerClass = compact
      ? 'mt-2 flex flex-col gap-1 text-[11px] text-gray-500'
      : 'mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500';
    const successRateText =
      project.successRate !== undefined && project.successRate !== null
        ? ` · ${Math.round(project.successRate)}% sucesso`
        : '';
    const totalUsageText = `${project.totalAccessCount} acessos totais · ${project.uniqueUsers} usuários${successRateText}`;

    return (
      <div className={containerClass}>
        <div className="flex items-center gap-2">
          <Activity className={iconClass} />
          <span>{project.userAccessCount > 0 ? `${project.userAccessCount} acessos seus` : 'Nenhum acesso seu ainda'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className={iconClass} />
          <span>{formatDateTime(project.userLastAccess)}</span>
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
          <p className="text-sm text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  // Encontrar projeto mais acessado
  const mostAccessedProject = moduleUsageStats.length > 0 
    ? moduleUsageStats[0].displayName || moduleUsageStats[0].moduleName
    : sortedProjects.length > 0 && sortedProjects[0].userAccessCount > 0
    ? sortedProjects[0].nome
    : null;

  const handleLogout = async () => {
    try {
      // Limpar localStorage e sessionStorage ANTES de fazer signOut
      // Isso evita que dados persistidos sejam restaurados
      localStorage.removeItem('arruda_sso_user');
      localStorage.removeItem('arruda_sso_token');
      localStorage.removeItem('arruda_sso_expires');
      localStorage.clear();
      sessionStorage.clear();
      
      // Fazer logout no Supabase
      await signOut();
      
      // Aguardar um pouco para garantir que o estado seja limpo
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Limpar novamente após signOut para garantir
      localStorage.clear();
      sessionStorage.clear();
      
      // Forçar redirecionamento para login após logout
      // Usar window.location.replace para evitar que o usuário volte com o botão voltar
      window.location.replace('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, forçar redirecionamento para garantir que o usuário saia
      // Limpar localStorage e sessionStorage também
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative w-full">
      <BackgroundGlow />
      <Header 
        onLogout={handleLogout}
      />

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 pb-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch w-full max-w-full">
          <div className="order-1 flex-1 min-w-0 lg:order-2 w-full">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2
                  className="mb-1 text-4xl font-bold text-gray-900"
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
              {/* Avatar alinhado ao título */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={user?.email} />
                        <AvatarFallback className="text-sm font-medium bg-blue-600 text-white">
                          {user?.email ? user.email.split('@')[0].split('.').map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Administrador
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
                  mostAccessedProject && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      <span>Módulo mais acessado: {mostAccessedProject}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="lg:hidden">
              <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3
                      className="text-xl font-semibold text-gray-900"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Atalhos rápidos
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Módulos favoritos em formato de acesso rápido.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsQuickAccessOpen((prev) => !prev)}
                    aria-pressed={isQuickAccessOpen}
                    type="button"
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
                  isQuickAccessOpen && (
                    <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                      {favorites.map((project) => (
                        <button
                          key={`favorite-mobile-${project.id}`}
                          className={cn(
                            'flex w-56 flex-shrink-0 items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors duration-200',
                            project.isAvailable
                              ? 'hover:border-blue-300 hover:shadow-md'
                              : 'cursor-not-allowed opacity-60'
                          )}
                          onClick={() => project.isAvailable && handleProjectAccess(project)}
                          disabled={!project.isAvailable}
                          aria-label={`Acessar projeto favorito ${project.nome}`}
                          type="button"
                        >
                          <div
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: designTokens.colors.primary[50] }}
                          >
                            <project.Icon className="h-4 w-4 text-blue-600" />
                          </div>
                          <span
                            className="truncate text-sm font-medium text-gray-900"
                            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                          >
                            {project.nome}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    Selecione projetos favoritos para tê-los aqui como acesso rápido.
                  </div>
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

              {filteredProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
                  Nenhum projeto encontrado.
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
                      {sortedProjects.map((project) => (
                        <div
                          key={project.id}
                          className={`w-80 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:shadow-md ${
                            project.isAvailable ? 'cursor-pointer hover:border-blue-300' : 'cursor-not-allowed opacity-50'
                          }`}
                          onClick={async (e) => {
                            // Não executar se clicou no botão de favorito
                            if ((e.target as HTMLElement).closest('button[data-favorite-button]')) {
                              return;
                            }
                            
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Log imediato para debug
                            const logData = {
                              project: project.nome,
                              isAvailable: project.isAvailable,
                              targetRoute: project.targetRoute,
                              projectId: project.id,
                              timestamp: new Date().toISOString(),
                            };
                            
                            console.log('🖱️ Card clicado!', logData);
                            
                            if (project.isAvailable) {
                              console.log('✅ Projeto disponível, chamando handleProjectAccess...');
                              try {
                                await handleProjectAccess(project);
                              } catch (err) {
                                console.error('❌ Erro em handleProjectAccess:', err);
                                toast({
                                  title: 'Erro ao acessar projeto',
                                  description: err instanceof Error ? err.message : 'Erro desconhecido',
                                  variant: 'destructive',
                                });
                              }
                            } else {
                              console.warn('⚠️ Projeto não disponível, clique ignorado', {
                                isAvailable: project.isAvailable,
                                targetRoute: project.targetRoute,
                              });
                            }
                          }}
                          role={project.isAvailable ? 'button' : undefined}
                          tabIndex={project.isAvailable ? 0 : undefined}
                          aria-label={`Acessar projeto ${project.nome}`}
                          onKeyDown={(e) => {
                            if (project.isAvailable && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              handleProjectAccess(project);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg"
                                style={{ backgroundColor: designTokens.colors.primary[50] }}
                              >
                                <project.Icon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <h3
                                  className="text-lg font-semibold text-gray-900"
                                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                                >
                                  {project.nome}
                                </h3>
                                <button
                                  data-favorite-button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavoriteProject(project.id);
                                  }}
                                  className="rounded-full p-1 transition-colors hover:bg-gray-100 cursor-pointer"
                                  aria-label={isFavoriteProject(project.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                  type="button"
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      isFavoriteProject(project.id)
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
                                {project.description}
                              </p>
                              <div className="flex items-center text-xs">
                                <span className={project.isAvailable ? 'text-green-600' : 'text-yellow-600'}>
                                  {project.statusLabel}
                                </span>
                              </div>
                              {renderUsageMetrics(project)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside
            className={cn(
              'order-2 w-full hidden lg:order-1 lg:block lg:flex-none lg:transition-[width] lg:duration-200 lg:ease-in-out lg:self-stretch',
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
                      {favorites.map((project) => (
                        <button
                          key={`favorite-sidebar-${project.id}`}
                          className={cn(
                            'rounded-lg border border-gray-200 text-left transition-all duration-200',
                            project.isAvailable
                              ? 'hover:border-blue-300 hover:shadow-sm'
                              : 'cursor-not-allowed opacity-60',
                            isQuickAccessOpen
                              ? 'flex w-full items-center gap-3 p-3'
                              : 'flex w-12 flex-col items-center justify-center gap-1 p-2'
                          )}
                          onClick={() => project.isAvailable && handleProjectAccess(project)}
                          disabled={!project.isAvailable}
                          aria-label={`Acessar projeto favorito ${project.nome}`}
                          title={project.nome}
                          type="button"
                        >
                          <div
                            className={cn(
                              'flex flex-shrink-0 items-center justify-center rounded-md transition-all duration-200',
                              isQuickAccessOpen ? 'h-8 w-8' : 'h-10 w-10'
                            )}
                            style={{ backgroundColor: designTokens.colors.primary[50] }}
                          >
                            <project.Icon
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
                              {project.nome}
                            </span>
                          ) : (
                            <span className="sr-only">{project.nome}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    Selecione projetos favoritos para tê-los aqui como acesso rápido.
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
