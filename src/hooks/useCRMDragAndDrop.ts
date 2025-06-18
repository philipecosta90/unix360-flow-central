
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CRMProspect {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa_cliente: string;
  cargo: string;
  stage: string;
  valor_estimado: number;
  origem: string;
  tags: string[];
  responsavel_id: string;
  proximo_followup: string;
  observacoes: string;
  created_at: string;
}

export const useCRMDragAndDrop = (prospects: CRMProspect[]) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeProspect, setActiveProspect] = useState<CRMProspect | null>(null);

  const updateProspectMutation = useMutation({
    mutationFn: async ({ prospectId, newStage }: { prospectId: string; newStage: string }) => {
      const { error } = await supabase
        .from('crm_prospects')
        .update({ stage: newStage })
        .eq('id', prospectId);

      if (error) throw error;

      // Log stage change activity
      await supabase
        .from('crm_atividades')
        .insert({
          prospect_id: prospectId,
          tipo: 'stage_change',
          titulo: `Movido para ${newStage}`,
          descricao: `Prospect movido para a etapa ${newStage}`,
          created_by: userProfile?.id,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-prospects'] });
      toast({
        title: "Prospect atualizado",
        description: "O prospect foi movido para a nova etapa.",
      });
    },
    onError: (error) => {
      console.error('Error updating prospect:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover o prospect.",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const prospect = prospects.find(p => p.id === event.active.id);
    setActiveProspect(prospect || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProspect(null);

    if (!over) return;

    const prospectId = active.id as string;
    const newStage = over.id as string;

    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect || prospect.stage === newStage) return;

    updateProspectMutation.mutate({ prospectId, newStage });
  };

  return {
    activeProspect,
    handleDragStart,
    handleDragEnd,
    isUpdating: updateProspectMutation.isPending,
  };
};
