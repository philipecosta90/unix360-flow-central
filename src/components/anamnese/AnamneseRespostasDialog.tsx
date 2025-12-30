import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAnamnese, AnamneseEnvio, AnamneseResposta } from "@/hooks/useAnamnese";
import { Loader2, CheckCircle2, Calendar, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportAnamneseToPDF } from "@/utils/anamneseExport";

interface AnamneseRespostasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envio: AnamneseEnvio;
}

export const AnamneseRespostasDialog = ({
  open,
  onOpenChange,
  envio,
}: AnamneseRespostasDialogProps) => {
  const { fetchRespostas, loading } = useAnamnese();
  const [respostas, setRespostas] = useState<AnamneseResposta[]>([]);

  useEffect(() => {
    if (open && envio.id) {
      fetchRespostas(envio.id).then((data) => setRespostas(data as AnamneseResposta[]));
    }
  }, [open, envio.id, fetchRespostas]);

  // Agrupar respostas por seção
  const respostasPorSecao = respostas.reduce((acc, resposta) => {
    const secao = resposta.pergunta?.secao || "Outros";
    if (!acc[secao]) {
      acc[secao] = {
        icone: resposta.pergunta?.secao_icone,
        respostas: [],
      };
    }
    acc[secao].respostas.push(resposta);
    return acc;
  }, {} as Record<string, { icone: string | null | undefined; respostas: AnamneseResposta[] }>);

  // Ordenar respostas por ordem da pergunta
  Object.values(respostasPorSecao).forEach((data) => {
    data.respostas.sort((a, b) => (a.pergunta?.ordem || 0) - (b.pergunta?.ordem || 0));
  });

  const handleExportPDF = () => {
    exportAnamneseToPDF(envio, respostas);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Respostas da Anamnese
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={loading || respostas.length === 0}
              className="mr-6"
            >
              <FileDown className="h-4 w-4 mr-1" />
              Exportar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-medium">{envio.cliente?.nome}</p>
              <p className="text-sm text-muted-foreground">{envio.cliente?.email}</p>
            </div>
            {envio.preenchido_em && (
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                <Calendar className="h-3 w-3" />
                Preenchido em{" "}
                {format(new Date(envio.preenchido_em), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="h-[55vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(respostasPorSecao).map(([secao, data], index) => (
                <div key={secao}>
                  {index > 0 && <Separator className="my-4" />}

                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    {data.icone && <span>{data.icone}</span>}
                    {secao}
                  </h3>

                  <div className="space-y-4">
                    {data.respostas.map((resposta) => (
                      <div key={resposta.id} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {resposta.pergunta?.pergunta}
                        </p>
                        <div className="bg-card border rounded-lg p-3">
                          <p className="whitespace-pre-wrap">
                            {resposta.resposta || (
                              <span className="text-muted-foreground italic">
                                Não respondido
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {respostas.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma resposta encontrada.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
