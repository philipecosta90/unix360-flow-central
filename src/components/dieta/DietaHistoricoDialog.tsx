import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, History, Calendar } from 'lucide-react';
import { useDietas } from '@/hooks/useDietas';
import { DietaHistorico } from '@/types/dieta';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DietaHistoricoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dietaId: string | null;
}

export const DietaHistoricoDialog = ({ open, onOpenChange, dietaId }: DietaHistoricoDialogProps) => {
  const { fetchHistorico } = useDietas();
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<DietaHistorico[]>([]);

  useEffect(() => {
    if (open && dietaId) {
      loadHistorico();
    }
  }, [open, dietaId]);

  const loadHistorico = async () => {
    if (!dietaId) return;
    
    setLoading(true);
    try {
      const data = await fetchHistorico(dietaId);
      setHistorico(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : historico.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma versão anterior salva</p>
            <p className="text-sm text-muted-foreground mt-1">
              O histórico é salvo automaticamente ao fazer alterações significativas
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {historico.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Versão {item.versao}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {item.motivo_alteracao && (
                    <p className="text-sm text-muted-foreground">
                      {item.motivo_alteracao}
                    </p>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground">
                    <span>{item.dados_completos?.refeicoes?.length || 0} refeições</span>
                    {item.dados_completos?.calorias_total && (
                      <span className="ml-2">• {item.dados_completos.calorias_total} kcal</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
