import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from './useAuth';
import { toast } from './use-toast';

interface UserPreferences {
  favorite_modules: string[];
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  toggleFavorite: (moduleId: string) => Promise<void>;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  isFavorite: (moduleId: string) => boolean;
}

const defaultPreferences: UserPreferences = {
  favorite_modules: [],
  theme: 'light',
  notifications: true,
  language: 'pt-BR',
};

export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { user } = useAuthState();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setPreferences(defaultPreferences);
        return;
      }

      // Buscar preferências do user_metadata
      const userPreferences = user.user_metadata?.preferences || defaultPreferences;
      
      // Garantir que favorite_modules seja um array
      const safePreferences: UserPreferences = {
        ...defaultPreferences,
        ...userPreferences,
        favorite_modules: Array.isArray(userPreferences.favorite_modules) 
          ? userPreferences.favorite_modules 
          : [],
      };

      setPreferences(safePreferences);
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Atualizar no Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          preferences: updatedPreferences,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setPreferences(updatedPreferences);
      
      toast({
        title: "Preferências atualizadas",
        description: "Suas preferências foram salvas com sucesso.",
      });
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas preferências.",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (moduleId: string) => {
    try {
      const currentFavorites = preferences.favorite_modules;
      const isCurrentlyFavorite = currentFavorites.includes(moduleId);
      
      const newFavorites = isCurrentlyFavorite
        ? currentFavorites.filter(id => id !== moduleId)
        : [...currentFavorites, moduleId];

      await updatePreferences({
        favorite_modules: newFavorites,
      });

      // Feedback visual imediato
      toast({
        title: isCurrentlyFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
        description: isCurrentlyFavorite 
          ? "Módulo removido da sua lista de favoritos."
          : "Módulo adicionado à sua lista de favoritos.",
      });
    } catch (err) {
      console.error('Erro ao alternar favorito:', err);
    }
  };

  const isFavorite = (moduleId: string): boolean => {
    return preferences.favorite_modules.includes(moduleId);
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  return {
    preferences,
    isLoading,
    error,
    toggleFavorite,
    updatePreferences,
    isFavorite,
  };
};

