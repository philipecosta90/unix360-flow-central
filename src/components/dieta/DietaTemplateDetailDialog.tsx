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
import { Plus, Flame, Clock, Utensils } from 'lucide-react';
import { DietaTemplate } from '@/types/dieta';
import { useDietas } from '@/hooks/useDietas';
import { DietaRefeicaoDialog } from './DietaRefeicaoDialog';
import { DietaAlimentoDialog } from './DietaAlimentoDialog';

interface DietaTemplateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DietaTemplate | null;
}

export const DietaTemplateDetailDialog = ({ open, onOpenChange, template }: DietaTemplateDetailDialogProps) => {
  const { addRefeicaoTemplate, addAlimentoTemplate } = useDietas();
  const [showRefeicaoDialog, setShowRefeicaoDialog] = useState(false);
  const [showAlimentoDialog, setShowAlimentoDialog] = useState(false);
  const [selectedRefeicaoId, setSelectedRefeicaoId] = useState<string | null>(null);

  if (!template) return null;

  const handleAddRefeicao = async (data: { nome: string; horario_sugerido?: string; observacoes?: string }) => {
    const ordem = (template.refeicoes?.length || 0) + 1;
    await addRefeicaoTemplate(template.id, data, ordem);
    setShowRefeicaoDialog(false);
  };

  const handleAddAlimento = async (data: any) => {
    if (!selectedRefeicaoId) return;
    const refeicao = template.refeicoes?.find(r => r.id === selectedRefeicaoId);
    const ordem = (refeicao?.alimentos?.length || 0) + 1;
    await addAlimentoTemplate(selectedRefeicaoId, data, ordem);
    setShowAlimentoDialog(false);
    setSelectedRefeicaoId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {template.nome}
              {template.objetivo && (
                <Badge variant="secondary">{template.objetivo}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Macros */}
            {(template.calorias_total || template.proteinas_g || template.carboidratos_g || template.gorduras_g) && (
              <div className="flex flex-wrap gap-3">
                {template.calorias_total && (
                  <Badge variant="outline" className="text-sm">
                    <Flame className="h-3 w-3 mr-1" />
                    {template.calorias_total} kcal
                  </Badge>
                )}
                {template.proteinas_g && (
                  <Badge variant="outline" className="text-sm">P: {template.proteinas_g}g</Badge>
                )}
                {template.carboidratos_g && (
                  <Badge variant="outline" className="text-sm">C: {template.carboidratos_g}g</Badge>
                )}
                {template.gorduras_g && (
                  <Badge variant="outline" className="text-sm">G: {template.gorduras_g}g</Badge>
                )}
              </div>
            )}

            {template.descricao && (
              <p className="text-muted-foreground">{template.descricao}</p>
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

              {template.refeicoes?.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Utensils className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhuma refeição adicionada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {template.refeicoes?.map((refeicao) => (
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
