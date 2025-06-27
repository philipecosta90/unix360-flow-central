
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { CSClientDetail } from "./CSClientDetail";
import { Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface CSClientListProps {
  onSelectClient: (clientId: string) => void;
}

export const CSClientList = ({ onSelectClient }: CSClientListProps) => {
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
        color: "bg-red-100 text-red-600", 
        icon: AlertTriangle 
      };
    }
    
    if (cliente.status === 'ativo') {
      return { label: "Ativo", color: "bg-green-100 text-green-600", icon: CheckCircle };
    }
    
    return { label: "Onboarding", color: "bg-yellow-100 text-yellow-600", icon: Clock };
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
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.length > 0 ? (
              filteredClients.map((cliente) => {
                const status = getClientStatus(cliente);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectClient(cliente.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {cliente.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cliente.nome}</p>
                        <p className="text-sm text-gray-600">{cliente.email}</p>
                        {cliente.telefone && (
                          <p className="text-xs text-gray-500">{cliente.telefone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(cliente.id);
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
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
