import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, Pencil } from "lucide-react";
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
interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}
export const TransactionTable = ({
  transactions,
  onDelete,
  onEdit
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
    return type === "entrada" ? "text-green-600" : "text-red-600";
  };
  const getStatusBadge = (aReceber: boolean) => {
    return aReceber ? <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
        A Receber
      </Badge> : <Badge variant="outline" className="bg-green-100 text-green-800">
        Pago
      </Badge>;
  };
  return <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-slate-950">Data</TableHead>
            <TableHead className="bg-slate-950">Descrição</TableHead>
            <TableHead className="bg-slate-950">Tipo</TableHead>
            <TableHead className="bg-slate-950">Categoria</TableHead>
            <TableHead className="bg-slate-950">Valor</TableHead>
            <TableHead className="bg-slate-950">Status</TableHead>
            <TableHead className="bg-slate-950">Recorrente</TableHead>
            <TableHead className="w-[80px] bg-slate-950">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow> : transactions.map(transaction => <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.data)}</TableCell>
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
                  {getStatusBadge(transaction.a_receber)}
                </TableCell>
                <TableCell>
                  {transaction.recorrente && <RefreshCw className="h-4 w-4 text-blue-600" aria-label="Transação recorrente" />}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)} className="text-blue-600 hover:text-blue-800">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(transaction.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};