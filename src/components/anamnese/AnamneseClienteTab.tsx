import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnamnese, AnamneseEnvio } from "@/hooks/useAnamnese";
import { Eye, Send, RefreshCw, Loader2, Clock, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnamneseRespostasDialog } from "./AnamneseRespostasDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnamneseClienteTabProps {
  clienteId: string;
  clienteNome: string;
  clienteEmail?: string;
}

export const AnamneseClienteTab = ({ clienteId, clienteNome, clienteEmail }: AnamneseClienteTabProps) => {
  const { templates, envios, loading, fetchTemplates, fetchEnvios, sendAnamnese, resendAnamnese } = useAnamnese();
  const [selectedEnvio, setSelectedEnvio] = useState<AnamneseEnvio | null>(null);
  const [showRespostas, setShowRespostas] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchEnvios(clienteId);
  }, [fetchTemplates, fetchEnvios, clienteId]);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const handleSendAnamnese = async () => {
    if (!clienteEmail) {
      alert("O cliente não possui e-mail cadastrado.");
      return;
    }
    if (!selectedTemplateId) {
      alert("Selecione um template.");
      return;
    }

    setSending(true);
    const success = await sendAnamnese(clienteId, selectedTemplateId, clienteNome, clienteEmail);
    if (success) {
      await fetchEnvios(clienteId);
    }
    setSending(false);
  };

  const handleResend = async (envioId: string) => {
    setResending(envioId);
    await resendAnamnese(envioId);
    await fetchEnvios(clienteId);
    setResending(null);
  };

  const handleViewRespostas = (envio: AnamneseEnvio) => {
    setSelectedEnvio(envio);
    setShowRespostas(true);
  };

  const clienteEnvios = envios.filter(e => e.cliente_id === clienteId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preenchido":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Preenchido
          </Badge>
        );
      case "pendente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "expirado":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Expirado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Enviar nova anamnese */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#43B26D]" />
            Enviar Anamnese
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!clienteEmail ? (
            <p className="text-sm text-muted-foreground">
              Este cliente não possui e-mail cadastrado. Adicione um e-mail para enviar a anamnese.
            </p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum template de anamnese disponível. Crie um na aba Anamnese.
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSendAnamnese}
                disabled={sending || !selectedTemplateId}
                className="bg-[#43B26D] hover:bg-[#37A05B]"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de envios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Histórico de Envios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clienteEnvios.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma anamnese enviada para este cliente.
            </p>
          ) : (
            <div className="space-y-3">
              {clienteEnvios.map((envio) => (
                <div
                  key={envio.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{envio.template?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviado em {format(new Date(envio.enviado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {envio.preenchido_em && (
                      <p className="text-xs text-green-600">
                        Preenchido em {format(new Date(envio.preenchido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(envio.status)}
                    {envio.status === "preenchido" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRespostas(envio)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    )}
                    {(envio.status === "pendente" || envio.status === "expirado") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(envio.id)}
                        disabled={resending === envio.id}
                      >
                        {resending === envio.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reenviar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEnvio && (
        <AnamneseRespostasDialog
          open={showRespostas}
          onOpenChange={setShowRespostas}
          envio={selectedEnvio}
        />
      )}
    </div>
  );
};
