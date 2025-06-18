
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
import { useCRMStages } from "@/hooks/useCRMStages";
import { useCRMProspects } from "@/hooks/useCRMProspects";
import { useCRMDragAndDrop } from "@/hooks/useCRMDragAndDrop";

interface CRMKanbanBoardProps {
  filters: {
    search: string;
    tags: string[];
    responsavel: string;
    stage: string;
  };
}

export const CRMKanbanBoard = ({ filters }: CRMKanbanBoardProps) => {
  const { data: stages = [] } = useCRMStages();
  const { data: prospects = [], isLoading } = useCRMProspects(filters);
  const { activeProspect, handleDragStart, handleDragEnd } = useCRMDragAndDrop(prospects);

  const getProspectsByStage = (stageId: string) => {
    return prospects.filter(prospect => prospect.stage === stageId);
  };

  const getTotalValueByStage = (stageId: string) => {
    return getProspectsByStage(stageId).reduce((total, prospect) => total + (prospect.valor_estimado || 0), 0);
  };

  if (isLoading) {
    return <CRMKanbanLoadingSkeleton />;
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
