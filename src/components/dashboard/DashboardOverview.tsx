
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DashboardOverview = () => {
  const kpis = [
    {
      title: "Clientes Ativos",
      value: "127",
      change: "+12%",
      positive: true,
      icon: "👥",
      color: "text-blue-600"
    },
    {
      title: "Receita Mensal",
      value: "R$ 45.760",
      change: "+8%",
      positive: true,
      icon: "💰",
      color: "text-green-600"
    },
    {
      title: "Tarefas Pendentes",
      value: "23",
      change: "-5",
      positive: true,
      icon: "✅",
      color: "text-orange-600"
    },
    {
      title: "Propostas Enviadas",
      value: "15",
      change: "+3",
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
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <p className={`text-xs ${kpi.positive ? 'text-green-600' : 'text-red-600'} mt-1`}>
                {kpi.change} em relação ao mês anterior
              </p>
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
              {[
                { action: "Novo cliente cadastrado", client: "João Silva", time: "2 horas atrás" },
                { action: "Proposta enviada", client: "Maria Santos", time: "4 horas atrás" },
                { action: "Pagamento recebido", client: "Pedro Costa", time: "1 dia atrás" },
                { action: "Tarefa concluída", client: "Ana Oliveira", time: "2 dias atrás" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 bg-[#43B26D] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.client}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: "Follow-up com Maria Santos", priority: "Alta", due: "Hoje" },
                { task: "Enviar proposta para João", priority: "Média", due: "Amanhã" },
                { task: "Reunião de onboarding", priority: "Alta", due: "Sexta" },
                { task: "Revisar contrato Pedro", priority: "Baixa", due: "Próxima semana" }
              ].map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.task}</p>
                    <p className="text-xs text-gray-600">{task.due}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.priority === 'Alta' ? 'bg-red-100 text-red-600' :
                    task.priority === 'Média' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
