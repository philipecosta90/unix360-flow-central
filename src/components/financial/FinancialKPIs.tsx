
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialKPIsProps {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    balance: number;
    pendingRevenue: number;
  };
}

export const FinancialKPIs = ({ kpis }: FinancialKPIsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <span className="mr-2">💚</span> Receita do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-financial-revenue">
            {formatCurrency(kpis.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total de entradas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <span className="mr-2">❤️</span> Despesas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-financial-expense">
            {formatCurrency(kpis.totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total de saídas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <span className="mr-2">💰</span> Saldo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${kpis.balance >= 0 ? 'text-financial-balance-positive' : 'text-financial-balance-negative'}`}>
            {formatCurrency(kpis.balance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <span className="mr-2">⏰</span> A Receber
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-financial-pending">
            {formatCurrency(kpis.pendingRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Valores futuros</p>
        </CardContent>
      </Card>
    </div>
  );
};
