
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  a_receber: boolean;
  recorrente: boolean;
}

interface KPIs {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  pendingRevenue: number;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  kpis: KPIs;
  startDate?: string;
  endDate?: string;
}

export const ExportDialog = ({ 
  open, 
  onOpenChange, 
  transactions, 
  kpis,
  startDate,
  endDate 
}: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generateCSVContent = () => {
    const period = startDate && endDate ? 
      `Período: ${formatDate(startDate)} - ${formatDate(endDate)}` : 'Período: Mês atual';
    
    let csvContent = `Relatório Financeiro - UniX360\n`;
    csvContent += `${period}\n\n`;
    csvContent += `KPIs:\n`;
    csvContent += `Receita Total,${formatCurrency(kpis.totalRevenue)}\n`;
    csvContent += `Despesas Totais,${formatCurrency(kpis.totalExpenses)}\n`;
    csvContent += `Saldo,${formatCurrency(kpis.balance)}\n`;
    csvContent += `A Receber,${formatCurrency(kpis.pendingRevenue)}\n\n`;
    
    csvContent += `Transações:\n`;
    csvContent += `Data,Descrição,Tipo,Categoria,Valor,Status,Recorrente\n`;
    
    transactions.forEach(transaction => {
      const valor = transaction.tipo === 'entrada' ? 
        formatCurrency(transaction.valor) : 
        formatCurrency(-transaction.valor);
      const status = transaction.a_receber ? 'A Receber' : 'Pago';
      const recorrente = transaction.recorrente ? 'Sim' : 'Não';
      const tipo = transaction.tipo === 'entrada' ? 'Receita' : 'Despesa';
      
      csvContent += `${formatDate(transaction.data)},${transaction.descricao},${tipo},${transaction.categoria},${valor},${status},${recorrente}\n`;
    });

    return csvContent;
  };

  const downloadCSV = () => {
    setIsExporting(true);
    try {
      const csvContent = generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Arquivo CSV exportado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error("Erro ao exportar arquivo CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExcel = () => {
    setIsExporting(true);
    try {
      // Gerar conteúdo HTML que pode ser aberto como Excel
      const period = startDate && endDate ? 
        `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Mês atual';
      
      let htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Relatório Financeiro</title>
          </head>
          <body>
            <h1>Relatório Financeiro - UniX360</h1>
            <p><strong>Período:</strong> ${period}</p>
            
            <h2>KPIs</h2>
            <table border="1">
              <tr><td>Receita Total</td><td>${formatCurrency(kpis.totalRevenue)}</td></tr>
              <tr><td>Despesas Totais</td><td>${formatCurrency(kpis.totalExpenses)}</td></tr>
              <tr><td>Saldo</td><td>${formatCurrency(kpis.balance)}</td></tr>
              <tr><td>A Receber</td><td>${formatCurrency(kpis.pendingRevenue)}</td></tr>
            </table>
            
            <h2>Transações</h2>
            <table border="1">
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Recorrente</th>
              </tr>
      `;
      
      transactions.forEach(transaction => {
        const valor = transaction.tipo === 'entrada' ? 
          formatCurrency(transaction.valor) : 
          formatCurrency(-transaction.valor);
        const status = transaction.a_receber ? 'A Receber' : 'Pago';
        const recorrente = transaction.recorrente ? 'Sim' : 'Não';
        const tipo = transaction.tipo === 'entrada' ? 'Receita' : 'Despesa';
        
        htmlContent += `
          <tr>
            <td>${formatDate(transaction.data)}</td>
            <td>${transaction.descricao}</td>
            <td>${tipo}</td>
            <td>${transaction.categoria}</td>
            <td>${valor}</td>
            <td>${status}</td>
            <td>${recorrente}</td>
          </tr>
        `;
      });
      
      htmlContent += `
            </table>
          </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Arquivo Excel exportado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error("Erro ao exportar arquivo Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Exportar Dados Financeiros</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Os dados serão exportados considerando o período atual e incluirão KPIs e lista de transações.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={downloadCSV}
              disabled={isExporting}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exportando..." : "Exportar CSV"}
            </Button>
            
            <Button 
              onClick={downloadExcel}
              disabled={isExporting}
              className="w-full flex items-center gap-2 bg-[#43B26D] hover:bg-[#37A05B]"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exportando..." : "Exportar Excel"}
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
