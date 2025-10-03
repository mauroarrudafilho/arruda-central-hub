import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { BackgroundGlow } from '@/components/BackgroundGlow';
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
  Users
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  display_name: string;
  description: string;
  url: string;
  icon: React.ComponentType<any>;
  hasAccess: boolean;
  lastAccess?: string;
}

interface UserStats {
  totalModules: number;
  lastLogin: string;
  sessionExpires: string;
}

const Hub = () => {
  const { user } = useAuthState();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const designTokens = useDesignTokens();
  const { isFavorite, toggleFavorite } = useUserPreferences();

  useEffect(() => {
    fetchUserModules();
    fetchUserStats();
  }, []);

  const fetchUserModules = async () => {
    try {
      setLoading(true);
      
              // Módulos definidos conforme briefing
              const predefinedModules = [
                { name: 'gestao-usuarios', display_name: 'Gestão de Usuários', icon: Users },
                { name: 'comercial-plus', display_name: 'Comercial+', icon: Building2 },
                { name: 'financeiro', display_name: 'Financeiro', icon: DollarSign },
                { name: 'always-on', display_name: 'Always On', icon: Activity },
                { name: 'logistica', display_name: 'Logística', icon: Truck },
                { name: 'trade-marketing', display_name: 'Trade Marketing', icon: BarChart3 },
                { name: 'reembolsos', display_name: 'Reembolsos', icon: Gift },
                { name: 'gestor-comissao', display_name: 'Gestor de Comissão', icon: Calculator },
                { name: 'gestor-pricing', display_name: 'Gestor de Pricing', icon: TrendingUp },
                { name: 'analytics', display_name: 'Analytics', icon: BarChart3 },
                { name: 'meus-documentos', display_name: 'Meus Documentos', icon: FileText },
                { name: 'flex-tracker', display_name: 'Flex Tracker', icon: Target },
                { name: 'lms', display_name: 'LMS', icon: GraduationCap },
                { name: 'meus-produtos', display_name: 'Meus Produtos', icon: Package },
                { name: 'cliente-360', display_name: 'Cliente 360º', icon: Users },
                { name: 'acordos-comerciais', display_name: 'Acordos Comerciais', icon: FileText }
              ];

      const { data: lastAccessData } = await supabase
        .from('user_sessions')
        .select('frontend_module, last_activity')
        .eq('user_id', user?.id)
        .order('last_activity', { ascending: false });

      const modulesWithAccess: Module[] = predefinedModules.map((module) => {
        const lastAccess = lastAccessData?.find(
          access => access.frontend_module === module.name
        );

        return {
          id: module.name,
          name: module.name,
          display_name: module.display_name,
          description: getModuleDescription(module.name),
          url: `/${module.name}`,
          icon: module.icon,
          hasAccess: checkModuleAccess(module.name),
          lastAccess: lastAccess?.last_activity,
        };
      });

      setModules(modulesWithAccess);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos disponíveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!user) return;

      const { data: profile } = await supabase
        .from('auth_profile')
        .select('ultimo_login')
        .eq('user_id', user.id)
        .single();

      const { data: currentSession } = await supabase
        .from('user_sessions')
        .select('expires_at')
        .eq('user_id', user.id)
        .eq('frontend_module', 'rbac')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setUserStats({
        totalModules: modules.filter(m => m.hasAccess).length,
        lastLogin: profile?.ultimo_login || new Date().toISOString(),
        sessionExpires: currentSession?.expires_at || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

          const checkModuleAccess = (moduleName: string): boolean => {
            // Módulos disponíveis (já implementados)
            const availableModules = [
              'gestao-usuarios',
              'trade-marketing',
              'acordos-comerciais',
              'meus-documentos'
            ];
            
            return availableModules.includes(moduleName);
          };


          const getModuleDescription = (moduleName: string) => {
            switch (moduleName) {
              case 'gestao-usuarios':
                return 'Controle de usuários, permissões e acesso ao sistema';
              case 'comercial-plus':
                return 'Gestão comercial avançada e vendas';
              case 'financeiro':
                return 'Controle financeiro e contabilidade';
              case 'always-on':
                return 'Monitoramento 24/7 do sistema';
              case 'logistica':
                return 'Controle logístico e distribuição';
              case 'trade-marketing':
                return 'Campanhas e promoções comerciais';
              case 'reembolsos':
                return 'Controle de reembolsos e devoluções';
      case 'gestor-comissao':
        return 'Motor de cálculo, repasse e extratos de comissão';
      case 'gestor-pricing':
        return 'Histórico de preços, lógica de tabela, promoções e rebaixas';
      case 'analytics':
        return 'Motor de performance, relatórios estilo Tableau, tela de insights';
      case 'meus-documentos':
        return 'Ingestão e parse de NF-e, CT-e, boletos';
      case 'flex-tracker':
        return 'Monitoramento de savings em negociações';
      case 'lms':
        return 'Treinamentos, trilhas, certificações';
      case 'meus-produtos':
        return 'Repositório central de informações de produtos';
      case 'cliente-360':
        return 'Visão unificada e detalhada do cliente';
      case 'acordos-comerciais':
        return 'Registro centralizado de investimentos e concessões';
      default:
        return 'Módulo do sistema Arruda Hub';
    }
  };

  const handleModuleAccess = async (module: Module) => {
    try {
      if (!module.hasAccess) {
        toast({
          title: "Módulo em Desenvolvimento",
          description: `${module.display_name} está sendo desenvolvido e será disponibilizado em breve.`,
          variant: "default",
        });
        return;
      }

              // Redirecionamentos para módulos disponíveis
              const moduleRoutes: Record<string, string> = {
                'gestao-usuarios': '/users', // Redireciona para gestão de usuários
                'trade-marketing': 'https://degusta-go.lovable.app/', // Redireciona para Trade Marketing
                'acordos-comerciais': 'https://acordo-flow.lovable.app/acordos', // Redireciona para Acordos Comerciais
                'meus-documentos': 'https://nfe-radar.lovable.app/auth' // Redireciona para Meus Documentos
              };

      const targetRoute = moduleRoutes[module.name];
      
      if (targetRoute) {
        // Log do acesso
        await supabase
          .from('resource_access_log')
          .insert({
            user_id: user?.id,
            resource_type: 'module_access',
            resource_path: `/hub/${module.name}`,
            action: 'access',
            success: true,
            metadata: {
              module_name: module.name,
              target_route: targetRoute
            }
          });

                toast({
                  title: "Redirecionando",
                  description: `Acessando ${module.display_name}...`,
                });

                // Verificar se é URL externa ou rota interna
                if (targetRoute.startsWith('http')) {
                  window.open(targetRoute, '_blank');
                } else {
                  navigate(targetRoute);
                }
      } else {
        toast({
          title: "Módulo não encontrado",
          description: "Rota não configurada para este módulo",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error accessing module:', error);
      toast({
        title: "Erro",
        description: "Erro ao acessar o módulo",
        variant: "destructive",
      });
    }
  };




  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

          // Filtrar módulos baseado no termo de busca
          const filteredModules = modules.filter(module => 
            module.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            module.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

  // Debug: Log para verificar se está chegando aqui
  console.log('Hub component rendering, modules:', modules.length, 'userStats:', userStats);

          return (
            <div className="min-h-screen bg-gray-50 relative">
              {/* Background Glow Component */}
              <BackgroundGlow />
              
              {/* Main Content */}
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                {/* Welcome Section */}
                <div className="text-left mb-8">
                  <h2 
                    className="text-4xl font-bold text-gray-900 mb-4"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Bem-vindo ao Arruda Hub
                  </h2>
                  <p 
                    className="text-lg text-gray-600 max-w-2xl mb-6"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Seu portal centralizado para acessar todos os módulos do sistema
                  </p>
                  
                  {/* Search Bar */}
                  <div className="max-w-lg">
                    <div className="relative">
                      <Search 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
                      />
                      <input
                        type="text"
                        placeholder="Buscar módulos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                      />
                    </div>
                  </div>
                </div>

                {/* KPI Cards removidos conforme solicitado */}

                {/* Favorites Section */}
                {filteredModules.some(module => isFavorite(module.id)) && (
                  <div className="mb-8">
                    <h3 
                      className="text-2xl font-semibold text-gray-900 mb-6"
                      style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                    >
                      Módulos Favoritos
                    </h3>
                    
                    {/* Favorites Grid - 1 linha horizontal com scroll */}
                    <div className="overflow-x-auto">
                      <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                        {filteredModules
                          .filter(module => isFavorite(module.id))
                          .map((module) => {
                            const IconComponent = module.icon;
                            
                            return (
                              <button
                                key={`favorite-${module.id}`}
                                className={`w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md text-left ${
                                  module.hasAccess 
                                    ? 'cursor-pointer hover:border-blue-300' 
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                                onClick={() => module.hasAccess && handleModuleAccess(module)}
                                disabled={!module.hasAccess}
                                aria-label={`Acessar módulo ${module.display_name}`}
                              >
                                <div className="flex items-start space-x-4">
                                  <div className="flex-shrink-0">
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                                      style={{ backgroundColor: designTokens.colors.primary[50] }}
                                    >
                                      <IconComponent 
                                        className="h-6 w-6" 
                                        style={{ color: designTokens.colors.primary.DEFAULT }} 
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h3 
                                        className="text-lg font-semibold text-gray-900"
                                        style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                                      >
                                        {module.display_name}
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
                                            isFavorite(module.id) 
                                              ? 'fill-yellow-400 text-yellow-400' 
                                              : 'text-gray-400 hover:text-yellow-400'
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
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div 
                                          className={`w-2 h-2 rounded-full ${
                                            module.hasAccess ? 'bg-green-500' : 'bg-yellow-500'
                                          }`}
                                        ></div>
                                        <span 
                                          className="text-xs text-gray-500"
                                          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                                        >
                                          {module.hasAccess ? 'Disponível' : 'Em Desenvolvimento'}
                                        </span>
                                      </div>
                                      {module.hasAccess && (
                                        <div 
                                          className="text-sm font-medium"
                                          style={{ 
                                            color: designTokens.colors.primary.DEFAULT,
                                            fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                                          }}
                                        >
                                          Acessar →
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

        {/* Modules Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 
              className="text-2xl font-semibold text-gray-900"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              Módulos Disponíveis
            </h3>
            <span 
              className="text-sm text-gray-500"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              {filteredModules.length} módulos
            </span>
          </div>
          
          {/* Modules Grid - 2 linhas fixas com scroll horizontal */}
          <div className="relative">
            {/* Gradiente esquerdo */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            {/* Gradiente direito */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
            
            <div className="overflow-x-auto">
              <div className="grid grid-rows-2 gap-6 pb-4" style={{ gridAutoFlow: 'column', minWidth: 'max-content' }}>
          {filteredModules.map((module) => {
            const IconComponent = module.icon;
            
            return (
                      <button
                        key={module.id}
                        className={`w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md text-left ${
                          module.hasAccess 
                            ? 'cursor-pointer hover:border-blue-300' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                onClick={() => module.hasAccess && handleModuleAccess(module)}
                disabled={!module.hasAccess}
                aria-label={`Acessar módulo ${module.display_name}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: designTokens.colors.primary[50] }}
                    >
                      <IconComponent 
                        className="h-6 w-6" 
                        style={{ color: designTokens.colors.primary.DEFAULT }} 
                      />
                    </div>
                  </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 
                                className="text-lg font-semibold text-gray-900"
                                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                              >
                                {module.display_name}
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
                                    isFavorite(module.id) 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-400 hover:text-yellow-400'
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className={`w-2 h-2 rounded-full ${
                                    module.hasAccess ? 'bg-green-500' : 'bg-yellow-500'
                                  }`}
                                ></div>
                                <span 
                                  className="text-xs text-gray-500"
                                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                                >
                                  {module.hasAccess ? 'Disponível' : 'Em Desenvolvimento'}
                                </span>
                              </div>
                              {module.hasAccess && (
                                <div 
                                  className="text-sm font-medium"
                                  style={{ 
                                    color: designTokens.colors.primary.DEFAULT,
                                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                                  }}
                                >
                                  Acessar →
                                </div>
                              )}
                            </div>
                          </div>
                </div>
              </button>
                    );
                  })}
                  </div>
                </div>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 
            className="text-2xl font-semibold text-gray-900 mb-6"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Informações do Sistema
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              style={{ 
                borderColor: designTokens.colors.neutral[200],
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              <h4 
                className="text-lg font-semibold text-gray-900 mb-4"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Performance do Sistema
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Tempo de Resposta
                  </span>
                  <span 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    120ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    CPU Usage
                  </span>
                  <span 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    45%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Memory Usage
                  </span>
                  <span 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    2.1GB
                  </span>
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              style={{ 
                borderColor: designTokens.colors.neutral[200],
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              <h4 
                className="text-lg font-semibold text-gray-900 mb-4"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Atividade Recente
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: designTokens.colors.success.DEFAULT }}
                  ></div>
                  <span 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Usuário acessou Comercial+
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: designTokens.colors.primary.DEFAULT }}
                  ></div>
                  <span 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Relatório gerado em Analytics
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: designTokens.colors.warning.DEFAULT }}
                  ></div>
                  <span 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Backup automático concluído
                  </span>
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              style={{ 
                borderColor: designTokens.colors.neutral[200],
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              <h4 
                className="text-lg font-semibold text-gray-900 mb-4"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Próximas Atualizações
              </h4>
              <div className="space-y-3">
                <div className="border-l-2 border-blue-500 pl-3">
                  <p 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Módulo Logística
                  </p>
                  <p 
                    className="text-xs text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    v2.1.0 - 15/02/2025
                  </p>
                </div>
                <div className="border-l-2 border-green-500 pl-3">
                  <p 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Módulo Financeiro
                  </p>
                  <p 
                    className="text-xs text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    v1.8.2 - 20/02/2025
                  </p>
                </div>
                <div className="border-l-2 border-purple-500 pl-3">
                  <p 
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    Sistema Principal
                  </p>
                  <p 
                    className="text-xs text-gray-600"
                    style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                  >
                    v3.0.0 - 28/02/2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p 
            className="text-sm text-gray-500"
            style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
          >
            Arruda Hub © 2025 - Para suporte, entre em contato com a equipe de TI
          </p>
        </div>
      </main>
    </div>
  );
};

export default Hub;