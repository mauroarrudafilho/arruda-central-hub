import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type RLSPolicy = Database['public']['Tables']['rbac_rls_policies']['Row'];
type PolicyHistory = Database['public']['Tables']['rbac_rls_policy_history']['Row'];
type PolicyApplication = Database['public']['Tables']['rbac_rls_policy_applications']['Row'];

export interface RLSPolicyWithDetails extends RLSPolicy {
  role_nome?: string;
  projeto_nome?: string;
  modulo_nome?: string;
  organizacao_nome?: string;
}

export interface PolicyStats {
  total_policies: number;
  active_policies: number;
  applied_policies: number;
  failed_policies: number;
  by_operation: Record<string, number>;
  by_table: Record<string, number>;
}

export const useRLSPolicies = () => {
  const [policies, setPolicies] = useState<RLSPolicyWithDetails[]>([]);
  const [policyHistory, setPolicyHistory] = useState<PolicyHistory[]>([]);
  const [policyApplications, setPolicyApplications] = useState<PolicyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as políticas
  const fetchPolicies = useCallback(async (filters?: {
    tabela?: string;
    operacao?: string;
    projeto_id?: string;
    modulo_id?: string;
    organizacao_id?: string;
    role_id?: string;
    ativo?: boolean;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('rbac_rls_policies')
        .select(`
          *,
          rbac_auth_role!rbac_rls_policies_role_id_fkey(nome),
          rbac_projects!rbac_rls_policies_projeto_id_fkey(nome),
          rbac_modules!rbac_rls_policies_modulo_id_fkey(nome),
          rbac_organizations!rbac_rls_policies_organizacao_id_fkey(nome)
        `)
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.tabela) {
        query = query.eq('tabela', filters.tabela);
      }
      if (filters?.operacao) {
        query = query.eq('operacao', filters.operacao);
      }
      if (filters?.projeto_id) {
        query = query.eq('projeto_id', filters.projeto_id);
      }
      if (filters?.modulo_id) {
        query = query.eq('modulo_id', filters.modulo_id);
      }
      if (filters?.organizacao_id) {
        query = query.eq('organizacao_id', filters.organizacao_id);
      }
      if (filters?.role_id) {
        query = query.eq('role_id', filters.role_id);
      }
      if (filters?.ativo !== undefined) {
        query = query.eq('ativo', filters.ativo);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const policiesWithDetails = data?.map(policy => ({
        ...policy,
        role_nome: policy.rbac_auth_role?.nome,
        projeto_nome: policy.rbac_projects?.nome,
        modulo_nome: policy.rbac_modules?.nome,
        organizacao_nome: policy.rbac_organizations?.nome,
      })) || [];

      setPolicies(policiesWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar políticas RLS');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar políticas aplicáveis para uma tabela
  const fetchApplicablePolicies = useCallback(async (
    tabela: string,
    organizacao_id?: string,
    projeto_id?: string
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_applicable_rls_policies', {
          _tabela: tabela,
          _organizacao_id: organizacao_id,
          _projeto_id: projeto_id
        });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar políticas aplicáveis');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar histórico de uma política
  const fetchPolicyHistory = useCallback(async (policyId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rbac_rls_policy_history')
        .select('*')
        .eq('policy_id', policyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicyHistory(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar histórico da política');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar aplicações de políticas
  const fetchPolicyApplications = useCallback(async (policyId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('rbac_rls_policy_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (policyId) {
        query = query.eq('policy_id', policyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPolicyApplications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar aplicações de políticas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar política RLS
  const applyPolicy = useCallback(async (policyId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('apply_rls_policy', {
          _policy_id: policyId
        });

      if (error) throw error;
      
      // Recarregar políticas
      await fetchPolicies();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar política');
      throw err;
    }
  }, [fetchPolicies]);

  // Remover política RLS
  const removePolicy = useCallback(async (policyId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('remove_rls_policy', {
          _policy_id: policyId
        });

      if (error) throw error;
      
      // Recarregar políticas
      await fetchPolicies();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover política');
      throw err;
    }
  }, [fetchPolicies]);

  // Criar nova política
  const createPolicy = async (policy: {
    nome: string;
    tabela: string;
    operacao: string;
    condicao_using?: string;
    condicao_with_check?: string;
    projeto_id?: string;
    modulo_id?: string;
    organizacao_id?: string;
    role_id?: string;
    prioridade?: number;
    descricao?: string;
    tags?: string[];
    configuracoes?: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('rbac_rls_policies')
        .insert(policy)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar políticas
      await fetchPolicies();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar política');
      throw err;
    }
  };

  // Atualizar política
  const updatePolicy = async (id: string, updates: Partial<RLSPolicy>) => {
    try {
      const { data, error } = await supabase
        .from('rbac_rls_policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar políticas
      await fetchPolicies();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar política');
      throw err;
    }
  };

  // Ativar/Desativar política
  const togglePolicyStatus = async (id: string, ativo: boolean) => {
    try {
      const { data, error } = await supabase
        .from('rbac_rls_policies')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar políticas
      await fetchPolicies();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status da política');
      throw err;
    }
  };

  // Deletar política
  const deletePolicy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rbac_rls_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Recarregar políticas
      await fetchPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar política');
      throw err;
    }
  };

  // Buscar estatísticas das políticas
  const fetchPolicyStats = async (): Promise<PolicyStats> => {
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('rbac_rls_policies')
        .select('operacao, tabela, ativo');

      if (policiesError) throw policiesError;

      const { data: applications, error: applicationsError } = await supabase
        .from('rbac_rls_policy_applications')
        .select('status');

      if (applicationsError) throw applicationsError;

      const stats: PolicyStats = {
        total_policies: policies?.length || 0,
        active_policies: policies?.filter(p => p.ativo).length || 0,
        applied_policies: applications?.filter(a => a.status === 'applied').length || 0,
        failed_policies: applications?.filter(a => a.status === 'failed').length || 0,
        by_operation: {},
        by_table: {}
      };

      // Contar por operação
      policies?.forEach(policy => {
        stats.by_operation[policy.operacao] = (stats.by_operation[policy.operacao] || 0) + 1;
      });

      // Contar por tabela
      policies?.forEach(policy => {
        stats.by_table[policy.tabela] = (stats.by_table[policy.tabela] || 0) + 1;
      });

      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      return {
        total_policies: 0,
        active_policies: 0,
        applied_policies: 0,
        failed_policies: 0,
        by_operation: {},
        by_table: {}
      };
    }
  };

  // Filtrar políticas por critérios
  const filterPolicies = (criteria: {
    tabela?: string;
    operacao?: string;
    ativo?: boolean;
    tags?: string[];
  }) => {
    return policies.filter(policy => {
      if (criteria.tabela && policy.tabela !== criteria.tabela) return false;
      if (criteria.operacao && policy.operacao !== criteria.operacao) return false;
      if (criteria.ativo !== undefined && policy.ativo !== criteria.ativo) return false;
      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some(tag => policy.tags?.includes(tag));
        if (!hasMatchingTag) return false;
      }
      return true;
    });
  };

  // Buscar políticas por tabela
  const getPoliciesByTable = (tabela: string) => {
    return policies.filter(policy => policy.tabela === tabela);
  };

  // Buscar políticas por role
  const getPoliciesByRole = (roleId: string) => {
    return policies.filter(policy => policy.role_id === roleId);
  };

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    policyHistory,
    policyApplications,
    loading,
    error,
    fetchPolicies,
    fetchApplicablePolicies,
    fetchPolicyHistory,
    fetchPolicyApplications,
    applyPolicy,
    removePolicy,
    createPolicy,
    updatePolicy,
    togglePolicyStatus,
    deletePolicy,
    fetchPolicyStats,
    filterPolicies,
    getPoliciesByTable,
    getPoliciesByRole,
  };
};
