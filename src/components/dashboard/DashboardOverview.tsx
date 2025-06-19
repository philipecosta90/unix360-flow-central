import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral do seu negócio</p>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral do seu negócio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <span className={`text-2xl ${kpi.color}`}>{kpi.icon}</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              {kpi.title.includes("Mensal") && (
                <p className="text-xs text-gray-500 mt-1">
                  Referente ao mês atual
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.atividadesRecentes.length ? (
                dashboardData.atividadesRecentes.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.tipo === 'cliente' ? 'bg-blue-500' :
                      activity.tipo === 'tarefa' ? 'bg-green-500' :
                      activity.tipo === 'prospect' ? 'bg-purple-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.client}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ProximasTarefas />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Componente separado para as próximas tarefas
const ProximasTarefas = () => {
  const { data: proximasTarefas, isLoading } = useQuery({
    queryKey: ['proximas-tarefas'],
    queryFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) return [];

      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('user_id', userResponse.user.id)
        .single();

      if (!profile?.empresa_id) return [];

      const hoje = new Date().toISOString().split('T')[0];
      const proximaSemana = new Date();
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      const proximaSemanaStr = proximaSemana.toISOString().split('T')[0];

      const { data } = await supabase
        .from('financeiro_tarefas')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('concluida', false)
        .gte('vencimento', hoje)
        .lte('vencimento', proximaSemanaStr)
        .order('vencimento', { ascending: true })
        .limit(4);

      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-3 rounded-lg bg-gray-50">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!proximasTarefas?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma tarefa próxima</p>
      </div>
    );
  }

  const formatarDataVencimento = (vencimento: string) => {
    const data = new Date(vencimento);
    const hoje = new Date();
    const diffTime = data.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays <= 7) return `Em ${diffDays} dias`;
    return data.toLocaleDateString('pt-BR');
  };

  const getPrioridade = (vencimento: string) => {
    const data = new Date(vencimento);
    const hoje = new Date();
    const diffTime = data.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return { label: "Urgente", color: "bg-red-100 text-red-600" };
    if (diffDays <= 3) return { label: "Alta", color: "bg-orange-100 text-orange-600" };
    return { label: "Normal", color: "bg-green-100 text-green-600" };
  };

  return (
    <>
      {proximasTarefas.map((task, index) => {
        const prioridade = getPrioridade(task.vencimento);
        return (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">{task.descricao}</p>
              <p className="text-xs text-gray-600">{formatarDataVencimento(task.vencimento)}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${prioridade.color}`}>
              {prioridade.label}
            </span>
          </div>
        );
      })}
    </>
  );
};
