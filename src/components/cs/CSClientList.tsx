import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { CSClientDetail } from "./CSClientDetail";
import { Search, AlertTriangle, CheckCircle, Clock, LayoutGrid, List } from "lucide-react";

interface CSClientListProps {
  onSelectClient?: (clientId: string) => void;
  viewMode?: 'kanban' | 'list';
  onViewModeChange?: (mode: 'kanban' | 'list') => void;
}

export const CSClientList = ({ onSelectClient, viewMode, onViewModeChange }: CSClientListProps) => {
  const { useCSData } = useCustomerSuccess();
  const { data: csData, isLoading } = useCSData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredClients = csData?.clientes?.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getClientStatus = (cliente: any) => {
    // Verificar se está nos clientes em risco detalhados
    const clienteRisco = csData?.clientesRiscoDetalhes?.find(c => c.id === cliente.id);
    
    if (clienteRisco) {
      return { 
        label: `Em Risco (${clienteRisco.diasSemInteracao} dias sem interação)`, 
        color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400", 
        icon: AlertTriangle 
      };
    }
    
    if (cliente.status === 'ativo') {
      return { label: "Ativo", color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400", icon: CheckCircle };
    }
    
    return { label: "Onboarding", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400", icon: Clock };
  };

  const handleViewDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando clientes...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="mx-2 sm:mx-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Lista de Clientes</CardTitle>
            {onViewModeChange && (
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => onViewModeChange('kanban')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => onViewModeChange('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            {filteredClients.length > 0 ? (
              filteredClients.map((cliente) => {
                const status = getClientStatus(cliente);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={cliente.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-card"
                    onClick={() => onSelectClient?.(cliente.id)}
                  >
                    {/* Avatar e informações principais */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base font-medium text-muted-foreground">
                          {cliente.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground truncate">{cliente.email}</p>
                        {cliente.telefone && (
                          <p className="text-xs text-muted-foreground truncate">{cliente.telefone}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Status e botão de ação */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 sm:flex-shrink-0">
                      <Badge className={`${status.color} text-xs px-2 py-1 flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="hidden xs:inline">{status.label}</span>
                        <span className="xs:hidden">
                          {status.label.includes('Risco') ? 'Risco' : status.label.split(' ')[0]}
                        </span>
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm px-3 py-1.5 h-auto whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(cliente.id);
                        }}
                      >
                        <span className="hidden sm:inline">Ver Detalhes</span>
                        <span className="sm:hidden">Detalhes</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CSClientDetail
        clientId={selectedClientId}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </>
  );
};
