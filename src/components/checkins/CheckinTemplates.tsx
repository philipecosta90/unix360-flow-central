import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  MoreVertical,
  Copy,
  Eye,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useCheckinTemplates, CheckinTemplate } from "@/hooks/useCheckins";
import { CheckinTemplateFormDialog } from "./CheckinTemplateFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const CheckinTemplates = () => {
  const { templates, isLoading, deleteTemplate, createDefaultTemplate, duplicateTemplate } = useCheckinTemplates();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CheckinTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleCreateDefault = () => {
    createDefaultTemplate.mutate();
  };

  const handleDuplicate = (templateId: string) => {
    duplicateTemplate.mutate(templateId);
  };

  const handleEdit = (template: CheckinTemplate) => {
    setSelectedTemplate(template);
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Crie templates de check-in personalizados com perguntas pontuadas
        </p>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {templates?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Comece usando nosso modelo padrão ou crie seu próprio template personalizado
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleCreateDefault} 
                disabled={createDefaultTemplate.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {createDefaultTemplate.isPending ? "Criando..." : "Usar Template Padrão"}
              </Button>
              <Button variant="outline" onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar do Zero
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card 
              key={template.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEdit(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {template.nome}
                    </CardTitle>
                    <Badge 
                      variant={template.ativo ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {template.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(template); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(template.id); }}
                        disabled={duplicateTemplate.isPending}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {duplicateTemplate.isPending ? "Duplicando..." : "Duplicar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(template.id); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {template.descricao || "Sem descrição"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Criado em {format(new Date(template.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CheckinTemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={selectedTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as perguntas e histórico
              de envios serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
