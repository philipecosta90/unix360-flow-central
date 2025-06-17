
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const FinancialModule = () => {
  const [transactions] = useState([
    {
      id: 1,
      type: "Receita",
      description: "Pagamento João Silva - Coaching Premium",
      amount: 2500,
      date: "2024-01-15",
      status: "Pago",
      category: "Serviços"
    },
    {
      id: 2,
      type: "Receita",
      description: "Pagamento Maria Santos - Consultoria",
      amount: 1800,
      date: "2024-01-14",
      status: "Pendente",
      category: "Serviços"
    },
    {
      id: 3,
      type: "Despesa",
      description: "Software de gestão mensal",
      amount: -299,
      date: "2024-01-10",
      status: "Pago",
      category: "Tecnologia"
    },
    {
      id: 4,
      type: "Despesa",
      description: "Marketing digital - Google Ads",
      amount: -850,
      date: "2024-01-08",
      status: "Pago",
      category: "Marketing"
    }
  ]);

  const monthlyStats = {
    totalRevenue: 47560,
    totalExpenses: 12300,
    netProfit: 35260,
    pendingRevenue: 8900
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pago": return "bg-green-100 text-green-800";
      case "Pendente": return "bg-yellow-100 text-yellow-800";
      case "Atrasado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "Receita" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600 mt-2">Controle suas receitas e despesas</p>
        </div>
        <Button className="bg-[#43B26D] hover:bg-[#37A05B]">
          + Nova Transação
        </Button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <span className="mr-2">💚</span> Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {monthlyStats.totalRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-500 mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <span className="mr-2">❤️</span> Despesas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {monthlyStats.totalExpenses.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-500 mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <span className="mr-2">💰</span> Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#43B26D]">
              R$ {monthlyStats.netProfit.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-500 mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <span className="mr-2">⏰</span> A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {monthlyStats.pendingRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pendente</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.amount > 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR')}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Relatórios em desenvolvimento</p>
                <Button className="mt-4 bg-[#43B26D] hover:bg-[#37A05B]">
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
