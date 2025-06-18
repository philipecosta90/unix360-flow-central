
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { FinancialKPIs } from "./FinancialKPIs";
import { FinancialFilters } from "./FinancialFilters";
import { FinancialChart } from "./FinancialChart";
import { TransactionTable } from "./TransactionTable";
import { toast } from "sonner";

export const FinancialModule = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filters = {
    startDate: startDate || null,
    endDate: endDate || null,
  };

  const { 
    transactions, 
    isLoading, 
    kpis, 
    categoryData, 
    deleteTransaction 
  } = useFinancialTransactions(filters);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteTransaction.mutateAsync(id);
        toast.success("Transação excluída com sucesso!");
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        toast.error("Erro ao excluir transação");
      }
    }
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600 mt-2">Controle suas receitas e despesas</p>
        </div>
        <Button 
          className="bg-[#43B26D] hover:bg-[#37A05B]"
          onClick={() => setIsAddDialogOpen(true)}
        >
          + Nova Transação
        </Button>
      </div>

      {/* Filtros de Período */}
      <FinancialFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
      />

      {/* KPIs Principais */}
      <FinancialKPIs kpis={kpis} />

      {/* Gráfico por Categoria */}
      <FinancialChart data={categoryData} />

      {/* Lista de Transações */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Transações</h2>
          <p className="text-gray-600 text-sm mt-1">
            {transactions.length} transação(ões) encontrada(s)
          </p>
        </div>
        <div className="p-6">
          <TransactionTable 
            transactions={transactions}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <AddTransactionDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};
