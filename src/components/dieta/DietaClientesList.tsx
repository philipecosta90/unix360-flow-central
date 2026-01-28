import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus, 
  Utensils,
  Flame,
  Search,
  FileDown,
  History,
  Pause,
  Play
} from 'lucide-react';
import { useDietas } from '@/hooks/useDietas';
import { DietaCliente } from '@/types/dieta';
import { DietaClienteDetailDialog } from './DietaClienteDetailDialog';
import { DietaHistoricoDialog } from './DietaHistoricoDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface DietaClientesListProps {
  dietas: DietaCliente[];
  onNewDieta: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativa': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'pausada': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    case 'finalizada': return 'bg-gray-500/10 text-gray-600 border-gray-200';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ativa': return 'Ativa';
    case 'pausada': return 'Pausada';
    case 'finalizada': return 'Finalizada';
    default: return status;
  }
};

export const DietaClientesList = ({ dietas, onNewDieta }: DietaClientesListProps) => {
  const { deleteDietaCliente, updateDietaCliente } = useDietas();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDieta, setSelectedDieta] = useState<DietaCliente | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showHistoricoDialog, setShowHistoricoDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [dietaToDelete, setDietaToDelete] = useState<string | null>(null);

  const filteredDietas = dietas.filter(d => 
    d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (dietaToDelete) {
      await deleteDietaCliente(dietaToDelete);
      setShowDeleteAlert(false);
      setDietaToDelete(null);
    }
  };

  const toggleStatus = async (dieta: DietaCliente) => {
    const newStatus = dieta.status === 'ativa' ? 'pausada' : 'ativa';
    await updateDietaCliente(dieta.id, { status: newStatus } as any);
  };

  if (dietas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma dieta criada</h3>
          <p className="text-muted-foreground text-center mb-4">
            Crie dietas personalizadas para seus clientes
          </p>
          <Button onClick={onNewDieta}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Dieta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou nome da dieta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDietas.map((dieta) => (
          <Card 
            key={dieta.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedDieta(dieta);
              setShowDetailDialog(true);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={dieta.cliente?.foto_url} />
                    <AvatarFallback>
                      {dieta.cliente?.nome?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{dieta.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {dieta.cliente?.nome}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDieta(dieta);
                      setShowDetailDialog(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(dieta);
                    }}>
                      {dieta.status === 'ativa' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDieta(dieta);
                      setShowHistoricoDialog(true);
                    }}>
                      <History className="h-4 w-4 mr-2" />
                      Histórico
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implementar exportação PDF
                    }}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDietaToDelete(dieta.id);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getStatusColor(dieta.status)}>
                  {getStatusLabel(dieta.status)}
                </Badge>
                {dieta.objetivo && (
                  <Badge variant="outline">{dieta.objetivo}</Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs">
                {dieta.calorias_total && (
                  <Badge variant="secondary">
                    <Flame className="h-3 w-3 mr-1" />
                    {dieta.calorias_total} kcal
                  </Badge>
                )}
                <Badge variant="secondary">
                  {dieta.refeicoes?.length || 0} refeições
                </Badge>
              </div>
              
              {dieta.data_inicio && (
                <p className="text-xs text-muted-foreground mt-3">
                  Início: {format(new Date(dieta.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <DietaClienteDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        dietaId={selectedDieta?.id || null}
      />

      <DietaHistoricoDialog
        open={showHistoricoDialog}
        onOpenChange={setShowHistoricoDialog}
        dietaId={selectedDieta?.id || null}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dieta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A dieta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
