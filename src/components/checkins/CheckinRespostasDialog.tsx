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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CheckinEnvio, CheckinResposta, getIndicadorVisual } from "@/hooks/useCheckins";
import { Loader2, CheckCircle2, Calendar, FileDown, Save, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CheckinRespostasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envio: CheckinEnvio | null;
}

export const CheckinRespostasDialog = ({
  open,
  onOpenChange,
  envio,
}: CheckinRespostasDialogProps) => {
  const [respostas, setRespostas] = useState<CheckinResposta[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [anotacoes, setAnotacoes] = useState("");
  const [revisado, setRevisado] = useState(false);

  useEffect(() => {
    if (open && envio?.id) {
      fetchRespostas();
      setAnotacoes(envio.anotacoes_profissional || "");
      setRevisado(envio.revisado || false);
    }
  }, [open, envio?.id]);

  const fetchRespostas = async () => {
    if (!envio?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("checkin_respostas")
        .select(`
          *,
          pergunta:checkin_perguntas(*)
        `)
        .eq("envio_id", envio.id)
        .order("created_at");

      if (error) throw error;
      setRespostas(data as CheckinResposta[]);
    } catch (err) {
      console.error("Erro ao buscar respostas:", err);
      toast.error("Erro ao carregar respostas");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnotacoes = async () => {
    if (!envio?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("checkin_envios")
        .update({
          anotacoes_profissional: anotacoes,
          revisado: revisado,
        })
        .eq("id", envio.id);

      if (error) throw error;
      toast.success("Anotações salvas!");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast.error("Erro ao salvar anotações");
    } finally {
      setSaving(false);
    }
  };

  const handleMarcarRevisado = async () => {
    if (!envio?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("checkin_envios")
        .update({
          revisado: true,
          anotacoes_profissional: anotacoes,
        })
        .eq("id", envio.id);

      if (error) throw error;
      setRevisado(true);
      toast.success("Check-in marcado como revisado!");
    } catch (err) {
      console.error("Erro ao marcar revisado:", err);
      toast.error("Erro ao marcar como revisado");
    } finally {
      setSaving(false);
    }
  };

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
  }, {} as Record<string, { icone: string | null | undefined; respostas: CheckinResposta[] }>);

  // Ordenar respostas por ordem da pergunta
  Object.values(respostasPorSecao).forEach((data) => {
    data.respostas.sort((a, b) => (a.pergunta?.ordem || 0) - (b.pergunta?.ordem || 0));
  });

  const indicadorGeral = envio ? getIndicadorVisual(envio.pontuacao_total, envio.pontuacao_maxima) : null;

  const getIndicadorBadge = (indicador: string | null) => {
    switch (indicador) {
      case "verde":
        return <Badge className="bg-green-100 text-green-700 border-green-200">✅ Bom</Badge>;
      case "amarelo":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">⚠️ Atenção</Badge>;
      case "vermelho":
        return <Badge className="bg-red-100 text-red-700 border-red-200">🚨 Alerta</Badge>;
      default:
        return null;
    }
  };

  if (!envio) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Respostas do Check-in
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Info do paciente e pontuação geral */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-lg">{envio.cliente?.nome}</p>
              <p className="text-sm text-muted-foreground">{envio.template?.nome}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {envio.respondido_em && (
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(envio.respondido_em), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </Badge>
              )}
              {envio.pontuacao_maxima > 0 && indicadorGeral && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{indicadorGeral.emoji}</span>
                  <span className="font-bold text-lg">
                    {envio.pontuacao_total}/{envio.pontuacao_maxima}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      indicadorGeral.cor === "verde"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : indicadorGeral.cor === "amarelo"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {indicadorGeral.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-4">
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground">
                            {resposta.pergunta?.pergunta}
                          </p>
                          {resposta.pontuacao !== null && resposta.pontuacao > 0 && (
                            <div className="flex items-center gap-2">
                              {getIndicadorBadge(resposta.indicador_visual)}
                              <span className="text-sm font-medium">
                                {resposta.pontuacao}/{resposta.pergunta?.pontos_maximo || 5} pts
                              </span>
                            </div>
                          )}
                        </div>
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

        {/* Anotações do profissional */}
        <Separator className="my-2" />
        <div className="space-y-3 flex-shrink-0">
          <Label htmlFor="anotacoes" className="text-sm font-medium">
            Anotações do Profissional
          </Label>
          <Textarea
            id="anotacoes"
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            placeholder="Adicione suas observações sobre este check-in..."
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {revisado && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Revisado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAnotacoes}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
              {!revisado && (
                <Button
                  size="sm"
                  onClick={handleMarcarRevisado}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCheck className="h-4 w-4 mr-1" />}
                  Marcar como Revisado
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
