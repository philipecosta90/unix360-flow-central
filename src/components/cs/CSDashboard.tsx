
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Users, TrendingUp } from "lucide-react";

export const CSDashboard = () => {
  const { useCSData } = useCustomerSuccess();
  const { data: csData, isLoading } = useCSData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
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
    );
  }

  const kpis = [
    {
      title: "Total de Clientes",
      value: csData?.totalClientes?.toString() || "0",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Onboarding Concluído",
      value: `${csData?.percentualOnboarding?.toFixed(1) || 0}%`,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "NPS Médio",
      value: csData?.npsMedian?.toFixed(1) || "0.0",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Clientes em Risco",
      value: csData?.clientesEmRisco?.toString() || "0",
      icon: AlertTriangle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                <IconComponent className={`h-5 w-5 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Clientes em Risco */}
      {csData?.clientesRiscoDetalhes && csData.clientesRiscoDetalhes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clientes em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {csData.clientesRiscoDetalhes.slice(0, 5).map((cliente, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{cliente.nome}</p>
                    <p className="text-sm text-gray-600">{cliente.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium">Sem interação há mais de 30 dias</p>
                    <p className="text-xs text-gray-500">Necessita follow-up</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Interações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {csData?.interacoesRecentes && csData.interacoesRecentes.length > 0 ? (
                csData.interacoesRecentes.slice(0, 5).map((interacao, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full ${
                      interacao.tipo === 'call' ? 'bg-blue-500' :
                      interacao.tipo === 'email' ? 'bg-green-500' :
                      interacao.tipo === 'meeting' ? 'bg-purple-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{interacao.titulo}</p>
                      <p className="text-sm text-gray-600">
                        {interacao.clientes?.nome} • {interacao.tipo}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(interacao.data_interacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma interação recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {csData?.onboardings && csData.onboardings.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Passos</span>
                    <span className="font-medium">{csData.onboardings.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Concluídos</span>
                    <span className="font-medium text-green-600">
                      {csData.onboardings.filter(o => o.concluido).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pendentes</span>
                    <span className="font-medium text-orange-600">
                      {csData.onboardings.filter(o => !o.concluido).length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${csData.percentualOnboarding}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum onboarding configurado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
