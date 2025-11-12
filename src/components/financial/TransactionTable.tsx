import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, Pencil, CheckCircle2 } from "lucide-react";
interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  a_receber: boolean;
  recorrente: boolean;
  clientes?: {
    nome: string;
  } | null;
}
interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onToggleReceived: (id: string, currentStatus: boolean) => void;
}
export const TransactionTable = ({
  transactions,
  onDelete,
  onEdit,
  onToggleReceived
}: TransactionTableProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  const getTypeColor = (type: string) => {
    return type === "entrada" ? "text-emerald-600" : "text-red-500";
  };
  const getStatusBadge = (aReceber: boolean) => {
    return aReceber ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
        A Receber
      </Badge> : <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
        Pago
      </Badge>;
  };
  return <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-foreground/15">
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recorrente</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow> : transactions.map(transaction => <TableRow key={transaction.id} className="border-b border-foreground/10 last:border-0">
                <TableCell>{formatDate(transaction.data)}</TableCell>
                <TableCell className="font-medium">{transaction.descricao}</TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.clientes?.nome || '-'}
                </TableCell>
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
                  {getStatusBadge(transaction.a_receber)}
                </TableCell>
                <TableCell>
                  {transaction.recorrente && <RefreshCw className="h-4 w-4 text-primary" aria-label="Transação recorrente" />}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {transaction.tipo === 'entrada' && transaction.a_receber && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onToggleReceived(transaction.id, transaction.a_receber)}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        title="Marcar como recebido"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)} className="text-primary hover:text-primary/80">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(transaction.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};