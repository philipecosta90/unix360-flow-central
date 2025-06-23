
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCRMStages } from "@/hooks/useCRMStages";

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
  const { data: stages = [] } = useCRMStages();
  const [activeProspect, setActiveProspect] = useState<CRMProspect | null>(null);

  const updateProspectMutation = useMutation({
    mutationFn: async ({ prospectId, newStageId }: { prospectId: string; newStageId: string }) => {
      // Encontrar o nome da etapa pelo ID
      const targetStage = stages.find(stage => stage.id === newStageId);
      const newStageName = targetStage?.nome || newStageId;
      
      console.log('🔄 Movendo prospect:', { prospectId, newStageId, newStageName });
      
      // Atualizar usando o NOME da stage para manter compatibilidade
      const { error } = await supabase
        .from('crm_prospects')
        .update({ stage: newStageName })
        .eq('id', prospectId);

      if (error) throw error;

      // Log stage change activity
      await supabase
        .from('crm_atividades')
        .insert({
          prospect_id: prospectId,
          tipo: 'stage_change',
          titulo: `Movido para ${newStageName}`,
          descricao: `Prospect movido para a etapa ${newStageName}`,
          created_by: userProfile?.id,
        });

      console.log('✅ Prospect movido com sucesso para:', newStageName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-prospects'] });
      toast({
        title: "Prospect atualizado",
        description: "O prospect foi movido para a nova etapa.",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao mover prospect:', error);
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
    console.log('🎯 Iniciando drag do prospect:', prospect?.nome);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProspect(null);

    if (!over) return;

    const prospectId = active.id as string;
    const newStageId = over.id as string;

    const prospect = prospects.find(p => p.id === prospectId);
    const targetStage = stages.find(s => s.id === newStageId);
    
    if (!prospect || !targetStage) return;

    // Verificar se o prospect já está na stage de destino (por nome)
    if (prospect.stage === targetStage.nome) return;

    console.log('🎯 Finalizando drag:', { 
      prospect: prospect.nome, 
      from: prospect.stage, 
      to: targetStage.nome 
    });

    updateProspectMutation.mutate({ prospectId, newStageId });
  };

  return {
    activeProspect,
    handleDragStart,
    handleDragEnd,
    isUpdating: updateProspectMutation.isPending,
  };
};
