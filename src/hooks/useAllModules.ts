import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AllModule {
  id: string;
  nome: string;
  descricao: string | null;
  slug: string;
  status: string;
}

export const useAllModules = () => {
  const [modules, setModules] = useState<AllModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllModules = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar módulos disponíveis usando RPC
      const { data, error } = await supabase
        .rpc('get_available_modules_for_dropdown');
      
      if (error) throw error;
      
      setModules(data || []);
    } catch (err: any) {
      console.error('Error fetching all modules:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de módulos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllModules();
  }, []);

  return { modules, loading, error, refetch: fetchAllModules };
};