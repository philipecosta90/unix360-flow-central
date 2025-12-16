import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnamnese, AnamneseTemplate } from "@/hooks/useAnamnese";
import { Eye, Plus, FileText, Loader2 } from "lucide-react";
import { AnamneseTemplatePreviewDialog } from "./AnamneseTemplatePreviewDialog";

export const AnamneseTemplates = () => {
  const { templates, loading, fetchTemplates, createDefaultTemplate } = useAnamnese();
  const [selectedTemplate, setSelectedTemplate] = useState<AnamneseTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [creatingDefault, setCreatingDefault] = useState(false);

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

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Crie seu primeiro template de anamnese para começar a enviar questionários para seus clientes.
            </p>
            <Button 
              onClick={handleCreateDefault}
              disabled={creatingDefault}
              className="bg-[#43B26D] hover:bg-[#37A05B]"
            >
              {creatingDefault ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template Padrão Fitness
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.nome}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {template.descricao?.substring(0, 100)}...
                    </CardDescription>
                  </div>
                  <Badge variant={template.ativo ? "default" : "secondary"}>
                    {template.ativo ? "Ativo" : "Inativo"}
                  </Badge>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTemplate && (
        <AnamneseTemplatePreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          template={selectedTemplate}
        />
      )}
    </div>
  );
};
