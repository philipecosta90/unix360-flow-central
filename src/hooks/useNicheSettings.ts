
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
      console.log('Empresa ID não encontrado:', userProfile?.empresa_id);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Buscando configurações para empresa:', userProfile.empresa_id);
      
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

      console.log('Dados carregados do Supabase:', data);
      console.log('Configurações de nicho:', data?.configuracoes_nicho);

      if (data?.configuracoes_nicho) {
        const loadedSettings = data.configuracoes_nicho as unknown as NicheSettings;
        console.log('Nicho carregado:', loadedSettings.niche_type);
        setSettings(loadedSettings);
      } else {
        console.log('Nenhuma configuração encontrada, usando padrão');
        // Se não há configurações, manter null para que o componente use os padrões
        setSettings(null);
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

    console.log('Salvando configurações:', newSettings);
    console.log('Para empresa:', userProfile.empresa_id);

    const { error } = await supabase
      .from('empresas')
      .update({
        configuracoes_nicho: newSettings as any
      })
      .eq('id', userProfile.empresa_id);

    if (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }

    console.log('Configurações salvas com sucesso');
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
