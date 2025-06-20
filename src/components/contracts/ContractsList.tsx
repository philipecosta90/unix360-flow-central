
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { Contract } from "@/hooks/useContracts";
import { ContractCard } from "./ContractCard";

interface ContractsListProps {
  contracts: Contract[];
  searchTerm: string;
  statusFilter: string;
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onAddContract: () => void;
}

export const ContractsList = ({
  contracts,
  searchTerm,
  statusFilter,
  onView,
  onEdit,
  onDelete,
  onAddContract,
}: ContractsListProps) => {
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (filteredContracts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "todos" 
              ? "Nenhum contrato encontrado com os filtros aplicados." 
              : "Nenhum contrato cadastrado ainda."}
          </p>
          <Button 
            onClick={onAddContract}
            className="bg-[#43B26D] hover:bg-[#37A05B]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Contrato
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredContracts.map((contract) => (
        <ContractCard
          key={contract.id}
          contract={contract}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
