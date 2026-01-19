import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface CSStage {
  id: string;
  empresa_id: string;
  nome: string;
  ordem: number;
  cor: string;
  ativo: boolean;
  auto_move: Json | null;
  created_at: string;
  updated_at: string;
}

export const useCSStages = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading, error } = useQuery({
    queryKey: ['cs-stages', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];

      const { data, error } = await supabase
        .from('cs_stages')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) {
        console.error('Error fetching CS stages:', error);
        throw error;
      }

      // Se não houver etapas, criar as padrão
      if (!data || data.length === 0) {
        const { error: rpcError } = await supabase.rpc('create_default_cs_stages_for_company', {
          p_empresa_id: userProfile.empresa_id
        });

        if (rpcError) {
          console.error('Error creating default CS stages:', rpcError);
          throw rpcError;
        }

        // Buscar novamente após criar
        const { data: newData, error: fetchError } = await supabase
          .from('cs_stages')
          .select('*')
          .eq('empresa_id', userProfile.empresa_id)
          .eq('ativo', true)
          .order('ordem', { ascending: true });

        if (fetchError) throw fetchError;
        return (newData || []) as CSStage[];
      }

      return data as CSStage[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, updates }: { stageId: string; updates: { nome?: string; ordem?: number; cor?: string; ativo?: boolean } }) => {
      const { error } = await supabase
        .from('cs_stages')
        .update(updates)
        .eq('id', stageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-stages'] });
      toast.success('Etapa atualizada com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error updating CS stage:', error);
      toast.error('Erro ao atualizar etapa');
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async (stage: { empresa_id: string; nome: string; ordem: number; cor?: string; ativo?: boolean }) => {
      const { error } = await supabase
        .from('cs_stages')
        .insert(stage);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-stages'] });
      toast.success('Etapa criada com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error creating CS stage:', error);
      toast.error('Erro ao criar etapa');
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      // Soft delete - apenas desativa a etapa
      const { error } = await supabase
        .from('cs_stages')
        .update({ ativo: false })
        .eq('id', stageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-stages'] });
      toast.success('Etapa removida com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error deleting CS stage:', error);
      toast.error('Erro ao remover etapa');
    },
  });

  return {
    stages,
    isLoading,
    error,
    updateStage: updateStageMutation.mutate,
    createStage: createStageMutation.mutate,
    deleteStage: deleteStageMutation.mutate,
    isUpdating: updateStageMutation.isPending,
    isCreating: createStageMutation.isPending,
    isDeleting: deleteStageMutation.isPending,
  };
};
