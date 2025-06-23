
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
    // Filtrar prospects que correspondem ao ID da stage
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
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: 'calc(100vh - 200px)' }}>
          <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
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
          </SortableContext>
        </div>

        <DragOverlay>
          {activeProspect ? <CRMCard prospect={activeProspect} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Prospect Detail Modal */}
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
