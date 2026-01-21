
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { formatDateDisplay } from "@/utils/dateUtils";

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

interface OverdueTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overdueTransactions: Transaction[];
}

export const OverdueTransactionsDialog = ({ 
  open, 
  onOpenChange, 
  overdueTransactions 
}: OverdueTransactionsDialogProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTypeColor = (type: string) => {
    return type === "entrada" ? "text-green-600" : "text-red-600";
  };

  const getDaysOverdue = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = dateString.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Transações Vencidas ({overdueTransactions.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[60vh]">
          {overdueTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma transação vencida encontrada! 🎉</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Dias em Atraso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueTransactions.map((transaction) => {
                  const daysOverdue = getDaysOverdue(transaction.data);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDateDisplay(transaction.data)}</TableCell>
                      <TableCell className="font-medium">{transaction.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(transaction.tipo)}>
                          {transaction.tipo === 'entrada' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.categoria}</TableCell>
                      <TableCell className={`font-medium ${getTypeColor(transaction.tipo)}`}>
                        {transaction.tipo === 'entrada' ? '+' : '-'}{formatCurrency(Math.abs(transaction.valor))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {daysOverdue} dia{daysOverdue !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
