import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CSKanbanCard } from './CSKanbanCard';
import { CSClient } from '@/hooks/useCSClients';
import { CSStage } from '@/hooks/useCSStages';

interface CSKanbanColumnProps {
  stage: CSStage;
  clients: CSClient[];
  onViewDetails?: (clientId: string) => void;
  onOpenWhatsApp?: (phone: string) => void;
}

export const CSKanbanColumn = ({ 
  stage, 
  clients, 
  onViewDetails,
  onOpenWhatsApp 
}: CSKanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div 
      className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg border border-border overflow-hidden"
    >
      {/* Header */}
      <div 
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ backgroundColor: stage.cor + '20', borderBottom: `2px solid ${stage.cor}` }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: stage.cor }}
          />
          <h3 className="font-semibold text-sm text-foreground">
            {stage.nome}
          </h3>
        </div>
        <span 
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: stage.cor + '30', color: stage.cor }}
        >
          {clients.length}
        </span>
      </div>

      {/* Content */}
      <div 
        ref={setNodeRef}
        className={`flex-1 p-2 transition-colors ${
          isOver ? 'bg-primary/5' : ''
        }`}
      >
        <ScrollArea className="h-[calc(100vh-280px)]">
          <SortableContext 
            items={clients.map(c => c.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 pr-2">
              {clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum cliente nesta etapa
                </div>
              ) : (
                clients.map((client) => (
                  <CSKanbanCard
                    key={client.id}
                    client={client}
                    onViewDetails={onViewDetails}
                    onOpenWhatsApp={onOpenWhatsApp}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
};
