import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCheckinPerguntas, CheckinTemplate, CheckinPergunta, TIPOS_PERGUNTA_CHECKIN } from "@/hooks/useCheckins";
import { Loader2 } from "lucide-react";

interface CheckinTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CheckinTemplate | null;
}

export const CheckinTemplatePreviewDialog = ({
  open,
  onOpenChange,
  template,
}: CheckinTemplatePreviewDialogProps) => {
  const { perguntas, isLoading } = useCheckinPerguntas(open && template ? template.id : null);

  // Agrupar perguntas por seção
  const perguntasPorSecao = (perguntas || []).reduce((acc, pergunta) => {
    const secao = pergunta.secao;
    if (!acc[secao]) {
      acc[secao] = {
        icone: pergunta.secao_icone,
        perguntas: [],
      };
    }
    acc[secao].perguntas.push(pergunta);
    return acc;
  }, {} as Record<string, { icone: string | null; perguntas: CheckinPergunta[] }>);

  const getTipoLabel = (tipo: string) => {
    const found = TIPOS_PERGUNTA_CHECKIN.find(t => t.value === tipo);
    return found?.label || tipo;
  };

  const getPontuacaoTotal = () => {
    return (perguntas || []).reduce((sum, p) => sum + (p.pontos_maximo || 0), 0);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{template.nome}</DialogTitle>
            <Badge variant="outline" className="shrink-0">
              Máx: {getPontuacaoTotal()} pts
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
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
                      {data.perguntas.length} {data.perguntas.length === 1 ? 'pergunta' : 'perguntas'}
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
                          <div className="flex items-center gap-2 shrink-0">
                            {pergunta.pontos_maximo > 0 && (
                              <Badge variant="default" className="text-xs">
                                {pergunta.pontos_maximo} pts
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {getTipoLabel(pergunta.tipo)}
                            </Badge>
                          </div>
                        </div>

                        {pergunta.opcoes_pontuacao && Object.keys(pergunta.opcoes_pontuacao).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(pergunta.opcoes_pontuacao).map(([label, pontos], i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {label} ({pontos}pts)
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {(!perguntas || perguntas.length === 0) && (
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
