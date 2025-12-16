import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { EditTransactionDialog } from "./EditTransactionDialog";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isOverdueDialogOpen, setIsOverdueDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const filters = {
    startDate: startDate || null,
    endDate: endDate || null,
    tipo: tipoFilter && tipoFilter !== "todos" ? tipoFilter as 'entrada' | 'saida' : null
  };
  const {
    transactions,
    isLoading,
    kpis,
    monthlyRevenueData,
    overdueTransactions,
    overdueCount,
    deleteTransaction,
    updateTransaction
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

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleToggleReceived = async (id: string, currentStatus: boolean) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) {
        toast.error("Transação não encontrada");
        return;
      }

      await updateTransaction.mutateAsync({
        id: transaction.id,
        tipo: transaction.tipo,
        descricao: transaction.descricao,
        valor: transaction.valor,
        categoria: transaction.categoria,
        data: transaction.data,
        a_receber: false,
        recorrente: transaction.recorrente,
        cliente_id: transaction.cliente_id,
      });

      toast.success("Transação marcada como recebida! 💰");
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error("Erro ao atualizar status da transação");
    }
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setTipoFilter("");
  };
  if (isLoading) {
    return <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>;
  }
  return <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-2">Controle suas receitas e despesas</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {overdueCount > 0 && <Button variant="outline" onClick={() => setIsOverdueDialogOpen(true)} className="text-destructive border-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 w-full sm:w-auto">
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
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Filtros de Período e Tipo */}
      <FinancialFilters startDate={startDate} endDate={endDate} tipo={tipoFilter} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onTipoChange={setTipoFilter} onClearFilters={handleClearFilters} />

      {/* KPIs Principais */}
      <FinancialKPIs kpis={kpis} />

      {/* Lista de Transações */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 sm:p-6 border-b bg-muted">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Transações</h2>
          <p className="text-sm mt-1 text-muted-foreground">
            {transactions.length} transação(ões) encontrada(s)
          </p>
        </div>
        <div className="p-0 sm:p-6 bg-card">
          <TransactionTable transactions={transactions} onDelete={handleDelete} onEdit={handleEdit} onToggleReceived={handleToggleReceived} />
        </div>
      </div>

      {/* Gráfico de Faturamento Mensal */}
      <FinancialChart data={monthlyRevenueData} />

      <AddTransactionDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      <EditTransactionDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        transaction={editingTransaction}
      />

      <ExportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} transactions={transactions} kpis={kpis} startDate={startDate} endDate={endDate} />

      <OverdueTransactionsDialog open={isOverdueDialogOpen} onOpenChange={setIsOverdueDialogOpen} overdueTransactions={overdueTransactions} />
    </div>;
};