import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Save } from "lucide-react";
import {
  useCheckinTemplates,
  useCheckinPerguntas,
  CheckinTemplate,
  CheckinPergunta,
  TIPOS_PERGUNTA_CHECKIN,
} from "@/hooks/useCheckins";
import { CheckinPerguntaFormDialog } from "./CheckinPerguntaFormDialog";
import { SortableCheckinPergunta } from "./SortableCheckinPergunta";
import { toast } from "sonner";

interface CheckinTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CheckinTemplate | null;
}

export const CheckinTemplateFormDialog = ({
  open,
  onOpenChange,
  template,
}: CheckinTemplateFormDialogProps) => {
  const isEditing = !!template;
  const { createTemplate, updateTemplate } = useCheckinTemplates();
  const { perguntas, deletePergunta, reorderPerguntas } = useCheckinPerguntas(template?.id || null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [perguntaDialogOpen, setPerguntaDialogOpen] = useState(false);
  const [selectedPergunta, setSelectedPergunta] = useState<CheckinPergunta | null>(null);

  // Sensors for drag and drop
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

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setDescricao(template.descricao || "");
      setAtivo(template.ativo);
    } else {
      setNome("");
      setDescricao("");
      setAtivo(true);
    }
  }, [template, open]);

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      if (isEditing) {
        await updateTemplate.mutateAsync({
          id: template.id,
          nome,
          descricao,
          ativo,
        });
      } else {
        await createTemplate.mutateAsync({
          nome,
          descricao,
          ativo,
        });
        onOpenChange(false);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddPergunta = () => {
    setSelectedPergunta(null);
    setPerguntaDialogOpen(true);
  };

  const handleEditPergunta = (pergunta: CheckinPergunta) => {
    setSelectedPergunta(pergunta);
    setPerguntaDialogOpen(true);
  };

  const handleDeletePergunta = (id: string) => {
    deletePergunta.mutate(id);
  };

  // Group questions by section
  const perguntasPorSecao = useMemo(() => {
    return perguntas?.reduce((acc, pergunta) => {
      const secao = pergunta.secao || "Geral";
      if (!acc[secao]) acc[secao] = [];
      acc[secao].push(pergunta);
      return acc;
    }, {} as Record<string, CheckinPergunta[]>) || {};
  }, [perguntas]);

  // Flat list of all questions for drag and drop
  const allPerguntasIds = useMemo(() => {
    return perguntas?.map(p => p.id) || [];
  }, [perguntas]);

  const getTipoLabel = (tipo: string) => {
    return TIPOS_PERGUNTA_CHECKIN.find(t => t.value === tipo)?.label || tipo;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !perguntas) {
      return;
    }

    const oldIndex = perguntas.findIndex(p => p.id === active.id);
    const newIndex = perguntas.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the array
    const newOrder = arrayMove(perguntas, oldIndex, newIndex);

    // Get the section of the target question (the one we're dropping onto)
    const targetSecao = perguntas[newIndex].secao;
    const movedPergunta = perguntas[oldIndex];

    // Create updates with new order and potentially new section
    const updates = newOrder.map((p, idx) => ({
      id: p.id,
      ordem: idx + 1,
      // If the moved question lands in a different section, update its section
      secao: p.id === movedPergunta.id ? targetSecao : undefined,
    }));

    reorderPerguntas.mutate(updates);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[90vh] !flex !flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isEditing ? "Editar Template de Check-in" : "Novo Template de Check-in"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Edite as informações e gerencie as perguntas do template"
                : "Crie um novo template de check-in para acompanhamento"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="space-y-6">
              {/* Basic data */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Template *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Check-in Semanal de Treino"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o objetivo deste check-in..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Templates inativos não podem ser enviados
                    </p>
                  </div>
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                </div>
              </div>

              {/* Questions - only when editing */}
              {isEditing && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Perguntas</h3>
                        <p className="text-sm text-muted-foreground">
                          {perguntas?.length || 0} perguntas no template • Arraste para reordenar
                        </p>
                      </div>
                      <Button onClick={handleAddPergunta} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Pergunta
                      </Button>
                    </div>

                    {Object.keys(perguntasPorSecao).length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <p className="text-muted-foreground text-center mb-4">
                            Nenhuma pergunta adicionada ainda
                          </p>
                          <Button onClick={handleAddPergunta} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar primeira pergunta
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={allPerguntasIds}
                          strategy={verticalListSortingStrategy}
                        >
                          {Object.entries(perguntasPorSecao).map(([secao, secaoPerguntas]) => (
                            <div key={secao} className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                                {secaoPerguntas[0]?.secao_icone && <span>{secaoPerguntas[0].secao_icone}</span>}
                                {secao}
                              </h4>
                              <div className="space-y-2">
                                {secaoPerguntas.map((pergunta) => (
                                  <SortableCheckinPergunta
                                    key={pergunta.id}
                                    pergunta={pergunta}
                                    onEdit={handleEditPergunta}
                                    onDelete={handleDeletePergunta}
                                    getTipoLabel={getTipoLabel}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isEditing ? "Fechar" : "Cancelar"}
            </Button>
            <Button onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isEditing && (
        <CheckinPerguntaFormDialog
          open={perguntaDialogOpen}
          onOpenChange={setPerguntaDialogOpen}
          templateId={template.id}
          pergunta={selectedPergunta}
          secoesExistentes={Object.keys(perguntasPorSecao)}
          proximaOrdem={(perguntas?.length || 0) + 1}
        />
      )}
    </>
  );
};
