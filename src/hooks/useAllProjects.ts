import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AllProject {
  id: string;
  nome: string;
  descricao: string | null;
  slug: string;
  status: string;
}

export const useAllProjects = () => {
  const [projects, setProjects] = useState<AllProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar TODOS os projetos ativos do sistema (não filtrado por usuário)
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome, descricao, slug, status')
        .eq('status', 'ativo')
        .order('nome');
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error fetching all projects:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de projetos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  return { projects, loading, error, refetch: fetchAllProjects };
};