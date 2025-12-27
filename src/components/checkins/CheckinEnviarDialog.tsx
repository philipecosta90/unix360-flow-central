import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, Send, User, FileText } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useCheckinTemplates } from "@/hooks/useCheckins";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckinEnviarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CheckinEnviarDialog = ({
  open,
  onOpenChange,
}: CheckinEnviarDialogProps) => {
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { templates, isLoading: isLoadingTemplates } = useCheckinTemplates();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  const activeClients = clients?.filter((c) => c.status === "ativo") || [];
  const activeTemplates = templates?.filter((t) => t.ativo) || [];

  const selectedClient = clients?.find((c) => c.id === selectedClientId);

  const handleEnviar = async () => {
    if (!selectedClientId || !selectedTemplateId) {
      toast.error("Selecione um paciente e um template");
      return;
    }

    const client = clients?.find((c) => c.id === selectedClientId);
    if (!client) {
      toast.error("Paciente não encontrado");
      return;
    }

    if (!client.telefone) {
      toast.error("Este paciente não possui telefone cadastrado");
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-checkin-whatsapp",
        {
          body: {
            clienteId: selectedClientId,
            templateId: selectedTemplateId,
            clienteNome: client.nome,
            clienteTelefone: client.telefone,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success("Check-in enviado com sucesso via WhatsApp!");
        onOpenChange(false);
        setSelectedClientId("");
        setSelectedTemplateId("");
      } else {
        toast.error(data?.message || "Erro ao enviar check-in");
      }
    } catch (error: any) {
      console.error("Erro ao enviar check-in:", error);
      toast.error(error.message || "Erro ao enviar check-in via WhatsApp");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onOpenChange(false);
      setSelectedClientId("");
      setSelectedTemplateId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Enviar Check-in via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envie um check-in avulso para um paciente via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cliente" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Paciente
            </Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={isLoadingClients}
            >
              <SelectTrigger id="cliente">
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {activeClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex flex-col">
                      <span>{client.nome}</span>
                      {client.telefone && (
                        <span className="text-xs text-muted-foreground">
                          {client.telefone}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClient && !selectedClient.telefone && (
              <p className="text-xs text-destructive">
                Este paciente não possui telefone cadastrado
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="template" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template de Check-in
            </Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={isLoadingTemplates}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeTemplates.length === 0 && !isLoadingTemplates && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum template de check-in ativo. Crie um template primeiro.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={
              isSending ||
              !selectedClientId ||
              !selectedTemplateId ||
              !selectedClient?.telefone
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar via WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
