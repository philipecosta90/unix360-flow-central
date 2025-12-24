import { useEffect, useMemo, useState } from "react";
import { useClients } from "@/hooks/useClients";
import { useAnamnese } from "@/hooks/useAnamnese";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Send, Phone, Mail, User, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnamneseEnviarDialog } from "./AnamneseEnviarDialog";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone?: string | null;
  status: string;
}

export const AnamneseEnviarTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: clientes, isLoading, refetch } = useClients();
  const { templates, loading: loadingTemplates, fetchTemplates } = useAnamnese();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  // Filtrar clientes pela busca
  const filteredClientes = useMemo(() => {
    if (!clientes) return [];
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clientes;
    
    return clientes.filter((cliente) => {
      const nome = cliente.nome?.toLowerCase() || "";
      const email = cliente.email?.toLowerCase() || "";
      const telefone = (cliente as any).telefone?.toLowerCase() || "";
      
      return nome.includes(term) || email.includes(term) || telefone.includes(term);
    });
  }, [clientes, searchTerm]);

  const handleEnviarClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      ativo: { label: "Ativo", variant: "default" },
      inativo: { label: "Inativo", variant: "secondary" },
      lead: { label: "Lead", variant: "outline" },
      prospecto: { label: "Prospecto", variant: "outline" },
    };
    
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const hasPhone = (cliente: any) => {
    return cliente.telefone && cliente.telefone.trim() !== "";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enviar Anamnese</CardTitle>
          <CardDescription>Carregando clientes...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-lime-500" />
                Enviar Anamnese
              </CardTitle>
              <CardDescription>
                Selecione um cliente para enviar o questionário via WhatsApp
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Aviso se não tem templates */}
          {templates.length === 0 && !loadingTemplates && (
            <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                Você precisa criar um template de anamnese antes de enviar. Vá para a aba "Templates".
              </p>
            </div>
          )}

          {/* Tabela de clientes */}
          {filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <p>Nenhum cliente encontrado para "{searchTerm}"</p>
              ) : (
                <p>Nenhum cliente cadastrado ainda.</p>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => {
                    const clienteComTelefone = cliente as any;
                    const telefone = clienteComTelefone.telefone;
                    const temTelefone = hasPhone(clienteComTelefone);
                    
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{cliente.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {cliente.email ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{cliente.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {telefone ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span className="text-sm">{telefone}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              Sem telefone
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(cliente.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {temTelefone ? (
                            <Button
                              size="sm"
                              onClick={() => handleEnviarClick(clienteComTelefone)}
                              disabled={templates.length === 0}
                              className="bg-lime-600 hover:bg-lime-700"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Enviar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                              className="text-muted-foreground"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Sem telefone
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Contagem de resultados */}
          {filteredClientes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredClientes.length} de {clientes?.length || 0} clientes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de seleção de template */}
      <AnamneseEnviarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cliente={selectedCliente}
        templates={templates}
      />
    </>
  );
};
