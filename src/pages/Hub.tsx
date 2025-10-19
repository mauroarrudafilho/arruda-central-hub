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
} from 'lucide-react';

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

const Hub = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const designTokens = useDesignTokens();
  const { isFavorite, toggleFavorite } = useUserPreferences();

  const { projects, loading: projectsLoading } = useProjects();
  const { currentProject, setCurrentProject, setProjects } = useProjectContext();
  const { modules, loading: modulesLoading } = useProjectModules(currentProject?.id ?? null);

  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('rbac_auth_profile')
        .select('ultimo_login')
        .eq('user_id', user.id)
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
  }, [user, normalizedModules]);

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

    // Verificar indicadores iniciais
    handleScroll();

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, filteredModules]);

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

  const favorites = filteredModules.filter((module) => isFavorite(module.id));
  const nonFavorites = filteredModules.filter((module) => !isFavorite(module.id));

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BackgroundGlow />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-6">
          <h2
            className="text-4xl font-bold text-gray-900 mb-2"
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

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)] md:items-center md:gap-6 mb-10">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar módulos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            />
          </div>

          {userStats && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div>
                Último acesso: {new Date(userStats.lastLogin).toLocaleString('pt-BR')}
              </div>
              <div>
                Sessão expira em: {new Date(userStats.sessionExpires).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          )}
        </div>

        {favorites.length > 0 && (
          <section className="mb-10">
            <h3
              className="text-2xl font-semibold text-gray-900 mb-6"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              Módulos Favoritos
            </h3>

            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {favorites.map((module) => (
                  <button
                    key={`favorite-${module.id}`}
                    className={`w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md text-left ${
                      module.isAvailable ? 'cursor-pointer hover:border-blue-300' : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => module.isAvailable && handleModuleAccess(module)}
                    disabled={!module.isAvailable}
                    aria-label={`Acessar módulo ${module.nome}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: designTokens.colors.primary[50] }}
                        >
                          <module.Icon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
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
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={isFavorite(module.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            type="button"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                isFavorite(module.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                              }`}
                            />
                          </button>
                        </div>
                        <p
                          className="text-sm text-gray-600 mb-3"
                          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                        >
                          {module.description}
                        </p>
                        <div className="flex items-center text-xs">
                          <span className={module.isAvailable ? 'text-green-600' : 'text-yellow-600'}>
                            {module.statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <section>
          <h3
            className="text-2xl font-semibold text-gray-900 mb-6"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Todos os módulos
          </h3>

          {filteredModules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              Nenhum módulo encontrado para o projeto selecionado.
            </div>
          ) : nonFavorites.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
              Todos os módulos deste projeto foram marcados como favoritos.
            </div>
          ) : (
            <div className="relative">
              {/* Indicador de scroll à esquerda */}
              {showLeftIndicator && (
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 flex items-center justify-start pointer-events-none">
                  <div className="ml-2 bg-white rounded-full shadow-lg p-2">
                    <ChevronLeft className="h-5 w-5 text-gray-600 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Indicador de scroll à direita */}
              {showRightIndicator && (
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 flex items-center justify-end pointer-events-none">
                  <div className="mr-2 bg-white rounded-full shadow-lg p-2">
                    <ChevronRight className="h-5 w-5 text-gray-600 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Container com scroll horizontal */}
              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto pb-4 hide-scrollbar"
                style={{
                  display: 'grid',
                  gridAutoFlow: 'column',
                  gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
                  gap: '1.5rem',
                  scrollBehavior: 'smooth',
                }}
              >
                {nonFavorites.map((module) => (
                  <button
                    key={module.id}
                    className={`w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md text-left ${
                      module.isAvailable ? 'cursor-pointer hover:border-blue-300' : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => module.isAvailable && handleModuleAccess(module)}
                    disabled={!module.isAvailable}
                    aria-label={`Acessar módulo ${module.nome}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: designTokens.colors.primary[50] }}
                        >
                          <module.Icon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
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
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={isFavorite(module.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            type="button"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                isFavorite(module.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                              }`}
                            />
                          </button>
                        </div>
                        <p
                          className="text-sm text-gray-600 mb-3"
                          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                        >
                          {module.description}
                        </p>
                        <div className="flex items-center text-xs">
                          <span className={module.isAvailable ? 'text-green-600' : 'text-yellow-600'}>
                            {module.statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Hub;
