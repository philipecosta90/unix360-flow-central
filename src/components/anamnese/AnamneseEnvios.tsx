import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAnamnese, AnamneseEnvio } from "@/hooks/useAnamnese";
import { Eye, RefreshCw, Search, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnamneseRespostasDialog } from "./AnamneseRespostasDialog";

export const AnamneseEnvios = () => {
  const { envios, loading, fetchEnvios, resendAnamnese } = useAnamnese();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEnvio, setSelectedEnvio] = useState<AnamneseEnvio | null>(null);
  const [showRespostas, setShowRespostas] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    fetchEnvios();
  }, [fetchEnvios]);

  const handleResend = async (envioId: string) => {
    setResending(envioId);
    await resendAnamnese(envioId);
    await fetchEnvios();
    setResending(null);
  };

  const handleViewRespostas = (envio: AnamneseEnvio) => {
    setSelectedEnvio(envio);
    setShowRespostas(true);
  };

  const filteredEnvios = envios.filter((envio) => {
    const matchesSearch =
      envio.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.cliente?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || envio.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preenchido":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Preenchido
          </Badge>
        );
      case "pendente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "expirado":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Expirado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading && envios.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Histórico de Envios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="preenchido">Preenchido</SelectItem>
                <SelectItem value="expirado">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredEnvios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {envios.length === 0
                ? "Nenhuma anamnese enviada ainda."
                : "Nenhum resultado encontrado."}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnvios.map((envio) => (
                    <TableRow key={envio.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{envio.cliente?.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {envio.cliente?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{envio.template?.nome}</TableCell>
                      <TableCell>
                        {format(new Date(envio.enviado_em), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(envio.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {envio.status === "preenchido" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRespostas(envio)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          )}
                          {(envio.status === "pendente" || envio.status === "expirado") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(envio.id)}
                              disabled={resending === envio.id}
                            >
                              {resending === envio.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Reenviar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEnvio && (
        <AnamneseRespostasDialog
          open={showRespostas}
          onOpenChange={setShowRespostas}
          envio={selectedEnvio}
        />
      )}
    </div>
  );
};
