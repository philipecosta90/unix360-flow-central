
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContractDetailDialog } from "./ContractDetailDialog";
import { EditContractDialog } from "./EditContractDialog";
import { AddContractDialog } from "./AddContractDialog";
import { useToast } from "@/hooks/use-toast";

interface Contract {
  id: number;
  clientName: string;
  title: string;
  value: number;
  status: string;
  sentDate: string | null;
  signedDate: string | null;
  validUntil: string | null;
  type: string;
}

export const ContractsModule = () => {
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: 1,
      clientName: "João Silva",
      title: "Contrato de Coaching Executivo",
      value: 12000,
      status: "Assinado",
      sentDate: "2024-01-10",
      signedDate: "2024-01-12",
      validUntil: "2024-07-12",
      type: "Coaching"
    },
    {
      id: 2,
      clientName: "Maria Santos",
      title: "Consultoria Empresarial",
      value: 8500,
      status: "Enviado",
      sentDate: "2024-01-14",
      signedDate: null,
      validUntil: "2024-01-28",
      type: "Consultoria"
    },
    {
      id: 3,
      clientName: "Pedro Costa",
      title: "Programa de Mentoria",
      value: 6000,
      status: "Pendente",
      sentDate: null,
      signedDate: null,
      validUntil: null,
      type: "Mentoria"
    },
    {
      id: 4,
      clientName: "Ana Oliveira",
      title: "Treinamento Corporativo",
      value: 15000,
      status: "Expirado",
      sentDate: "2023-12-15",
      signedDate: null,
      validUntil: "2024-01-15",
      type: "Treinamento"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assinado": return "bg-green-100 text-green-800";
      case "Enviado": return "bg-blue-100 text-blue-800";
      case "Pendente": return "bg-yellow-100 text-yellow-800";
      case "Expirado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const contractStats = {
    total: contracts.length,
    signed: contracts.filter(c => c.status === "Assinado").length,
    pending: contracts.filter(c => c.status === "Enviado" || c.status === "Pendente").length,
    totalValue: contracts.filter(c => c.status === "Assinado").reduce((sum, c) => sum + c.value, 0)
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailDialog(true);
  };

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowEditDialog(true);
  };

  const handleDeleteContract = (contractId: number) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      setContracts(prev => prev.filter(c => c.id !== contractId));
      toast({
        title: "Contrato excluído",
        description: "O contrato foi removido com sucesso.",
      });
    }
  };

  const handleAddContract = () => {
    setShowAddDialog(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600 mt-2">Gerencie seus contratos e propostas</p>
          </div>
          <Button 
            className="bg-[#43B26D] hover:bg-[#37A05B]"
            onClick={handleAddContract}
          >
            + Novo Contrato
          </Button>
        </div>

        {/* Contract Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 text-blue-600 flex items-center justify-center bg-blue-100 rounded">
                  📄
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{contractStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 text-green-600 flex items-center justify-center bg-green-100 rounded">
                  ✅
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assinados</p>
                  <p className="text-2xl font-bold text-gray-900">{contractStats.signed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 text-yellow-600 flex items-center justify-center bg-yellow-100 rounded">
                  ⏰
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{contractStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 text-[#43B26D] flex items-center justify-center bg-green-100 rounded">
                  💰
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {contractStats.totalValue.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts List */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-[#43B26D] text-white">
                        {contract.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900">{contract.title}</h4>
                      <p className="text-sm text-gray-600">{contract.clientName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {contract.type}
                        </Badge>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-[#43B26D]">
                      R$ {contract.value.toLocaleString('pt-BR')}
                    </p>
                    {contract.sentDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Enviado: {new Date(contract.sentDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {contract.signedDate && (
                      <p className="text-xs text-gray-500">
                        Assinado: {new Date(contract.signedDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {contract.validUntil && (
                      <p className="text-xs text-gray-500">
                        Válido até: {new Date(contract.validUntil).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewContract(contract)}
                    >
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-[#43B26D] hover:bg-[#37A05B]"
                      onClick={() => handleEditContract(contract)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteContract(contract.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ContractDetailDialog
        contract={selectedContract}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <EditContractDialog
        contract={selectedContract}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AddContractDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </>
  );
};
