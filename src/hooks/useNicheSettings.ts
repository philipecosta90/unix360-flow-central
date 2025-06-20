
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface NicheSettings {
  niche_type: string;
  config: {
    name: string;
    leadStages: string[];
    customFields: Array<{
      id: string;
      name: string;
      type: string;
      options?: string[];
      required: boolean;
    }>;
    metrics: string[];
  };
  updated_at: string;
}

export const useNicheSettings = () => {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<NicheSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!userProfile?.empresa_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('configuracoes_nicho')
        .eq('id', userProfile.empresa_id)
        .single();

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        setError('Erro ao carregar configurações');
        return;
      }

      if (data?.configuracoes_nicho) {
        setSettings(data.configuracoes_nicho as unknown as NicheSettings);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [userProfile?.empresa_id]);

  const updateSettings = async (newSettings: NicheSettings) => {
    if (!userProfile?.empresa_id) {
      throw new Error('Usuário não está associado a uma empresa');
    }

    const { error } = await supabase
      .from('empresas')
      .update({
        configuracoes_nicho: newSettings as any
      })
      .eq('id', userProfile.empresa_id);

    if (error) {
      throw error;
    }

    setSettings(newSettings);
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
};
