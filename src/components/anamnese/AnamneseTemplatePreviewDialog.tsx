import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAnamnese, AnamneseTemplate, AnamnesePergunta } from "@/hooks/useAnamnese";
import { Loader2 } from "lucide-react";

interface AnamneseTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AnamneseTemplate;
}

export const AnamneseTemplatePreviewDialog = ({
  open,
  onOpenChange,
  template,
}: AnamneseTemplatePreviewDialogProps) => {
  const { fetchPerguntas, loading } = useAnamnese();
  const [perguntas, setPerguntas] = useState<AnamnesePergunta[]>([]);

  useEffect(() => {
    if (open && template.id) {
      fetchPerguntas(template.id).then((data) => setPerguntas(data as AnamnesePergunta[]));
    }
  }, [open, template.id, fetchPerguntas]);

  // Agrupar perguntas por seção
  const perguntasPorSecao = perguntas.reduce((acc, pergunta) => {
    const secao = pergunta.secao;
    if (!acc[secao]) {
      acc[secao] = {
        icone: pergunta.secao_icone,
        perguntas: [],
      };
    }
    acc[secao].perguntas.push(pergunta);
    return acc;
  }, {} as Record<string, { icone: string | null; perguntas: AnamnesePergunta[] }>);

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      text: "Texto curto",
      textarea: "Texto longo",
      number: "Número",
      date: "Data",
      email: "E-mail",
      select: "Seleção",
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{template.nome}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {template.descricao && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-line">{template.descricao}</p>
                </div>
              )}

              {Object.entries(perguntasPorSecao).map(([secao, data], index) => (
                <div key={secao}>
                  {index > 0 && <Separator className="my-4" />}
                  
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    {data.icone && <span>{data.icone}</span>}
                    {secao}
                    <Badge variant="secondary" className="ml-2">
                      {data.perguntas.length} perguntas
                    </Badge>
                  </h3>

                  <div className="space-y-3">
                    {data.perguntas.map((pergunta) => (
                      <div
                        key={pergunta.id}
                        className="bg-card border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {pergunta.pergunta}
                              {pergunta.obrigatoria && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </p>
                            {pergunta.placeholder && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Placeholder: {pergunta.placeholder}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getTipoLabel(pergunta.tipo)}
                          </Badge>
                        </div>

                        {pergunta.opcoes && Array.isArray(pergunta.opcoes) && pergunta.opcoes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(pergunta.opcoes as Json[]).map((opcao, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {String(opcao)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {perguntas.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pergunta cadastrada neste template.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
