import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Organization = Database['public']['Tables']['rbac_organizations']['Row'];

export interface UserOrganization {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
}

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOrganization, setUserOrganization] = useState<UserOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as organizações (para admins)
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rbac_organizations')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar organizações');
    } finally {
      setLoading(false);
    }
  };

  // Buscar organização do usuário atual
  const fetchUserOrganization = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_organization');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setUserOrganization(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar organização do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se usuário pertence à organização
  const checkUserBelongsToOrganization = async (organizationSlug: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('user_belongs_to_organization', {
          _user_id: (await supabase.auth.getUser()).data.user?.id,
          _organization_slug: organizationSlug
        });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Erro ao verificar pertencimento à organização:', err);
      return false;
    }
  };

  // Atualizar organização do usuário
  const updateUserOrganization = async (organizationId: string) => {
    try {
      const { error } = await supabase
        .from('rbac_auth_profile')
        .update({ organizacao_id: organizationId })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      
      // Recarregar organização do usuário
      await fetchUserOrganization();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar organização');
    }
  };

  // Criar nova organização (apenas admins)
  const createOrganization = async (organization: {
    nome: string;
    slug: string;
    descricao?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('rbac_organizations')
        .insert(organization)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar lista de organizações
      await fetchOrganizations();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar organização');
      throw err;
    }
  };

  // Atualizar organização
  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    try {
      const { data, error } = await supabase
        .from('rbac_organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar lista de organizações
      await fetchOrganizations();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar organização');
      throw err;
    }
  };

  // Desativar organização
  const deactivateOrganization = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rbac_organizations')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      
      // Recarregar lista de organizações
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar organização');
      throw err;
    }
  };

  useEffect(() => {
    fetchUserOrganization();
  }, []);

  return {
    organizations,
    userOrganization,
    loading,
    error,
    fetchOrganizations,
    fetchUserOrganization,
    checkUserBelongsToOrganization,
    updateUserOrganization,
    createOrganization,
    updateOrganization,
    deactivateOrganization,
  };
};
