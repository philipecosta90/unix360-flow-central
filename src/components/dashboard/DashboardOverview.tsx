import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { ProximasTarefas } from "./ProximasTarefas";
import { Button } from "@/components/ui/button";

export const DashboardOverview = () => {
  const { data: dashboardData, isLoading } = useDashboardData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral do seu negócio</p>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Clientes Ativos",
      value: dashboardData?.clientesAtivos.toString() || "0",
      change: "",
      positive: true,
      icon: "👥",
      color: "text-blue-600"
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(dashboardData?.receitaMensal || 0),
      change: "",
      positive: true,
      icon: "💰",
      color: "text-green-600"
    },
    {
      title: "Despesas do Mês",
      value: formatCurrency(dashboardData?.despesasMensal || 0),
      change: "",
      positive: false,
      icon: "💸",
      color: "text-red-600"
    },
    {
      title: "Saldo do Mês",
      value: formatCurrency(dashboardData?.saldoMensal || 0),
      change: "",
      positive: (dashboardData?.saldoMensal || 0) >= 0,
      icon: "📊",
      color: (dashboardData?.saldoMensal || 0) >= 0 ? "text-green-600" : "text-red-600"
    },
    {
      title: "A Receber",
      value: formatCurrency(dashboardData?.aReceber || 0),
      change: "",
      positive: true,
      icon: "⏰",
      color: "text-yellow-600"
    },
    {
      title: "Tarefas Pendentes",
      value: dashboardData?.tarefasPendentes.toString() || "0",
      change: "",
      positive: false,
      icon: "❗",
      color: "text-orange-600"
    },
    {
      title: "Tarefas Concluídas",
      value: dashboardData?.tarefasConcluidas.toString() || "0",
      change: "",
      positive: true,
      icon: "✅",
      color: "text-green-600"
    },
    {
      title: "Propostas Enviadas",
      value: dashboardData?.propostasEnviadas.toString() || "0",
      change: "",
      positive: true,
      icon: "📧",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral do seu negócio</p>
        </div>
        
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
                {kpi.title}
              </CardTitle>
              <span className={`text-xl sm:text-2xl ${kpi.color}`}>{kpi.icon}</span>
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-2xl font-bold ${kpi.color} break-words`}>{kpi.value}</div>
              {kpi.title.includes("Mensal") && (
                <p className="text-xs text-gray-500 mt-1">
                  Referente ao mês atual
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próximas Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Próximas Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ProximasTarefas />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};