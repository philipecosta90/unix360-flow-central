import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, RefreshCw, Users, List, LayoutGrid } from 'lucide-react';
import { CSKanbanColumn } from './CSKanbanColumn';
import { CSKanbanCard } from './CSKanbanCard';
import { useCSStages } from '@/hooks/useCSStages';
import { useCSClients, CSClient } from '@/hooks/useCSClients';
import { useCSDragAndDrop } from '@/hooks/useCSDragAndDrop';
import { CSClientDetail } from './CSClientDetail';

interface CSKanbanBoardProps {
  onViewModeChange?: (mode: 'kanban' | 'list') => void;
  viewMode?: 'kanban' | 'list';
}

export const CSKanbanBoard = ({ onViewModeChange, viewMode = 'kanban' }: CSKanbanBoardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { stages, isLoading: stagesLoading } = useCSStages();
  const { clients, clientsByStage, isLoading: clientsLoading, refetch } = useCSClients();
  const { activeClient, handleDragStart, handleDragEnd, isUpdating } = useCSDragAndDrop();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleViewDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowDetailModal(true);
  };

  const handleOpenWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const filterClients = (stageClients: CSClient[]) => {
    if (!searchTerm) return stageClients;
    const search = searchTerm.toLowerCase();
    return stageClients.filter(
      (client) =>
        client.nome.toLowerCase().includes(search) ||
        client.email?.toLowerCase().includes(search) ||
        client.telefone?.includes(search)
    );
  };

  // Clientes sem etapa atribuída
  const unassignedClients = filterClients(clientsByStage['unassigned'] || []);

  if (stagesLoading || clientsLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <Skeleton className="h-12 w-full rounded-t-lg" />
              <div className="space-y-2 p-2 bg-muted/30 rounded-b-lg">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Jornada do Cliente
            </h2>
            <span className="text-sm text-muted-foreground">
              ({clients.length} clientes ativos)
            </span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isUpdating}
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </Button>

            {onViewModeChange && (
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => onViewModeChange('kanban')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => onViewModeChange('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 min-w-max">
              {/* Coluna para clientes sem etapa */}
              {unassignedClients.length > 0 && (
                <div className="flex-shrink-0 w-72 flex flex-col bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden">
                  <div className="px-3 py-2.5 flex items-center justify-between bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <h3 className="font-semibold text-sm text-foreground">
                        Sem Etapa
                      </h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200">
                      {unassignedClients.length}
                    </span>
                  </div>
                  <div className="flex-1 p-2">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-2 pr-2">
                        {unassignedClients.map((client) => (
                          <CSKanbanCard
                            key={client.id}
                            client={client}
                            onViewDetails={handleViewDetails}
                            onOpenWhatsApp={handleOpenWhatsApp}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Colunas das etapas */}
              {stages.map((stage) => (
                <CSKanbanColumn
                  key={stage.id}
                  stage={stage}
                  clients={filterClients(clientsByStage[stage.id] || [])}
                  onViewDetails={handleViewDetails}
                  onOpenWhatsApp={handleOpenWhatsApp}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeClient && (
              <CSKanbanCard
                client={activeClient as CSClient}
                onViewDetails={handleViewDetails}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            )}
          </DragOverlay>
        </DndContext>
      </Card>

      {/* Modal de Detalhes */}
      {selectedClientId && (
        <CSClientDetail
          clientId={selectedClientId}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}
    </>
  );
};
