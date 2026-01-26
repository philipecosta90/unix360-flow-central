import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, Flame, Clock, Utensils, FileDown, ChevronDown, ChevronRight, 
  Trash2, Pencil, MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DietaCliente } from '@/types/dieta';
import { useDietas } from '@/hooks/useDietas';
import { DietaRefeicaoDialog } from './DietaRefeicaoDialog';
import { DietaAlimentoDialog } from './DietaAlimentoDialog';
import { calcularTotaisRefeicao, calcularTotaisDieta } from '@/utils/dietaCalculations';
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
  const { 
    addRefeicaoCliente, 
    addAlimentoCliente, 
    deleteRefeicaoCliente, 
    deleteAlimentoCliente,
    updateDietaCliente 
  } = useDietas();
  
  const [showRefeicaoDialog, setShowRefeicaoDialog] = useState(false);
  const [showAlimentoDialog, setShowAlimentoDialog] = useState(false);
  const [selectedRefeicaoId, setSelectedRefeicaoId] = useState<string | null>(null);
  const [openRefeicoes, setOpenRefeicoes] = useState<{ [key: string]: boolean }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'refeicao' | 'alimento'; id: string; nome: string } | null>(null);

  // Initialize open state for all meals when dieta changes
  useEffect(() => {
    if (dieta?.refeicoes) {
      const initialState: { [key: string]: boolean } = {};
      dieta.refeicoes.forEach(r => { initialState[r.id] = true; });
      setOpenRefeicoes(initialState);
    }
  }, [dieta?.id]);

  if (!dieta) return null;

  // Calcular totais atualizados
  const totaisCalculados = calcularTotaisDieta(dieta.refeicoes || []);

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
    
    // Recalcular totais após adicionar alimento
    setTimeout(async () => {
      const novosTotais = calcularTotaisDieta(dieta.refeicoes || []);
      await updateDietaCliente(dieta.id, novosTotais);
    }, 500);
    
    setShowAlimentoDialog(false);
    setSelectedRefeicaoId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'refeicao') {
      await deleteRefeicaoCliente(deleteConfirm.id);
    } else {
      await deleteAlimentoCliente(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const toggleRefeicao = (refeicaoId: string) => {
    setOpenRefeicoes(prev => ({
      ...prev,
      [refeicaoId]: !prev[refeicaoId]
    }));
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

            {/* Macros Totais Calculados */}
            <Card className="bg-muted/30">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">{totaisCalculados.calorias_total}</span>
                    <span className="text-sm text-muted-foreground">kcal</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-blue-600 font-medium">P: {totaisCalculados.proteinas_g}g</span>
                    <span className="text-amber-600 font-medium">C: {totaisCalculados.carboidratos_g}g</span>
                    <span className="text-red-600 font-medium">G: {totaisCalculados.gorduras_g}g</span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
            <div className="space-y-3">
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
                <div className="space-y-2">
                  {dieta.refeicoes?.map((refeicao) => {
                    const totaisRefeicao = calcularTotaisRefeicao(refeicao.alimentos || []);
                    const isOpen = openRefeicoes[refeicao.id] !== false;
                    
                    return (
                      <Collapsible
                        key={refeicao.id}
                        open={isOpen}
                        onOpenChange={() => toggleRefeicao(refeicao.id)}
                      >
                        <Card>
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">{refeicao.nome}</span>
                                {refeicao.horario_sugerido && (
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {refeicao.horario_sugerido}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {totaisRefeicao.calorias} kcal
                                </span>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRefeicaoId(refeicao.id);
                                        setShowAlimentoDialog(true);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Adicionar Alimento
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({ type: 'refeicao', id: refeicao.id, nome: refeicao.nome });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remover Refeição
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="px-3 pb-3 border-t">
                              {refeicao.alimentos?.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-3 text-center">
                                  Nenhum alimento adicionado
                                </p>
                              ) : (
                                <ul className="divide-y">
                                  {refeicao.alimentos?.map((alimento) => (
                                    <li key={alimento.id} className="py-2 flex justify-between items-center group">
                                      <div className="flex-1">
                                        <span className="text-sm">
                                          {alimento.nome}
                                          {alimento.quantidade && (
                                            <span className="text-muted-foreground ml-1">
                                              ({alimento.quantidade})
                                            </span>
                                          )}
                                        </span>
                                        {(alimento.proteinas_g || alimento.carboidratos_g || alimento.gorduras_g) && (
                                          <div className="text-xs text-muted-foreground mt-0.5">
                                            P: {alimento.proteinas_g || 0}g | 
                                            C: {alimento.carboidratos_g || 0}g | 
                                            G: {alimento.gorduras_g || 0}g
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {alimento.calorias && (
                                          <span className="text-xs text-muted-foreground">
                                            {alimento.calorias} kcal
                                          </span>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => setDeleteConfirm({ 
                                            type: 'alimento', 
                                            id: alimento.id, 
                                            nome: alimento.nome 
                                          })}
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              
                              {/* Subtotal da refeição */}
                              {refeicao.alimentos && refeicao.alimentos.length > 0 && (
                                <div className="mt-2 pt-2 border-t flex justify-between text-xs">
                                  <span className="text-muted-foreground">Subtotal:</span>
                                  <span className="font-medium">
                                    {totaisRefeicao.calorias} kcal | 
                                    P: {totaisRefeicao.proteinas_g}g | 
                                    C: {totaisRefeicao.carboidratos_g}g | 
                                    G: {totaisRefeicao.gorduras_g}g
                                  </span>
                                </div>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => {
                                  setSelectedRefeicaoId(refeicao.id);
                                  setShowAlimentoDialog(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar Alimento
                              </Button>
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
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

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteConfirm?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
