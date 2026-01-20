import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCSPlanner, calcularCicloSemana, PlannerCliente, PlannerSemana } from '@/hooks/useCSPlanner';
import { 
  MicroMetaCell, 
  CheckinCell, 
  StatusCell, 
  TipoContratoCell, 
  ObservacaoCell,
  CicloSemanaBadge 
} from './CSPlannerCell';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SEMANAS_POR_PAGINA = 8;

export const CSPlanner = () => {
  const { useClientesPlanner, useSemanas, updateClientePlanner, upsertSemana } = useCSPlanner();
  const { data: clientes = [], isLoading: clientesLoading, refetch: refetchClientes } = useClientesPlanner();
  const { data: todasSemanas = [], isLoading: semanasLoading, refetch: refetchSemanas } = useSemanas();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaSemana, setPaginaSemana] = useState(0);

  const isLoading = clientesLoading || semanasLoading;

  // Filtrar clientes por busca
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.tipo_contrato?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientes, searchTerm]);

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

  // Calcular range de semanas visíveis
  const semanaInicio = paginaSemana * SEMANAS_POR_PAGINA + 1;
  const semanaFim = semanaInicio + SEMANAS_POR_PAGINA - 1;
  const semanasVisiveis = Array.from({ length: SEMANAS_POR_PAGINA }, (_, i) => semanaInicio + i);

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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl">Planner de Clientes</CardTitle>
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

        {/* Navegação de semanas */}
        <div className="flex items-center justify-between mt-4 py-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPaginaSemana(Math.max(0, paginaSemana - 1))}
            disabled={paginaSemana === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Semanas {semanaInicio} - {semanaFim}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPaginaSemana(paginaSemana + 1)}
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[100px]">Contrato</TableHead>
                  <TableHead className="min-w-[60px] text-center">Ciclo</TableHead>
                  <TableHead className="min-w-[70px] text-center">Semana</TableHead>
                  <TableHead className="min-w-[100px]">Últ. Contato</TableHead>
                  <TableHead className="min-w-[120px]">OBS</TableHead>
                  {semanasVisiveis.map(semana => (
                    <TableHead key={semana} colSpan={3} className="text-center border-l min-w-[240px]">
                      S{semana}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableHead className="sticky left-0 bg-muted/30 z-10"></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  {semanasVisiveis.map(semana => (
                    <>
                      <TableHead key={`${semana}-meta`} className="text-xs text-center border-l">Micro Meta</TableHead>
                      <TableHead key={`${semana}-check`} className="text-xs text-center">Check-in</TableHead>
                      <TableHead key={`${semana}-status`} className="text-xs text-center">Status</TableHead>
                    </>
                  ))}
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

                    return (
                      <TableRow key={cliente.id} className="hover:bg-muted/30">
                        <TableCell className="sticky left-0 bg-card z-10 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {cliente.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="truncate max-w-[100px]" title={cliente.nome}>
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
                          <CicloSemanaBadge value={cliente.ciclo_atual || cicloAtual} max={12} />
                        </TableCell>
                        <TableCell className="text-center">
                          <CicloSemanaBadge value={cliente.semana_atual || semanaAtual} max={12} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(cliente.ultimo_contato)}
                        </TableCell>
                        <TableCell>
                          <ObservacaoCell
                            value={cliente.planner_obs}
                            onChange={(value) => handleUpdateCliente(cliente.id, 'planner_obs', value)}
                          />
                        </TableCell>
                        {semanasVisiveis.map(semanaNum => {
                          const semanaData = clienteSemanas[semanaNum];
                          return (
                            <>
                              <TableCell key={`${cliente.id}-${semanaNum}-meta`} className="border-l">
                                <MicroMetaCell
                                  value={semanaData?.micro_meta || null}
                                  onChange={(value) => handleUpdateSemana(cliente.id, semanaNum, 'micro_meta', value)}
                                />
                              </TableCell>
                              <TableCell key={`${cliente.id}-${semanaNum}-check`} className="text-center">
                                <CheckinCell
                                  value={semanaData?.checkin_realizado || false}
                                  onChange={(value) => handleUpdateSemana(cliente.id, semanaNum, 'checkin_realizado', value)}
                                />
                              </TableCell>
                              <TableCell key={`${cliente.id}-${semanaNum}-status`} className="text-center">
                                <StatusCell
                                  value={semanaData?.status || 'pendente'}
                                  onChange={(value) => handleUpdateSemana(cliente.id, semanaNum, 'status', value)}
                                />
                              </TableCell>
                            </>
                          );
                        })}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6 + semanasVisiveis.length * 3} className="text-center py-12">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente ativo cadastrado'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
