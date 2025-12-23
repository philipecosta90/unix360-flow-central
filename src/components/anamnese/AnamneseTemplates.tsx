import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnamnese, AnamneseTemplate } from "@/hooks/useAnamnese";
import { Eye, Plus, FileText, Loader2, Pencil, Copy, Trash2, MoreVertical } from "lucide-react";
import { AnamneseTemplatePreviewDialog } from "./AnamneseTemplatePreviewDialog";
import { AnamneseTemplateFormDialog } from "./AnamneseTemplateFormDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AnamneseTemplates = () => {
  const { templates, loading, fetchTemplates, createDefaultTemplate, deleteTemplate, duplicateTemplate } = useAnamnese();
  const [selectedTemplate, setSelectedTemplate] = useState<AnamneseTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [creatingDefault, setCreatingDefault] = useState(false);

  // Dialog de formulário
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AnamneseTemplate | null>(null);

  // Dialog de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<AnamneseTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Dialog de duplicação
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<AnamneseTemplate | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateDefault = async () => {
    setCreatingDefault(true);
    await createDefaultTemplate();
    setCreatingDefault(false);
  };

  const handlePreview = (template: AnamneseTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormDialogOpen(true);
  };

  const handleEditTemplate = (template: AnamneseTemplate) => {
    setEditingTemplate(template);
    setFormDialogOpen(true);
  };

  const handleDuplicateClick = (template: AnamneseTemplate) => {
    setTemplateToDuplicate(template);
    setDuplicateName(`${template.nome} (Cópia)`);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicate = async () => {
    if (!templateToDuplicate || !duplicateName.trim()) return;
    
    setDuplicating(true);
    await duplicateTemplate(templateToDuplicate.id, duplicateName.trim());
    setDuplicating(false);
    setDuplicateDialogOpen(false);
    setTemplateToDuplicate(null);
  };

  const handleDeleteClick = (template: AnamneseTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    setDeleting(true);
    await deleteTemplate(templateToDelete.id);
    setDeleting(false);
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleFormSuccess = () => {
    fetchTemplates();
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex flex-wrap gap-2 justify-end">
        {templates.length === 0 && (
          <Button 
            onClick={handleCreateDefault}
            disabled={creatingDefault}
            variant="outline"
          >
            {creatingDefault ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Criar Template Padrão Fitness
              </>
            )}
          </Button>
        )}
        <Button onClick={handleNewTemplate} className="bg-[#43B26D] hover:bg-[#37A05B]">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Crie seu primeiro template de anamnese para começar a enviar questionários para seus clientes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <CardTitle className="text-lg truncate">{template.nome}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {template.descricao?.substring(0, 100)}
                      {template.descricao && template.descricao.length > 100 ? "..." : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={template.ativo ? "default" : "secondary"}>
                      {template.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateClick(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(template)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      {selectedTemplate && (
        <AnamneseTemplatePreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          template={selectedTemplate}
        />
      )}

      {/* Form Dialog (Criar/Editar) */}
      <AnamneseTemplateFormDialog
        key={editingTemplate?.id || "new"}
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.nome}"? 
              Esta ação irá remover todas as perguntas associadas e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Template</DialogTitle>
            <DialogDescription>
              Uma cópia do template "{templateToDuplicate?.nome}" será criada com todas as perguntas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">Nome do novo template</Label>
            <Input
              id="duplicate-name"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="Nome do template"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)} disabled={duplicating}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating || !duplicateName.trim()}>
              {duplicating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Duplicando...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
