import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  RefreshCw, 
  History,
  AlertTriangle
} from 'lucide-react';
import { useCSPlanner, calcularCicloSemana, PlannerSemana } from '@/hooks/useCSPlanner';
import { 
  MicroMetaCell, 
  CheckinCell, 
  StatusCell, 
  TipoContratoCell, 
  ObservacaoCell,
  CicloSemanaBadge,
  UltimoContatoCell,
  calcularDiasSemContato
} from './CSPlannerCell';
import { CSClientDetail } from './CSClientDetail';

export const CSPlanner = () => {
  const { useClientesPlanner, useSemanas, updateClientePlanner, upsertSemana } = useCSPlanner();
  const { data: clientes = [], isLoading: clientesLoading, refetch: refetchClientes } = useClientesPlanner();
  const { data: todasSemanas = [], isLoading: semanasLoading, refetch: refetchSemanas } = useSemanas();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showOnlyRisk, setShowOnlyRisk] = useState(false);

  const isLoading = clientesLoading || semanasLoading;

  // Contador de clientes em risco (10+ dias ou sem registro)
  const clientesEmRisco = useMemo(() => {
    return clientes.filter(c => {
      const dias = calcularDiasSemContato(c.ultimo_contato);
      return dias > 10 || dias < 0;
    }).length;
  }, [clientes]);

  // Filtrar clientes por busca e opcionalmente por risco
  const clientesFiltrados = useMemo(() => {
    let filtered = clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.tipo_contrato?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (showOnlyRisk) {
      filtered = filtered.filter(cliente => {
        const dias = calcularDiasSemContato(cliente.ultimo_contato);
        return dias > 10 || dias < 0;
      });
    }
    
    return filtered;
  }, [clientes, searchTerm, showOnlyRisk]);

  // Organizar semanas por cliente
  const semanasPorCliente = useMemo(() => {
    const map: Record<string, Record<number, PlannerSemana>> = {};
    todasSemanas.forEach(semana => {
      if (!map[semana.cliente_id]) {
        map[semana.cliente_id] = {};
      }
      map[semana.cliente_id][semana.semana_numero] = semana;
    });
    return map;
  }, [todasSemanas]);

  const handleRefresh = () => {
    refetchClientes();
    refetchSemanas();
  };

  const handleUpdateCliente = (clienteId: string, field: string, value: any) => {
    updateClientePlanner.mutate({
      clienteId,
      updates: { [field]: value }
    });
  };

  const handleUpdateSemana = (clienteId: string, semanaNumero: number, field: string, value: any) => {
    upsertSemana.mutate({
      clienteId,
      semanaNumero,
      updates: { [field]: value }
    });
  };

  const handleOpenDetail = (clienteId: string) => {
    setSelectedClientId(clienteId);
    setDetailOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando Planner...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">Planner de Clientes</CardTitle>
                {clientesEmRisco > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {clientesEmRisco} em risco
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 w-full sm:w-[200px]"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={handleRefresh} className="h-9 w-9">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Filtro de clientes em risco */}
            <div className="flex items-center gap-2">
              <Switch
                id="show-risk"
                checked={showOnlyRisk}
                onCheckedChange={setShowOnlyRisk}
              />
              <Label htmlFor="show-risk" className="text-sm text-muted-foreground cursor-pointer">
                Mostrar apenas clientes em risco (10+ dias sem contato)
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[100px]">Contrato</TableHead>
                  <TableHead className="min-w-[60px] text-center">Ciclo</TableHead>
                  <TableHead className="min-w-[70px] text-center">Semana</TableHead>
                  <TableHead className="min-w-[100px]">Últ. Contato</TableHead>
                  <TableHead className="min-w-[120px]">OBS</TableHead>
                  <TableHead className="min-w-[150px] text-center border-l">Micro Meta</TableHead>
                  <TableHead className="min-w-[80px] text-center">Check-in</TableHead>
                  <TableHead className="min-w-[90px] text-center">Status</TableHead>
                  <TableHead className="min-w-[80px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => {
                    const { cicloAtual, semanaAtual } = calcularCicloSemana(
                      cliente.data_inicio_plano,
                      cliente.tipo_contrato
                    );
                    const clienteSemanas = semanasPorCliente[cliente.id] || {};
                    const semanaAtualData = clienteSemanas[semanaAtual];

                    return (
                      <TableRow key={cliente.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {cliente.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="truncate max-w-[120px]" title={cliente.nome}>
                              {cliente.nome}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TipoContratoCell
                            value={cliente.tipo_contrato}
                            onChange={(value) => handleUpdateCliente(cliente.id, 'tipo_contrato', value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <CicloSemanaBadge value={cicloAtual} max={12} />
                        </TableCell>
                        <TableCell className="text-center">
                          <CicloSemanaBadge value={semanaAtual} max={12} />
                        </TableCell>
                        <TableCell>
                          <UltimoContatoCell
                            value={cliente.ultimo_contato}
                            onChange={(value) => handleUpdateCliente(cliente.id, 'ultimo_contato', value)}
                          />
                        </TableCell>
                        <TableCell>
                          <ObservacaoCell
                            value={cliente.planner_obs}
                            onChange={(value) => handleUpdateCliente(cliente.id, 'planner_obs', value)}
                          />
                        </TableCell>
                        <TableCell className="border-l">
                          <MicroMetaCell
                            value={semanaAtualData?.micro_meta || null}
                            onChange={(value) => handleUpdateSemana(cliente.id, semanaAtual, 'micro_meta', value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckinCell
                            value={semanaAtualData?.checkin_realizado || false}
                            onChange={(value) => handleUpdateSemana(cliente.id, semanaAtual, 'checkin_realizado', value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusCell
                            value={semanaAtualData?.status || 'pendente'}
                            onChange={(value) => handleUpdateSemana(cliente.id, semanaAtual, 'status', value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(cliente.id)}
                            title="Ver histórico"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente ativo cadastrado'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CSClientDetail
        clientId={selectedClientId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
};
