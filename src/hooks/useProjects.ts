import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  nome: string;
  descricao: string | null;
  slug: string;
  status: string;
  url_vercel?: string | null;
  icone?: string | null;
  nivel_acesso?: 'admin' | 'gestor' | 'visualizador';
}

export interface ProjectModule {
  id: string;
  project_id?: string;
  nome: string;
  slug: string;
  icone: string | null;
  rota: string | null;
  url_externa?: string | null;
  ordem: number;
  ativo: boolean;
  descricao?: string | null;
  status?: string;
  categoria?: string | null;
}

export const DEFAULT_MODULE_DEFINITIONS: Array<Omit<ProjectModule, 'id' | 'project_id' | 'ordem'>> = [
  {
    nome: 'Gestão de Usuários',
    slug: 'gestao-usuarios',
    icone: 'Users',
    rota: '/users',
    url_externa: null,
    ativo: true,
    descricao: 'Controle de usuários, permissões e acesso ao sistema',
    status: 'disponivel',
    categoria: 'sistema',
  },
  {
    nome: 'Roles e Permissões',
    slug: 'rbac',
    icone: 'Shield',
    rota: '/rbac',
    url_externa: null,
    ativo: true,
    descricao: 'Configuração de papéis e políticas de acesso',
    status: 'disponivel',
    categoria: 'sistema',
  },
  {
    nome: 'Auditoria',
    slug: 'audit',
    icone: 'FileText',
    rota: '/audit',
    url_externa: null,
    ativo: true,
    descricao: 'Logs de auditoria e eventos críticos',
    status: 'disponivel',
    categoria: 'sistema',
  },
  {
    nome: 'Logs de Segurança',
    slug: 'security-logs',
    icone: 'Lock',
    rota: '/security-logs',
    url_externa: null,
    ativo: true,
    descricao: 'Monitoramento de eventos de segurança',
    status: 'disponivel',
    categoria: 'sistema',
  },
  {
    nome: 'Sessões Ativas',
    slug: 'sessions',
    icone: 'Activity',
    rota: '/sessions',
    url_externa: null,
    ativo: true,
    descricao: 'Visão de sessões e dispositivos conectados',
    status: 'disponivel',
    categoria: 'sistema',
  },
  {
    nome: 'Analytics',
    slug: 'analytics',
    icone: 'BarChart3',
    rota: '/analytics',
    url_externa: null,
    ativo: true,
    descricao: 'Relatórios consolidados de uso e performance',
    status: 'disponivel',
    categoria: 'relatorio',
  },
  {
    nome: 'Trade Marketing',
    slug: 'trade-marketing',
    icone: 'BarChart3',
    rota: null,
    url_externa: 'https://degusta-go.lovable.app/',
    ativo: true,
    descricao: 'Campanhas e promoções comerciais',
    status: 'disponivel',
    categoria: 'negocio',
  },
  {
    nome: 'Acordos Comerciais',
    slug: 'acordos-comerciais',
    icone: 'FileText',
    rota: null,
    url_externa: 'https://acordo-flow.lovable.app/acordos',
    ativo: true,
    descricao: 'Registro centralizado de investimentos e concessões',
    status: 'disponivel',
    categoria: 'negocio',
  },
  {
    nome: 'Meus Documentos',
    slug: 'meus-documentos',
    icone: 'FileText',
    rota: null,
    url_externa: 'https://nfe-radar.lovable.app/auth',
    ativo: true,
    descricao: 'Ingestão e parse de NF-e, CT-e, boletos',
    status: 'disponivel',
    categoria: 'negocio',
  },
];

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar buscar todos os projetos primeiro
      const { data: allData, error: allError } = await supabase.rpc('get_all_projects');
      
      if (!allError && allData) {
        // Se get_all_projects funcionar, usar ela
        setProjects(allData || []);
      } else {
        // Fallback para get_user_projects
        const { data, error } = await supabase.rpc('get_user_projects');
        if (error) throw error;
        setProjects(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, error, refetch: fetchProjects };
};

export const useProjectModules = (projectId: string | null) => {
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = async () => {
    if (!projectId) {
      setModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectWithModule = (moduleTable: string) => `
        id,
        project_id,
        module_id,
        ordem,
        ativo,
        ${moduleTable}:module_id (
          id,
          nome,
          slug,
          descricao,
          icone,
          rota,
          url_externa,
          status,
          categoria,
          ativo,
          ordem
        )
      `;

      const selectBasic = `
        id,
        project_id,
        nome,
        slug,
        icone,
        rota,
        url_externa,
        ordem,
        ativo,
        descricao,
        status,
        categoria
      `;

      let data: any[] | null = null;

      const attempts = [
        { table: 'rbac_project_modules', moduleTable: 'rbac_modules' },
        { table: 'project_modules', moduleTable: 'modules' }
      ];

      for (const attempt of attempts) {
        try {
          const { data: detailedData } = await supabase
            .from(attempt.table)
            .select(selectWithModule(attempt.moduleTable))
            .eq('project_id', projectId)
            .order('ordem', { ascending: true });

          data = detailedData;
          break;
        } catch (queryError: any) {
          const message = queryError?.message?.toLowerCase() || '';

          const missingTable =
            message.includes('does not exist') && message.includes(attempt.table);
          const missingRelation =
            message.includes('relationship') ||
            message.includes('foreign key');

          if (missingTable) {
            // Tentar próximo attempt
            continue;
          }

          if (missingRelation) {
            // Tabela existe, mas sem relação com módulos. Buscar campos básicos.
            const { data: basicData, error: basicError } = await supabase
              .from(attempt.table)
              .select(selectBasic)
              .eq('project_id', projectId)
              .order('ordem', { ascending: true });

            if (basicError) {
              // Se mesmo básico falhar, propagar
              throw basicError;
            }

            data = basicData;
            break;
          }

          // Erro não tratado - propagar
          throw queryError;
        }
      }

      if (!data) {
        setModules([]);
        return;
      }
      
      const normalized = (data || []).map((row: any) => {
        // Para rbac_project_modules, os dados do módulo estão em row.rbac_modules
        const moduleData = row.rbac_modules || row.modules || row.module || {};

        return {
          id: moduleData.id || row.module_id || row.id,
          project_id: row.project_id || moduleData.project_id,
          nome: moduleData.nome || row.nome,
          slug: moduleData.slug || row.slug,
          icone: moduleData.icone || row.icone || null,
          rota: moduleData.rota || row.rota || null,
          url_externa: moduleData.url_externa || row.url_externa || null,
          ordem: row.ordem ?? moduleData.ordem ?? 0,
          ativo: typeof row.ativo === 'boolean' ? row.ativo : (typeof moduleData.ativo === 'boolean' ? moduleData.ativo : true),
          descricao: moduleData.descricao || row.descricao || null,
          status: moduleData.status || row.status || null,
          categoria: moduleData.categoria || row.categoria || null,
        } as ProjectModule;
      });

      if (normalized.length === 0) {
        const fallback = DEFAULT_MODULE_DEFINITIONS.map((def, index) => ({
          id: `fallback-${def.slug}`,
          project_id: projectId || undefined,
          ordem: index,
          ...def,
        }));

        setModules(fallback);
      } else {
        setModules(normalized);
      }
    } catch (err: any) {
      console.error('Error fetching project modules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [projectId]);

  return { modules, loading, error, refetch: fetchModules };
};
