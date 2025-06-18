
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";

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
}

export const TransactionTable = ({ transactions, onDelete }: TransactionTableProps) => {
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
    return aReceber ? (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
        A Receber
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        Pago
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recorrente</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
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
                  {transaction.recorrente && (
                    <RefreshCw className="h-4 w-4 text-blue-600" title="Transação recorrente" />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
