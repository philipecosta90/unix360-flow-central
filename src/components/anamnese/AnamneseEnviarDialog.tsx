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
import { Send, User, Phone, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AnamneseTemplate } from "@/hooks/useAnamnese";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone?: string | null;
  status: string;
}

interface AnamneseEnviarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  templates: AnamneseTemplate[];
}

export const AnamneseEnviarDialog = ({
  open,
  onOpenChange,
  cliente,
  templates,
}: AnamneseEnviarDialogProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!cliente || !selectedTemplateId) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-anamnese-whatsapp", {
        body: {
          clienteId: cliente.id,
          templateId: selectedTemplateId,
          clienteNome: cliente.nome,
          clienteTelefone: cliente.telefone,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Anamnese enviada!",
          description: `Questionário enviado para ${cliente.nome} via WhatsApp.`,
        });
        onOpenChange(false);
        setSelectedTemplateId("");
      } else {
        toast({
          title: "Atenção",
          description: data?.message || "Não foi possível enviar a anamnese.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao enviar anamnese:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a anamnese. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!sending) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setSelectedTemplateId("");
      }
    }
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-lime-500" />
            Enviar Anamnese via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Selecione o template de anamnese para enviar ao cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do cliente */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{cliente.nome}</span>
            </div>
            {cliente.telefone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{cliente.telefone}</span>
              </div>
            )}
          </div>

          {/* Seleção de template */}
          <div className="space-y-2">
            <Label htmlFor="template" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template de Anamnese
            </Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-sm text-amber-600">
                Nenhum template disponível. Crie um na aba "Templates".
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedTemplateId || sending}
            className="bg-lime-600 hover:bg-lime-700"
          >
            {sending ? (
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
