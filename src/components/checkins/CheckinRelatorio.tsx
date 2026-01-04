import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  BarChart3,
  Eye,
  Trash2,
  Loader2
} from "lucide-react";
import { useCheckinEnvios, getIndicadorVisual, CheckinEnvio } from "@/hooks/useCheckins";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckinRespostasDialog } from "./CheckinRespostasDialog";

export const CheckinRelatorio = () => {
  const { envios, isLoading, deleteEnvio } = useCheckinEnvios();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedEnvio, setSelectedEnvio] = useState<CheckinEnvio | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [envioToDelete, setEnvioToDelete] = useState<CheckinEnvio | null>(null);

  const handleDeleteClick = (envio: CheckinEnvio) => {
    setEnvioToDelete(envio);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!envioToDelete) return;
    deleteEnvio.mutate(envioToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setEnvioToDelete(null);
      }
    });
  };

  const enviosFiltrados = envios?.filter((e) => 
    statusFilter === "todos" || e.status === statusFilter
  ) || [];

  // Métricas
  const total = envios?.length || 0;
  const pendentes = envios?.filter((e) => e.status === "pendente").length || 0;
  const parciais = envios?.filter((e) => e.status === "parcial").length || 0;
  const respondidos = envios?.filter((e) => e.status === "respondido" || e.status === "completo").length || 0;
  const expirados = envios?.filter((e) => e.status === "expirado").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "parcial":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><AlertCircle className="h-3 w-3 mr-1" />Parcial</Badge>;
      case "respondido":
      case "completo":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Respondido</Badge>;
      case "expirado":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-muted-foreground">Total Enviados</p>
              </div>
              <Send className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50/50 border-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-700">{pendentes}</p>
                <p className="text-sm text-yellow-600">Pendentes</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">{parciais}</p>
                <p className="text-sm text-blue-600">Parciais</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-700">{respondidos}</p>
                <p className="text-sm text-green-600">Respondidos</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-700">{expirados}</p>
                <p className="text-sm text-red-600">Expirados</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de envios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Histórico de Check-ins
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="parcial">Parciais</SelectItem>
                <SelectItem value="respondido">Respondidos</SelectItem>
                <SelectItem value="expirado">Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {enviosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum check-in enviado</h3>
              <p className="text-muted-foreground">
                Agende check-ins para começar a acompanhar seus pacientes
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pontuação</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Respondido em</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enviosFiltrados.map((envio) => {
                  const indicador = getIndicadorVisual(
                    envio.pontuacao_total,
                    envio.pontuacao_maxima
                  );

                  return (
                    <TableRow key={envio.id}>
                      <TableCell className="font-medium">
                        {envio.cliente?.nome || "—"}
                      </TableCell>
                      <TableCell>{envio.template?.nome || "—"}</TableCell>
                      <TableCell>{getStatusBadge(envio.status)}</TableCell>
                      <TableCell>
                        {(envio.status === "respondido" || envio.status === "completo") && envio.pontuacao_maxima > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{indicador.emoji}</span>
                            <span className="font-medium">
                              {envio.pontuacao_total}/{envio.pontuacao_maxima}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                indicador.cor === "verde"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : indicador.cor === "amarelo"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {indicador.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(envio.enviado_em), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {envio.respondido_em
                          ? format(new Date(envio.respondido_em), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(envio.status === "respondido" || envio.status === "completo") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEnvio(envio)}
                              title="Ver respostas"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(envio)}
                            title="Excluir check-in"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de respostas */}
      <CheckinRespostasDialog
        open={!!selectedEnvio}
        onOpenChange={(open) => !open && setSelectedEnvio(null)}
        envio={selectedEnvio}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O check-in enviado para{" "}
              <strong>{envioToDelete?.cliente?.nome}</strong> será removido permanentemente
              {(envioToDelete?.status === "respondido" || envioToDelete?.status === "completo") && 
               ", incluindo todas as respostas"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEnvio.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteEnvio.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEnvio.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
