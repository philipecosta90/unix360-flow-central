import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  Gift,
  Calendar,
  Repeat,
  Pause,
  Play,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSchedule } from '@/hooks/useMessageSchedules';

interface MessageSchedulesListProps {
  schedules: MessageSchedule[];
  loading: boolean;
  saving: boolean;
  onToggleActive: (id: string, ativo: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAddNew: () => void;
}

const TYPE_CONFIG = {
  aniversario: {
    icon: Gift,
    label: 'Aniversário',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  },
  unico: {
    icon: Calendar,
    label: 'Data Única',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  data_fixa: {
    icon: Repeat,
    label: 'Anual',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  recorrente: {
    icon: Repeat,
    label: 'Recorrente',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
};

export const MessageSchedulesList = ({
  schedules,
  loading,
  saving,
  onToggleActive,
  onDelete,
  onAddNew,
}: MessageSchedulesListProps) => {
  const formatNextSend = (schedule: MessageSchedule) => {
    if (!schedule.proximo_envio) return 'Não definido';

    if (schedule.tipo_agendamento === 'aniversario') {
      return 'Diário (aniversariantes)';
    }

    try {
      const date = parseISO(schedule.proximo_envio);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 0) return 'Hoje';
      if (diff === 1) return 'Amanhã';
      if (diff < 7) return `Em ${diff} dias`;
      
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return schedule.proximo_envio;
    }
  };

  const formatTime = (time: string) => {
    try {
      return time.substring(0, 5);
    } catch {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed bg-muted/20 p-8 text-center">
        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhum agendamento</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie um agendamento para enviar mensagens automaticamente em datas específicas.
        </p>
        <Button onClick={onAddNew} className="mt-4">
          Criar primeiro agendamento
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {schedules.map((schedule) => {
        const config = TYPE_CONFIG[schedule.tipo_agendamento] || TYPE_CONFIG.unico;
        const IconComponent = config.icon;

        return (
          <Card key={schedule.id} className={!schedule.ativo ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{schedule.mensagem?.icone || '📩'}</span>
                  <div>
                    <CardTitle className="text-base">
                      {schedule.mensagem?.titulo || 'Mensagem'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={config.color}>
                        <IconComponent className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                      {!schedule.ativo && (
                        <Badge variant="outline">Pausado</Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>{formatNextSend(schedule)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(schedule.hora_envio)}</span>
                </div>
              </div>

              {schedule.filtro_clientes?.status && (
                <div className="flex flex-wrap gap-1">
                  {schedule.filtro_clientes.status.map((status: string) => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleActive(schedule.id, !schedule.ativo)}
                  disabled={saving}
                >
                  {schedule.ativo ? (
                    <>
                      <Pause className="mr-1 h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-4 w-4" />
                      Ativar
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O agendamento será removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(schedule.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
