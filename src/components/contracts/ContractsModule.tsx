
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContractDetailDialog } from "./ContractDetailDialog";
import { AddContractDialog } from "./AddContractDialog";
import { EditContractDialog } from "./EditContractDialog";
import { ContractsFilters } from "./ContractsFilters";
import { ContractsList } from "./ContractsList";
import { useContracts, Contract } from "@/hooks/useContracts";
import { Loader2, Plus } from "lucide-react";

export const ContractsModule = () => {
  const { contracts, loading, handleAddContract, handleEditContract, handleDeleteContract } = useContracts();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const onAddContract = async (contractData: Omit<Contract, "id" | "created_at" | "updated_at">) => {
    await handleAddContract(contractData);
    setShowAddDialog(false);
  };

  const onEditContract = async (contractData: Contract) => {
    await handleEditContract(contractData);
    setShowEditDialog(false);
    setEditingContract(null);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus contratos e acordos</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-[#43B26D] hover:bg-[#37A05B]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <ContractsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </CardContent>
      </Card>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#43B26D]" />
          <span className="ml-2 text-gray-600">Carregando contratos...</span>
        </div>
      ) : (
        <ContractsList
          contracts={contracts}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onView={setSelectedContract}
          onEdit={handleEdit}
          onDelete={handleDeleteContract}
          onAddContract={() => setShowAddDialog(true)}
        />
      )}

      {/* Dialogs */}
      {selectedContract && (
        <ContractDetailDialog
          contract={selectedContract}
          open={!!selectedContract}
          onOpenChange={() => setSelectedContract(null)}
        />
      )}

      <AddContractDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={onAddContract}
      />

      {editingContract && (
        <EditContractDialog
          contract={editingContract}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSubmit={onEditContract}
        />
      )}
    </div>
  );
};
