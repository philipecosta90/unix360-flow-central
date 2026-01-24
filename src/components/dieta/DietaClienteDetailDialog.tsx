import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Flame, Clock, Utensils, FileDown } from 'lucide-react';
import { DietaCliente } from '@/types/dieta';
import { useDietas } from '@/hooks/useDietas';
import { DietaRefeicaoDialog } from './DietaRefeicaoDialog';
import { DietaAlimentoDialog } from './DietaAlimentoDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DietaClienteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dieta: DietaCliente | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativa': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'pausada': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    case 'finalizada': return 'bg-gray-500/10 text-gray-600 border-gray-200';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
  }
};

export const DietaClienteDetailDialog = ({ open, onOpenChange, dieta }: DietaClienteDetailDialogProps) => {
  const { addRefeicaoCliente, addAlimentoCliente } = useDietas();
  const [showRefeicaoDialog, setShowRefeicaoDialog] = useState(false);
  const [showAlimentoDialog, setShowAlimentoDialog] = useState(false);
  const [selectedRefeicaoId, setSelectedRefeicaoId] = useState<string | null>(null);

  if (!dieta) return null;

  const handleAddRefeicao = async (data: { nome: string; horario_sugerido?: string; observacoes?: string }) => {
    const ordem = (dieta.refeicoes?.length || 0) + 1;
    await addRefeicaoCliente(dieta.id, data, ordem);
    setShowRefeicaoDialog(false);
  };

  const handleAddAlimento = async (data: any) => {
    if (!selectedRefeicaoId) return;
    const refeicao = dieta.refeicoes?.find(r => r.id === selectedRefeicaoId);
    const ordem = (refeicao?.alimentos?.length || 0) + 1;
    await addAlimentoCliente(selectedRefeicaoId, data, ordem);
    setShowAlimentoDialog(false);
    setSelectedRefeicaoId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={dieta.cliente?.foto_url} />
                  <AvatarFallback>
                    {dieta.cliente?.nome?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle>{dieta.nome}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{dieta.cliente?.nome}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-1" />
                Exportar PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status e Info */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(dieta.status)}>
                {dieta.status.charAt(0).toUpperCase() + dieta.status.slice(1)}
              </Badge>
              {dieta.objetivo && (
                <Badge variant="outline">{dieta.objetivo}</Badge>
              )}
              {dieta.data_inicio && (
                <Badge variant="secondary">
                  Início: {format(new Date(dieta.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                </Badge>
              )}
            </div>

            {/* Macros */}
            {(dieta.calorias_total || dieta.proteinas_g || dieta.carboidratos_g || dieta.gorduras_g) && (
              <div className="flex flex-wrap gap-3">
                {dieta.calorias_total && (
                  <Badge variant="outline" className="text-sm">
                    <Flame className="h-3 w-3 mr-1" />
                    {dieta.calorias_total} kcal
                  </Badge>
                )}
                {dieta.proteinas_g && (
                  <Badge variant="outline" className="text-sm">P: {dieta.proteinas_g}g</Badge>
                )}
                {dieta.carboidratos_g && (
                  <Badge variant="outline" className="text-sm">C: {dieta.carboidratos_g}g</Badge>
                )}
                {dieta.gorduras_g && (
                  <Badge variant="outline" className="text-sm">G: {dieta.gorduras_g}g</Badge>
                )}
              </div>
            )}

            {dieta.descricao && (
              <p className="text-muted-foreground">{dieta.descricao}</p>
            )}

            {dieta.observacoes_profissional && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Observações do Profissional:</p>
                <p className="text-sm text-muted-foreground">{dieta.observacoes_profissional}</p>
              </div>
            )}

            {/* Refeições */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Refeições</h3>
                <Button size="sm" onClick={() => setShowRefeicaoDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Refeição
                </Button>
              </div>

              {dieta.refeicoes?.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Utensils className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhuma refeição adicionada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {dieta.refeicoes?.map((refeicao) => (
                    <Card key={refeicao.id}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            {refeicao.nome}
                            {refeicao.horario_sugerido && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {refeicao.horario_sugerido}
                              </Badge>
                            )}
                          </CardTitle>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedRefeicaoId(refeicao.id);
                              setShowAlimentoDialog(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Alimento
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        {refeicao.alimentos?.length === 0 ? (
                          <p className="text-muted-foreground text-sm">Nenhum alimento</p>
                        ) : (
                          <ul className="space-y-1">
                            {refeicao.alimentos?.map((alimento) => (
                              <li key={alimento.id} className="flex justify-between text-sm">
                                <span>
                                  {alimento.nome}
                                  {alimento.quantidade && (
                                    <span className="text-muted-foreground ml-1">
                                      ({alimento.quantidade})
                                    </span>
                                  )}
                                </span>
                                {alimento.calorias && (
                                  <span className="text-muted-foreground">
                                    {alimento.calorias} kcal
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DietaRefeicaoDialog
        open={showRefeicaoDialog}
        onOpenChange={setShowRefeicaoDialog}
        onSubmit={handleAddRefeicao}
      />

      <DietaAlimentoDialog
        open={showAlimentoDialog}
        onOpenChange={setShowAlimentoDialog}
        onSubmit={handleAddAlimento}
      />
    </>
  );
};
