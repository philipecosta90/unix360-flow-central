
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CRMColumn } from "./CRMColumn";
import { CRMCard } from "./CRMCard";
import { CRMCardSkeleton } from "./CRMCardSkeleton";

interface CRMStage {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
}

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

interface CRMKanbanBoardProps {
  filters: {
    search: string;
    tags: string[];
    responsavel: string;
    stage: string;
  };
}

export const CRMKanbanBoard = ({ filters }: CRMKanbanBoardProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeProspect, setActiveProspect] = useState<CRMProspect | null>(null);

  // Fetch stages
  const { data: stages = [] } = useQuery({
    queryKey: ['crm-stages', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      return data as CRMStage[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  // Fetch prospects
  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ['crm-prospects', userProfile?.empresa_id, filters],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      let query = supabase
        .from('crm_prospects')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id);

      // Apply filters
      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,empresa_cliente.ilike.%${filters.search}%`);
      }
      
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      
      if (filters.responsavel) {
        query = query.eq('responsavel_id', filters.responsavel);
      }

      if (filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMProspect[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  // Update prospect stage mutation
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

  const getProspectsByStage = (stageId: string) => {
    return prospects.filter(prospect => prospect.stage === stageId);
  };

  const getTotalValueByStage = (stageId: string) => {
    return getProspectsByStage(stageId).reduce((total, prospect) => total + (prospect.valor_estimado || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            <CRMCardSkeleton />
            <CRMCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto">
        <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
          {stages.map((stage) => {
            const stageProspects = getProspectsByStage(stage.id);
            const stageValue = getTotalValueByStage(stage.id);
            
            return (
              <CRMColumn
                key={stage.id}
                stage={stage}
                prospects={stageProspects}
                totalValue={stageValue}
              />
            );
          })}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeProspect ? <CRMCard prospect={activeProspect} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};
