
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
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
  const { data: stages = [] } = useCRMStages();
  const { data: prospects = [], isLoading } = useCRMProspects(filters);
  const { activeProspect, handleDragStart, handleDragEnd } = useCRMDragAndDrop(prospects);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [showProspectDetail, setShowProspectDetail] = useState(false);

  console.log('🔍 CRMKanbanBoard - Total prospects carregados:', prospects.length);
  console.log('🔍 CRMKanbanBoard - Stages disponíveis:', stages.map(s => ({ id: s.id, nome: s.nome })));

  const getProspectsByStage = (stageId: string) => {
    const stageProspects = prospects.filter(prospect => prospect.stage === stageId);
    console.log(`🎯 Stage ID "${stageId}" - Total de ${stageProspects.length} prospects encontrados:`,
      stageProspects.map(p => ({ id: p.id, nome: p.nome, stage: p.stage })));
    return stageProspects;
  };

  const getTotalValueByStage = (stageId: string) => { 
    return getProspectsByStage(stageId).reduce((total, prospect) => total + (prospect.valor_estimado || 0), 0);
  };

  const handleProspectClick = (prospectId: string) => {
    setSelectedProspectId(prospectId);
    setShowProspectDetail(true);
  };

  if (isLoading) {
    return <CRMKanbanLoadingSkeleton />;
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 min-h-[calc(100vh-250px)]">
          {stages.map((stage) => {
            const stageProspects = getProspectsByStage(stage.id);
            const stageValue = getTotalValueByStage(stage.id);
            
            console.log(`📊 Renderizando stage "${stage.nome}" (ID: ${stage.id}) com ${stageProspects.length} prospects`);
            
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
