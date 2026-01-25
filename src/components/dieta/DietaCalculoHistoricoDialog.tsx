import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History, Trash2, Flame, Zap, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCalculosEnergeticos, type CalculoEnergetico } from '@/hooks/useCalculosEnergeticos';
import { PROTOCOLOS_TMB, FATORES_ATIVIDADE, FATORES_INJURIA } from '@/utils/tmbCalculations';

interface DietaCalculoHistoricoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNome: string;
}

export const DietaCalculoHistoricoDialog = ({
  open,
  onOpenChange,
  clienteId,
  clienteNome
}: DietaCalculoHistoricoDialogProps) => {
  const { calculos, loading, fetchCalculos, deleteCalculo } = useCalculosEnergeticos(clienteId);

  useEffect(() => {
    if (open && clienteId) {
      fetchCalculos();
    }
  }, [open, clienteId, fetchCalculos]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cálculo do histórico?')) {
      await deleteCalculo(id);
    }
  };

  const getProtocoloNome = (protocolo: string) => {
    return PROTOCOLOS_TMB[protocolo as keyof typeof PROTOCOLOS_TMB]?.nome || protocolo;
  };

  const getFatorAtividadeNome = (valor: number) => {
    return FATORES_ATIVIDADE.find(f => f.valor === valor)?.nome || valor.toFixed(2);
  };

  const getFatorInjuriaNome = (valor: number) => {
    return FATORES_INJURIA.find(f => f.valor === valor)?.nome || valor.toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Cálculos - {clienteNome}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : calculos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cálculo registrado para este cliente</p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {calculos.map((calculo: CalculoEnergetico, index: number) => (
                <Card key={calculo.id} className={index === 0 ? 'border-primary' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(calculo.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {index === 0 && <Badge>Mais recente</Badge>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(calculo.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Flame className="h-6 w-6 text-orange-500" />
                        <div>
                          <p className="text-xl font-bold">{calculo.tmb_kcal}</p>
                          <p className="text-xs text-muted-foreground">TMB (kcal)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                        <Zap className="h-6 w-6 text-primary" />
                        <div>
                          <p className="text-xl font-bold text-primary">{calculo.get_kcal}</p>
                          <p className="text-xs text-muted-foreground">GET (kcal)</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Peso:</span>{' '}
                        <strong>{calculo.peso_kg} kg</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Altura:</span>{' '}
                        <strong>{calculo.altura_cm} cm</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Idade:</span>{' '}
                        <strong>{calculo.idade} anos</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sexo:</span>{' '}
                        <strong className="capitalize">{calculo.sexo}</strong>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Protocolo:</span>
                        <Badge variant="secondary">{getProtocoloNome(calculo.protocolo_tmb)}</Badge>
                      </div>
                      <div className="flex gap-4">
                        <span>
                          <span className="text-muted-foreground">Fator Atividade:</span>{' '}
                          <strong>{calculo.fator_atividade.toFixed(2)}</strong>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({getFatorAtividadeNome(calculo.fator_atividade)})
                          </span>
                        </span>
                        {calculo.fator_injuria > 1 && (
                          <span>
                            <span className="text-muted-foreground">Fator Injúria:</span>{' '}
                            <strong>{calculo.fator_injuria.toFixed(2)}</strong>
                            <span className="text-muted-foreground text-xs ml-1">
                              ({getFatorInjuriaNome(calculo.fator_injuria)})
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {calculo.observacoes && (
                      <>
                        <Separator className="my-3" />
                        <p className="text-sm text-muted-foreground italic">
                          {calculo.observacoes}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
