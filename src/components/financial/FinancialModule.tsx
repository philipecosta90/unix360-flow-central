import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { FinancialKPIs } from "./FinancialKPIs";
import { FinancialFilters } from "./FinancialFilters";
import { FinancialChart } from "./FinancialChart";
import { TransactionTable } from "./TransactionTable";
import { ExportDialog } from "./ExportDialog";
import { OverdueTransactionsDialog } from "./OverdueTransactionsDialog";
import { toast } from "sonner";
import { Download, AlertTriangle, Plus } from "lucide-react";
export const FinancialModule = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isOverdueDialogOpen, setIsOverdueDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const filters = {
    startDate: startDate || null,
    endDate: endDate || null
  };
  const {
    transactions,
    isLoading,
    kpis,
    categoryData,
    overdueTransactions,
    overdueCount,
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
    return <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Carregando dados financeiros...</p>
        </div>
      </div>;
  }
  return <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600 mt-2">Controle suas receitas e despesas</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {overdueCount > 0 && <Button variant="outline" onClick={() => setIsOverdueDialogOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2 w-full sm:w-auto">
              <AlertTriangle className="h-4 w-4" />
              <Badge variant="destructive" className="ml-1">
                {overdueCount}
              </Badge>
              <span className="hidden sm:inline">Vencidas</span>
            </Button>}
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="bg-[#43B26D] hover:bg-[#37A05B] w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <FinancialFilters startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onClearFilters={handleClearFilters} />

      {/* KPIs Principais */}
      <FinancialKPIs kpis={kpis} />

      {/* Lista de Transações */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 sm:p-6 border-b bg-slate-600">
          <h2 className="text-lg sm:text-xl font-semibold">Transações</h2>
          <p className="text-sm mt-1 text-slate-950">
            {transactions.length} transação(ões) encontrada(s)
          </p>
        </div>
        <div className="p-0 sm:p-6 bg-slate-400">
          <TransactionTable transactions={transactions} onDelete={handleDelete} />
        </div>
      </div>

      {/* Gráfico por Categoria */}
      <FinancialChart data={categoryData} />

      <AddTransactionDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      <ExportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} transactions={transactions} kpis={kpis} startDate={startDate} endDate={endDate} />

      <OverdueTransactionsDialog open={isOverdueDialogOpen} onOpenChange={setIsOverdueDialogOpen} overdueTransactions={overdueTransactions} />
    </div>;
};