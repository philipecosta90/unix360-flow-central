import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Settings2,
  Loader2,
} from 'lucide-react';
import { useCSStages, CSStage } from '@/hooks/useCSStages';
import { useAuth } from '@/hooks/useAuth';

interface CSStageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  '#6B7280', // gray
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#F43F5E', // rose
];

interface SortableStageItemProps {
  stage: CSStage;
  index: number;
  editingStage: string | null;
  editName: string;
  editColor: string;
  isUpdating: boolean;
  onEditNameChange: (value: string) => void;
  onEditColorChange: (value: string) => void;
  onStartEditing: (stage: CSStage) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onDelete: (stageId: string) => void;
}

const SortableStageItem = ({
  stage,
  index,
  editingStage,
  editName,
  editColor,
  isUpdating,
  onEditNameChange,
  onEditColorChange,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onDelete,
}: SortableStageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingStage === stage.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{
          backgroundColor: isEditing ? editColor : stage.cor || '#6B7280',
        }}
      />

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex gap-1">
            {PRESET_COLORS.slice(0, 6).map((color) => (
              <button
                key={color}
                type="button"
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                  editColor === color ? 'border-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onEditColorChange(color)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <span className="font-medium text-sm">{stage.nome}</span>
          <Badge variant="outline" className="text-xs">
            #{index + 1}
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600"
              onClick={onSaveEditing}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={onCancelEditing}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onStartEditing(stage)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(stage.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export const CSStageSettingsDialog = ({
  open,
  onOpenChange,
}: CSStageSettingsDialogProps) => {
  const { userProfile } = useAuth();
  const {
    stages,
    isLoading,
    updateStage,
    createStage,
    deleteStage,
    isUpdating,
    isCreating,
    isDeleting,
  } = useCSStages();

  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6B7280');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const startEditing = (stage: CSStage) => {
    setEditingStage(stage.id);
    setEditName(stage.nome);
    setEditColor(stage.cor || '#6B7280');
  };

  const cancelEditing = () => {
    setEditingStage(null);
    setEditName('');
    setEditColor('');
  };

  const saveEditing = () => {
    if (editingStage && editName.trim()) {
      updateStage({
        stageId: editingStage,
        updates: {
          nome: editName.trim(),
          cor: editColor,
        },
      });
      cancelEditing();
    }
  };

  const handleAddStage = () => {
    if (newStageName.trim() && userProfile?.empresa_id) {
      const maxOrdem = Math.max(...stages.map((s) => s.ordem), 0);
      createStage({
        empresa_id: userProfile.empresa_id,
        nome: newStageName.trim(),
        ordem: maxOrdem + 1,
        cor: newStageColor,
        ativo: true,
      });
      setNewStageName('');
      setNewStageColor('#6B7280');
      setShowAddForm(false);
    }
  };

  const handleDeleteStage = (stageId: string) => {
    deleteStage(stageId);
    setDeleteConfirmId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedStages = arrayMove(stages, oldIndex, newIndex);

        // Update ordem for all affected stages
        reorderedStages.forEach((stage, index) => {
          if (stage.ordem !== index + 1) {
            updateStage({
              stageId: stage.id,
              updates: { ordem: index + 1 },
            });
          }
        });
      }
    }
  };

  const stageToDelete = stages.find((s) => s.id === deleteConfirmId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configurar Etapas do Kanban
            </DialogTitle>
            <DialogDescription>
              Arraste para reordenar, edite ou remova etapas da jornada do cliente
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={stages.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {stages.map((stage, index) => (
                        <SortableStageItem
                          key={stage.id}
                          stage={stage}
                          index={index}
                          editingStage={editingStage}
                          editName={editName}
                          editColor={editColor}
                          isUpdating={isUpdating}
                          onEditNameChange={setEditName}
                          onEditColorChange={setEditColor}
                          onStartEditing={startEditing}
                          onSaveEditing={saveEditing}
                          onCancelEditing={cancelEditing}
                          onDelete={setDeleteConfirmId}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  {/* Add new stage form */}
                  {showAddForm ? (
                    <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Nome da etapa</Label>
                        <Input
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          placeholder="Ex: Em Acompanhamento"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Cor</Label>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                newStageColor === color
                                  ? 'border-primary ring-2 ring-primary/30'
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewStageColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={handleAddStage}
                          disabled={!newStageName.trim() || isCreating}
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Adicionar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddForm(false);
                            setNewStageName('');
                            setNewStageColor('#6B7280');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar nova etapa
                    </Button>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a etapa{' '}
              <strong>"{stageToDelete?.nome}"</strong>? Os clientes nesta etapa
              ficarão sem etapa atribuída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteStage(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};