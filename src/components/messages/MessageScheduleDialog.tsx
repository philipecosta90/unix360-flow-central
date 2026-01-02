import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Users, Clock, Gift, Calendar, Repeat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { WhatsAppMessage } from '@/hooks/useWhatsAppMessages';
import { CreateScheduleData } from '@/hooks/useMessageSchedules';

interface MessageScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: WhatsAppMessage[];
  onSave: (data: CreateScheduleData) => Promise<boolean>;
  saving: boolean;
}

const SCHEDULE_TYPES = [
  {
    value: 'aniversario',
    label: 'Aniversário',
    icon: Gift,
    description: 'Envia automaticamente no aniversário de cada cliente',
  },
  {
    value: 'unico',
    label: 'Data Única',
    icon: Calendar,
    description: 'Envio único em uma data específica',
  },
  {
    value: 'data_fixa',
    label: 'Data Fixa Anual',
    icon: Repeat,
    description: 'Repete todo ano na mesma data (ex: Natal, Ano Novo)',
  },
];

const COMMON_DATES = [
  { label: 'Ano Novo', value: '01-01' },
  { label: 'Dia das Mães', value: '12-05' },
  { label: 'Dia dos Pais', value: '11-08' },
  { label: 'Dia do Cliente', value: '15-09' },
  { label: 'Natal', value: '25-12' },
];

const CLIENT_FILTERS = [
  { value: 'ativo', label: 'Clientes Ativos' },
  { value: 'lead', label: 'Leads' },
  { value: 'prospecto', label: 'Prospectos' },
];

export const MessageScheduleDialog = ({
  open,
  onOpenChange,
  messages,
  onSave,
  saving,
}: MessageScheduleDialogProps) => {
  const [tipo, setTipo] = useState<string>('aniversario');
  const [mensagemId, setMensagemId] = useState<string>('');
  const [dataEnvio, setDataEnvio] = useState<string>('');
  const [diaMes, setDiaMes] = useState<string>('');
  const [horaEnvio, setHoraEnvio] = useState<string>('09:00');
  const [statusFilter, setStatusFilter] = useState<string[]>(['ativo']);

  useEffect(() => {
    if (open && messages.length > 0 && !mensagemId) {
      setMensagemId(messages[0].id);
    }
  }, [open, messages, mensagemId]);

  const handleSave = async () => {
    if (!mensagemId) return;

    const data: CreateScheduleData = {
      mensagem_id: mensagemId,
      tipo_agendamento: tipo as any,
      hora_envio: horaEnvio,
      filtro_clientes: { status: statusFilter },
    };

    if (tipo === 'unico') {
      data.data_envio = dataEnvio || null;
    } else if (tipo === 'data_fixa') {
      data.dia_mes = diaMes || null;
    }

    const success = await onSave(data);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setTipo('aniversario');
    setMensagemId('');
    setDataEnvio('');
    setDiaMes('');
    setHoraEnvio('09:00');
    setStatusFilter(['ativo']);
    onOpenChange(false);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const selectedMessage = messages.find((m) => m.id === mensagemId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Agendar Envio de Mensagem
          </DialogTitle>
          <DialogDescription>
            Configure quando e para quem a mensagem será enviada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de mensagem */}
          <div className="space-y-2">
            <Label>Mensagem a enviar</Label>
            <Select value={mensagemId} onValueChange={setMensagemId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma mensagem" />
              </SelectTrigger>
              <SelectContent>
                {messages.map((msg) => (
                  <SelectItem key={msg.id} value={msg.id}>
                    <div className="flex items-center gap-2">
                      <span>{msg.icone || '📩'}</span>
                      <span>{msg.titulo}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de agendamento */}
          <Tabs value={tipo} onValueChange={setTipo}>
            <TabsList className="grid w-full grid-cols-3">
              {SCHEDULE_TYPES.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1">
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="aniversario" className="mt-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  🎂 A mensagem será enviada automaticamente no dia do aniversário de cada cliente
                  que tiver a data de nascimento cadastrada.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="unico" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Data do envio</Label>
                <Input
                  type="date"
                  value={dataEnvio}
                  onChange={(e) => setDataEnvio(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </TabsContent>

            <TabsContent value="data_fixa" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Data (dia/mês)</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="DD-MM"
                    value={diaMes}
                    onChange={(e) => setDiaMes(e.target.value)}
                    maxLength={5}
                    className="w-24"
                  />
                  <Select onValueChange={setDiaMes}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Ou selecione uma data comum" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_DATES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label} ({d.value.split('-').reverse().join('/')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Horário de envio */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário de envio
            </Label>
            <Input
              type="time"
              value={horaEnvio}
              onChange={(e) => setHoraEnvio(e.target.value)}
              className="w-32"
            />
          </div>

          {/* Filtro de clientes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Enviar para
            </Label>
            <div className="flex flex-wrap gap-4">
              {CLIENT_FILTERS.map((f) => (
                <div key={f.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-${f.value}`}
                    checked={statusFilter.includes(f.value)}
                    onCheckedChange={() => toggleStatusFilter(f.value)}
                  />
                  <Label htmlFor={`filter-${f.value}`} className="cursor-pointer text-sm">
                    {f.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedMessage && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Preview da mensagem:</p>
              <p className="text-sm whitespace-pre-wrap line-clamp-4">
                {selectedMessage.conteudo}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !mensagemId}>
            {saving ? 'Salvando...' : 'Criar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
