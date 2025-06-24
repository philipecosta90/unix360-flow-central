
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

  // Safe check for prospects array
  const safeProspects = Array.isArray(prospects) ? prospects : [];

  const updateProspectMutation = useMutation({
    mutationFn: async ({ prospectId, newStageId }: { prospectId: string; newStageId: string }) => {
      // Encontrar o nome da etapa pelo ID para garantir consistência
      const targetStage = stages.find(stage => stage && stage.id === newStageId);
      const newStageValue = targetStage?.id || newStageId; // Usar ID da stage
      
      console.log('🔄 Atualizando prospect no banco:', { 
        prospectId, 
        newStageId, 
        targetStageName: targetStage?.nome,
        valueToStore: newStageValue
      });
      
      // Atualizar usando o ID da stage para manter consistência
      const { error } = await supabase
        .from('crm_prospects')
        .update({ stage: newStageValue })
        .eq('id', prospectId);

      if (error) {
        console.error('❌ Erro ao atualizar prospect:', error);
        throw error;
      }

      // Log stage change activity
      if (userProfile?.id) {
        await supabase
          .from('crm_atividades')
          .insert({
            prospect_id: prospectId,
            tipo: 'stage_change',
            titulo: `Movido para ${targetStage?.nome || newStageId}`,
            descricao: `Prospect movido para a etapa ${targetStage?.nome || newStageId}`,
            created_by: userProfile.id,
          });
      }

      console.log('✅ Prospect atualizado com sucesso - novo stage:', newStageValue);
    },
    onSuccess: () => {
      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['crm-prospects'] });
      console.log('🔄 Queries invalidadas, recarregando dados...');
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
    const prospectId = event.active.id as string;
    const prospect = safeProspects.find(p => p && p.id === prospectId);
    setActiveProspect(prospect || null);
    console.log('🎯 Iniciando drag do prospect:', prospect?.nome, 'ID:', prospectId, 'da stage:', prospect?.stage);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProspect(null);

    console.log('🎯 DragEnd event:', { 
      activeId: active.id, 
      overId: over?.id,
      activeType: typeof active.id,
      overType: typeof over?.id
    });

    if (!over) {
      console.log('❌ Drag cancelado - sem destino válido');
      return;
    }

    const prospectId = active.id as string;
    const newStageId = over.id as string;

    const prospect = safeProspects.find(p => p && p.id === prospectId);
    const targetStage = stages.find(s => s && s.id === newStageId);
    
    console.log('🎯 Dados do drag:', {
      prospect: prospect ? `${prospect.nome} (stage atual: ${prospect.stage})` : 'não encontrado',
      targetStage: targetStage ? `${targetStage.nome} (ID: ${targetStage.id})` : 'não encontrado'
    });
    
    if (!prospect || !targetStage) {
      console.log('❌ Prospect ou stage não encontrados:', { prospect: !!prospect, targetStage: !!targetStage });
      return;
    }

    // Verificar se o prospect já está na stage de destino
    const isAlreadyInStage = prospect.stage === targetStage.id;
    if (isAlreadyInStage) {
      console.log('ℹ️ Prospect já está na stage de destino');
      return;
    }

    console.log('🎯 Executando drag-and-drop:', { 
      prospect: prospect.nome, 
      from: prospect.stage, 
      to: targetStage.nome,
      toId: targetStage.id
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
