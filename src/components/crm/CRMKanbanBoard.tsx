
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import { CRMColumn } from "./CRMColumn";
import { CRMCard } from "./CRMCard";
import { CRMKanbanLoadingSkeleton } from "./CRMKanbanLoadingSkeleton";
import { CRMProspectDetail } from "./CRMProspectDetail";
import { useCRMStages } from "@/hooks/useCRMStages";
import { useCRMProspects } from "@/hooks/useCRMProspects";
import { useCRMDragAndDrop } from "@/hooks/useCRMDragAndDrop";
import { useState } from "react";

interface CRMKanbanBoardProps {
  filters: {
    search: string;
    tags: string[];
    responsavel: string;
    stage: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  };
}

export const CRMKanbanBoard = ({ filters }: CRMKanbanBoardProps) => {
  const { data: stages = [], isLoading: stagesLoading } = useCRMStages();
  const { data: prospects = [], isLoading: prospectsLoading } = useCRMProspects(filters);
  const { activeProspect, handleDragStart, handleDragEnd } = useCRMDragAndDrop(prospects);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [showProspectDetail, setShowProspectDetail] = useState(false);

  // Safe checks for arrays
  const safeStages = Array.isArray(stages) ? stages : [];
  const safeProspects = Array.isArray(prospects) ? prospects : [];

  const getProspectsByStage = (stageId: string) => {
    if (!stageId) {
      return [];
    }
    
    const stageProspects = safeProspects.filter(prospect => {
      if (!prospect) return false;
      return prospect.stage === stageId;
    });
    
    return stageProspects;
  };

  const getTotalValueByStage = (stageId: string) => { 
    const stageProspects = getProspectsByStage(stageId);
    return stageProspects.reduce((total, prospect) => total + (prospect?.valor_estimado || 0), 0);
  };

  const handleProspectClick = (prospectId: string) => {
    if (!prospectId) return;
    setSelectedProspectId(prospectId);
    setShowProspectDetail(true);
  };

  if (stagesLoading || prospectsLoading) {
    return <CRMKanbanLoadingSkeleton />;
  }

  if (safeStages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Nenhuma etapa de CRM configurada.</p>
          <p className="text-sm text-gray-400 mt-2">As etapas serão criadas automaticamente.</p>
        </div>
      </div>
    );
  }

  // Ordenar stages por ordem
  const sortedStages = safeStages.sort((a, b) => a.ordem - b.ordem);

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-200px)] bg-white p-4">
          {sortedStages.map((stage) => {
            if (!stage || !stage.id) {
              return null;
            }
            
            const stageProspects = getProspectsByStage(stage.id);
            const stageValue = getTotalValueByStage(stage.id);
            
            return (
              <CRMColumn
                key={stage.id}
                stage={stage}
                prospects={stageProspects}
                totalValue={stageValue}
                onProspectClick={handleProspectClick}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeProspect ? (
            <CRMCard prospect={activeProspect} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedProspectId && (
        <CRMProspectDetail
          prospectId={selectedProspectId}
          open={showProspectDetail}
          onOpenChange={setShowProspectDetail}
        />
      )}
    </>
  );
};
