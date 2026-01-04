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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, GripVertical, Pencil } from "lucide-react";
import { useAnamnese, AnamneseTemplate, AnamnesePergunta } from "@/hooks/useAnamnese";
import { AnamnesePerguntaFormDialog } from "./AnamnesePerguntaFormDialog";
import { ClientPagePreview } from "@/components/common/ClientPagePreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AnamneseTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: AnamneseTemplate | null;
  onSuccess?: () => void;
}

export function AnamneseTemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: AnamneseTemplateFormDialogProps) {
  const {
    createTemplate,
    updateTemplate,
    fetchPerguntas,
    addPergunta,
    updatePergunta,
    deletePergunta,
  } = useAnamnese();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [perguntas, setPerguntas] = useState<AnamnesePergunta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Dialog para pergunta
  const [perguntaDialogOpen, setPerguntaDialogOpen] = useState(false);
  const [editingPergunta, setEditingPergunta] = useState<AnamnesePergunta | null>(null);
  const [defaultSecao, setDefaultSecao] = useState("");

  // Dialog de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [perguntaToDelete, setPerguntaToDelete] = useState<AnamnesePergunta | null>(null);

  const isEditing = !!template;

  useEffect(() => {
    if (open && template) {
      setNome(template.nome);
      setDescricao(template.descricao || "");
      setTemplateId(template.id);
      loadPerguntas(template.id);
    } else if (open && !template) {
      setNome("");
      setDescricao("");
      setPerguntas([]);
      setTemplateId(null);
    }
  }, [open, template]);

  const loadPerguntas = async (id: string) => {
    setLoadingPerguntas(true);
    const data = await fetchPerguntas(id);
    setPerguntas(data);
    setLoadingPerguntas(false);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;

    setLoading(true);
    try {
      if (isEditing && template) {
        await updateTemplate(template.id, { nome, descricao });
      } else {
        const novoTemplate = await createTemplate(nome, descricao);
        if (novoTemplate) {
          setTemplateId(novoTemplate.id);
        }
      }
      onSuccess?.();
      if (!isEditing) {
        // Mantém aberto para adicionar perguntas se for novo
      } else {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPergunta = (secao?: string) => {
    setEditingPergunta(null);
    setDefaultSecao(secao || "");
    setPerguntaDialogOpen(true);
  };

  const handleEditPergunta = (pergunta: AnamnesePergunta) => {
    setEditingPergunta(pergunta);
    setDefaultSecao(pergunta.secao);
    setPerguntaDialogOpen(true);
  };

  const handleDeletePergunta = (pergunta: AnamnesePergunta) => {
    setPerguntaToDelete(pergunta);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePergunta = async () => {
    if (!perguntaToDelete) return;
    
    const success = await deletePergunta(perguntaToDelete.id);
    if (success && templateId) {
      await loadPerguntas(templateId);
    }
    setDeleteDialogOpen(false);
    setPerguntaToDelete(null);
  };

  const handlePerguntaSave = async (data: {
    secao: string;
    secao_icone?: string;
    pergunta: string;
    tipo: string;
    obrigatoria: boolean;
    placeholder?: string;
    opcoes?: string[];
  }) => {
    if (!templateId) return;

    if (editingPergunta) {
      await updatePergunta(editingPergunta.id, data);
    } else {
      const maxOrdem = perguntas.length > 0 
        ? Math.max(...perguntas.map(p => p.ordem)) 
        : 0;
      await addPergunta(templateId, { ...data, ordem: maxOrdem + 1 });
    }

    await loadPerguntas(templateId);
    setPerguntaDialogOpen(false);
  };

  // Agrupar perguntas por seção
  const secoes = perguntas.reduce((acc, p) => {
    if (!acc[p.secao]) {
      acc[p.secao] = { icone: p.secao_icone, perguntas: [] };
    }
    acc[p.secao].perguntas.push(p);
    return acc;
  }, {} as Record<string, { icone: string | null; perguntas: AnamnesePergunta[] }>);

  const tipoLabel: Record<string, string> = {
    text: "Texto",
    textarea: "Texto longo",
    number: "Número",
    date: "Data",
    email: "E-mail",
    select: "Seleção",
  };

  // Prepare questions for preview
  const previewPerguntas = perguntas.map(p => ({
    id: p.id,
    secao: p.secao,
    secao_icone: p.secao_icone,
    pergunta: p.pergunta,
    tipo: p.tipo,
    obrigatoria: p.obrigatoria,
  }));

  const hasQuestions = templateId && perguntas.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${hasQuestions ? "max-w-6xl" : "max-w-3xl"} h-[90vh] !flex !flex-col`}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isEditing ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite as informações do template e suas perguntas."
                : "Crie um novo template de anamnese personalizado."}
            </DialogDescription>
          </DialogHeader>

          <div className={`flex-1 min-h-0 ${hasQuestions ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}`}>
            {/* Form Column */}
            <ScrollArea className="flex-1 min-h-0 pr-4">
              <div className="space-y-4">
                {/* Dados básicos do template */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Template *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Anamnese Nutricional"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição/Mensagem de Boas-vindas</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Mensagem exibida ao cliente no início do questionário..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Seção de perguntas - só aparece se já salvou o template */}
                {templateId && (
                  <div className="border rounded-lg">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                      <h3 className="font-semibold text-sm">Perguntas</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddPergunta()}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Pergunta
                      </Button>
                    </div>

                    <div className="p-3">
                      {loadingPerguntas ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : Object.keys(secoes).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">Nenhuma pergunta cadastrada.</p>
                          <p className="text-xs mt-1">Clique em "Nova Pergunta" para começar.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(secoes).map(([secao, { icone, perguntas: perguntasSecao }]) => (
                            <div key={secao} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  {icone && <span>{icone}</span>}
                                  {secao}
                                  <Badge variant="secondary" className="text-xs">
                                    {perguntasSecao.length}
                                  </Badge>
                                </h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => handleAddPergunta(secao)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar
                                </Button>
                              </div>
                              <div className="space-y-1 pl-2 border-l-2 border-muted">
                                {perguntasSecao
                                  .sort((a, b) => a.ordem - b.ordem)
                                  .map((pergunta) => (
                                    <div
                                      key={pergunta.id}
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{pergunta.pergunta}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <Badge variant="outline" className="text-xs">
                                            {tipoLabel[pergunta.tipo] || pergunta.tipo}
                                          </Badge>
                                          {pergunta.obrigatoria && (
                                            <span className="text-xs text-destructive">Obrigatória</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => handleEditPergunta(pergunta)}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7 text-destructive hover:text-destructive"
                                          onClick={() => handleDeletePergunta(pergunta)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Preview Column - Only show when editing with questions */}
            {hasQuestions && (
              <div className="hidden lg:block border-l pl-4">
                <ClientPagePreview
                  tipo="anamnese"
                  templateNome={nome}
                  templateDescricao={descricao}
                  perguntas={previewPerguntas}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {templateId ? "Fechar" : "Cancelar"}
            </Button>
            {!templateId && (
              <Button onClick={handleSave} disabled={loading || !nome.trim()}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Template
              </Button>
            )}
            {templateId && (
              <Button onClick={handleSave} disabled={loading || !nome.trim()}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar/editar pergunta */}
      <AnamnesePerguntaFormDialog
        open={perguntaDialogOpen}
        onOpenChange={setPerguntaDialogOpen}
        pergunta={editingPergunta}
        defaultSecao={defaultSecao}
        secoesExistentes={Object.keys(secoes)}
        onSave={handlePerguntaSave}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePergunta} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
