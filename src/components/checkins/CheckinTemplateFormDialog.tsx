import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit,
  Save
} from "lucide-react";
import {
  useCheckinTemplates,
  useCheckinPerguntas,
  CheckinTemplate,
  CheckinPergunta,
  TIPOS_PERGUNTA_CHECKIN,
} from "@/hooks/useCheckins";
import { CheckinPerguntaFormDialog } from "./CheckinPerguntaFormDialog";
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
  const { perguntas, deletePergunta } = useCheckinPerguntas(template?.id || null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [perguntaDialogOpen, setPerguntaDialogOpen] = useState(false);
  const [selectedPergunta, setSelectedPergunta] = useState<CheckinPergunta | null>(null);

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

  // Agrupar perguntas por seção
  const perguntasPorSecao = perguntas?.reduce((acc, pergunta) => {
    const secao = pergunta.secao || "Geral";
    if (!acc[secao]) acc[secao] = [];
    acc[secao].push(pergunta);
    return acc;
  }, {} as Record<string, CheckinPergunta[]>) || {};

  const getTipoLabel = (tipo: string) => {
    return TIPOS_PERGUNTA_CHECKIN.find(t => t.value === tipo)?.label || tipo;
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
              {/* Dados básicos */}
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

              {/* Perguntas - apenas se estiver editando */}
              {isEditing && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Perguntas</h3>
                        <p className="text-sm text-muted-foreground">
                          {perguntas?.length || 0} perguntas no template
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
                      Object.entries(perguntasPorSecao).map(([secao, perguntas]) => (
                        <div key={secao} className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                            {perguntas[0]?.secao_icone && <span>{perguntas[0].secao_icone}</span>}
                            {secao}
                          </h4>
                          <div className="space-y-2">
                            {perguntas.map((pergunta) => (
                              <Card key={pergunta.id} className="group">
                                <CardContent className="p-3 flex items-center gap-3">
                                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{pergunta.pergunta}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {getTipoLabel(pergunta.tipo)}
                                      </Badge>
                                      {pergunta.pontos_maximo > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {pergunta.pontos_maximo} pts
                                        </Badge>
                                      )}
                                      {pergunta.obrigatoria && (
                                        <Badge className="text-xs bg-primary/10 text-primary">
                                          Obrigatória
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditPergunta(pergunta)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeletePergunta(pergunta.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))
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
