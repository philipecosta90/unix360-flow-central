import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { useCSPlanner, calcularCicloSemana } from "@/hooks/useCSPlanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { User, Mail, Phone, Calendar, CheckCircle, Clock, AlertTriangle, Star, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CSClientDetailProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CSClientDetail = ({
  clientId,
  open,
  onOpenChange
}: CSClientDetailProps) => {
  const {
    useCSData,
    useClientOnboarding
  } = useCustomerSuccess();
  const { useSemanas } = useCSPlanner();
  
  const { data: csData } = useCSData();
  const { data: onboarding = [] } = useClientOnboarding(clientId || "");
  const { data: todasSemanas = [] } = useSemanas();
  
  const cliente = csData?.clientes?.find(c => c.id === clientId);
  const clienteRisco = csData?.clientesRiscoDetalhes?.find(c => c.id === clientId);

  // Filtrar semanas do cliente atual e ordenar
  const semanasCliente = todasSemanas
    .filter(s => s.cliente_id === clientId)
    .sort((a, b) => a.semana_numero - b.semana_numero);

  // Calcular ciclo e semana atual
  const { cicloAtual, semanaAtual } = cliente 
    ? calcularCicloSemana(cliente.data_inicio_plano || null, cliente.tipo_contrato || null)
    : { cicloAtual: 1, semanaAtual: 1 };

  if (!cliente) return null;

  const getClientStatus = () => {
    if (clienteRisco) {
      return {
        label: `Em Risco (${clienteRisco.diasSemInteracao} dias sem interação)`,
        color: "bg-destructive/10 text-destructive",
        icon: AlertTriangle
      };
    }
    if (cliente.status === 'ativo') {
      return {
        label: "Ativo",
        color: "bg-green-100 text-green-600",
        icon: CheckCircle
      };
    }
    return {
      label: "Onboarding",
      color: "bg-yellow-100 text-yellow-600",
      icon: Clock
    };
  };

  const status = getClientStatus();
  const StatusIcon = status.icon;
  const onboardingConcluido = onboarding.filter(o => o.concluido).length;
  const onboardingTotal = onboarding.length;
  const percentualOnboarding = onboardingTotal > 0 ? onboardingConcluido / onboardingTotal * 100 : 0;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-700';
      case 'pendente': return 'bg-yellow-100 text-yellow-700';
      case 'ignorado': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'ok': return 'OK';
      case 'pendente': return 'Pendente';
      case 'ignorado': return 'Ignorado';
      default: return '-';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-xl">
                {cliente.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold leading-tight">{cliente.nome}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={`${status.color} text-xs sm:text-sm px-2 py-1`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  <span className="hidden xs:inline">{status.label}</span>
                  <span className="xs:hidden">
                    {status.label.includes('Risco') ? 'Risco' : status.label.split(' ')[0]}
                  </span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Ciclo {cicloAtual} • Semana {semanaAtual}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {cliente.email && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm break-all">{cliente.email}</span>
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{cliente.telefone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">
                    Cliente desde: {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Semanas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />
                Histórico de Semanas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {semanasCliente.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Semana</TableHead>
                        <TableHead>Micro Meta</TableHead>
                        <TableHead className="text-center w-[90px]">Check-in</TableHead>
                        <TableHead className="text-center w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px]">Atualização</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semanasCliente.map((semana) => {
                        const isSemanaAtual = semana.semana_numero === semanaAtual;
                        
                        return (
                          <TableRow 
                            key={semana.id} 
                            className={isSemanaAtual ? 'bg-primary/5' : ''}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1">
                                {isSemanaAtual && (
                                  <Star className="h-3 w-3 text-primary fill-primary" />
                                )}
                                S{semana.semana_numero}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {semana.micro_meta || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              {semana.checkin_realizado ? (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                  SIM
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                  NÃO
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={getStatusColor(semana.status)}>
                                {getStatusLabel(semana.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(semana.updated_at), "dd/MM", { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Nenhum registro de semana ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progresso do Onboarding */}
          {onboarding.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Progresso do Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {onboardingConcluido} de {onboardingTotal} etapas concluídas
                    </span>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {percentualOnboarding.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${percentualOnboarding}%` }} 
                    />
                  </div>
                  <div className="space-y-3">
                    {onboarding.map(step => (
                      <div key={step.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                        {step.concluido ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                        <span className={`text-sm leading-relaxed ${step.concluido ? '' : 'text-muted-foreground'}`}>
                          {step.titulo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};
