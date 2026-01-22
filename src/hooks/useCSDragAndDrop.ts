import { useState } from 'react';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CSClient {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cs_stage_id: string | null;
  cs_stage_entered_at: string | null;
  status: string;
}

export const useCSDragAndDrop = () => {
  const [activeClient, setActiveClient] = useState<CSClient | null>(null);
  const queryClient = useQueryClient();

  const updateClientStageMutation = useMutation({
    mutationFn: async ({ clientId, stageId }: { clientId: string; stageId: string | null }) => {
      // Se for 'unassigned', salvar como null no banco
      const actualStageId = stageId === 'unassigned' ? null : stageId;
      
      const { error } = await supabase
        .from('clientes')
        .update({ 
          cs_stage_id: actualStageId,
          cs_stage_entered_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      // Registrar interação de mudança de etapa
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('empresa_id')
          .eq('user_id', userData.user.id)
          .single();

        if (perfil) {
          await supabase.from('cs_interacoes').insert({
            cliente_id: clientId,
            empresa_id: perfil.empresa_id,
            tipo: 'stage_change',
            titulo: 'Mudança de etapa no CS',
            descricao: actualStageId 
              ? `Cliente movido para nova etapa do fluxo CS` 
              : `Cliente removido das etapas do CS`,
            responsavel_id: userData.user.id,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente movido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating client stage:', error);
      toast.error('Erro ao mover cliente');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const client = event.active.data.current as CSClient;
    setActiveClient(client);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveClient(null);

    if (!over) return;

    const clientId = active.id as string;
    const overId = over.id as string;

    // Obter o cliente atual
    const currentClient = active.data.current as CSClient;
    const currentStageId = currentClient?.cs_stage_id;

    // Determinar a etapa de destino
    let targetStageId: string | null;

    if (overId === 'unassigned') {
      // Destino é a coluna "Sem Etapa"
      targetStageId = null;
    } else {
      // Verificar se over.data.current contém dados de um card (cliente)
      const overData = over.data.current as CSClient | undefined;
      
      if (overData && 'cs_stage_id' in overData) {
        // É um card - usar a etapa do card de destino
        targetStageId = overData.cs_stage_id;
      } else {
        // É uma coluna/etapa - usar o ID diretamente
        targetStageId = overId;
      }
    }

    // Se o cliente já está sem etapa e o destino também é sem etapa, não fazer nada
    if (currentStageId === null && targetStageId === null) return;
    
    // Se o cliente está em uma etapa e o destino é a mesma etapa, não fazer nada
    if (currentStageId === targetStageId) return;

    updateClientStageMutation.mutate({
      clientId,
      stageId: targetStageId === null ? 'unassigned' : targetStageId,
    });
  };

  return {
    activeClient,
    handleDragStart,
    handleDragEnd,
    isUpdating: updateClientStageMutation.isPending,
  };
};
