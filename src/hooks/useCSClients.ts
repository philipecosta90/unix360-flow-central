import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CSClient {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  cs_stage_id: string | null;
  cs_stage_entered_at: string | null;
  data_inicio_plano: string | null;
  data_fim_plano: string | null;
  plano_contratado: string | null;
  created_at: string;
  foto_url: string | null;
}

export const useCSClients = () => {
  const { userProfile } = useAuth();

  const { data: clients = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cs-clients', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];

      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone, status, cs_stage_id, cs_stage_entered_at, data_inicio_plano, data_fim_plano, plano_contratado, created_at, foto_url')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('status', 'ativo')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Error fetching CS clients:', error);
        throw error;
      }

      return (data || []) as CSClient[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  // Agrupar clientes por stage
  const clientsByStage = clients.reduce((acc, client) => {
    const stageId = client.cs_stage_id || 'unassigned';
    if (!acc[stageId]) {
      acc[stageId] = [];
    }
    acc[stageId].push(client);
    return acc;
  }, {} as Record<string, CSClient[]>);

  return {
    clients,
    clientsByStage,
    isLoading,
    error,
    refetch,
  };
};
