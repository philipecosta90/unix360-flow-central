import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus, 
  Utensils,
  Flame,
  Target
} from 'lucide-react';
import { useDietas } from '@/hooks/useDietas';
import { DietaTemplate } from '@/types/dieta';
import { DietaTemplateDetailDialog } from './DietaTemplateDetailDialog';
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

interface DietaTemplatesListProps {
  templates: DietaTemplate[];
  onNewTemplate: () => void;
}

export const DietaTemplatesList = ({ templates, onNewTemplate }: DietaTemplatesListProps) => {
  const { deleteTemplate } = useDietas();
  const [selectedTemplate, setSelectedTemplate] = useState<DietaTemplate | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate(templateToDelete);
      setShowDeleteAlert(false);
      setTemplateToDelete(null);
    }
  };

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum template criado</h3>
          <p className="text-muted-foreground text-center mb-4">
            Crie templates de dieta reutilizáveis para agilizar seu trabalho
          </p>
          <Button onClick={onNewTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Template
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedTemplate(template);
              setShowDetailDialog(true);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.nome}</CardTitle>
                  {template.objetivo && (
                    <Badge variant="secondary" className="mt-1">
                      <Target className="h-3 w-3 mr-1" />
                      {template.objetivo}
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                      setShowDetailDialog(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplateToDelete(template.id);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {template.descricao && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {template.descricao}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 text-xs">
                {template.calorias_total && (
                  <Badge variant="outline">
                    <Flame className="h-3 w-3 mr-1" />
                    {template.calorias_total} kcal
                  </Badge>
                )}
                <Badge variant="outline">
                  {template.refeicoes?.length || 0} refeições
                </Badge>
              </div>
              
              {(template.proteinas_g || template.carboidratos_g || template.gorduras_g) && (
                <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                  {template.proteinas_g && <span>P: {template.proteinas_g}g</span>}
                  {template.carboidratos_g && <span>C: {template.carboidratos_g}g</span>}
                  {template.gorduras_g && <span>G: {template.gorduras_g}g</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <DietaTemplateDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        template={selectedTemplate}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
