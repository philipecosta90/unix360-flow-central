import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCheckinAgendamentos, useCheckinTemplates, FREQUENCIAS } from "@/hooks/useCheckins";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";

interface CheckinAgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CheckinAgendamentoDialog = ({
  open,
  onOpenChange,
}: CheckinAgendamentoDialogProps) => {
  const { createAgendamento } = useCheckinAgendamentos();
  const { templates } = useCheckinTemplates();
  const { data: clients } = useClients();

  const [clienteId, setClienteId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [frequencia, setFrequencia] = useState("semanal");
  const [intervaloDias, setIntervaloDias] = useState(7);
  const [proximoEnvio, setProximoEnvio] = useState<Date>(new Date());
  const [horaEnvio, setHoraEnvio] = useState("09:00");

  useEffect(() => {
    if (open) {
      setClienteId("");
      setTemplateId("");
      setFrequencia("semanal");
      setIntervaloDias(7);
      setProximoEnvio(new Date());
      setHoraEnvio("09:00");
    }
  }, [open]);

  const handleSave = async () => {
    if (!clienteId) {
      toast.error("Selecione um paciente");
      return;
    }
    if (!templateId) {
      toast.error("Selecione um template");
      return;
    }

    try {
      await createAgendamento.mutateAsync({
        cliente_id: clienteId,
        template_id: templateId,
        frequencia,
        intervalo_dias: frequencia === "personalizado" ? intervaloDias : null,
        proximo_envio: format(proximoEnvio, "yyyy-MM-dd"),
        hora_envio: horaEnvio,
        ativo: true,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const templatesAtivos = templates?.filter((t) => t.ativo) || [];
  const clientesAtivos = clients?.filter((c) => c.status === "ativo") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Agendamento de Check-in</DialogTitle>
          <DialogDescription>
            Configure o envio automático de check-ins para um paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Paciente */}
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {clientesAtivos.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clientesAtivos.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum cliente ativo encontrado
              </p>
            )}
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Template de Check-in *</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o template" />
              </SelectTrigger>
              <SelectContent>
                {templatesAtivos.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templatesAtivos.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Crie um template primeiro
              </p>
            )}
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={frequencia} onValueChange={setFrequencia}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIAS.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Intervalo personalizado */}
          {frequencia === "personalizado" && (
            <div className="space-y-2">
              <Label>Intervalo em dias</Label>
              <Input
                type="number"
                value={intervaloDias}
                onChange={(e) => setIntervaloDias(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
          )}

          {/* Próximo envio */}
          <div className="space-y-2">
            <Label>Primeiro Envio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !proximoEnvio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {proximoEnvio ? (
                    format(proximoEnvio, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecione a data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={proximoEnvio}
                  onSelect={(date) => date && setProximoEnvio(date)}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horário */}
          <div className="space-y-2">
            <Label>Horário de Envio</Label>
            <Input
              type="time"
              value={horaEnvio}
              onChange={(e) => setHoraEnvio(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={createAgendamento.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Criar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
