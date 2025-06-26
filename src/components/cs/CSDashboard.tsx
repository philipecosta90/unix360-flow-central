
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { Users, CheckCircle, AlertTriangle, Activity, Clock } from "lucide-react";

export const CSDashboard = () => {
  const { useCSData } = useCustomerSuccess();
  const { data: csData, isLoading } = useCSData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total de Clientes",
      value: csData?.totalClientes || 0,
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
      title: "Clientes em Risco",
      value: csData?.clientesEmRisco || 0,
      icon: AlertTriangle,
      color: "text-red-600"
    },
    {
      title: "Interações Recentes",
      value: csData?.interacoesRecentes?.length || 0,
      icon: Activity,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Interações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {csData?.interacoesRecentes && csData.interacoesRecentes.length > 0 ? (
              csData.interacoesRecentes.map((interacao) => (
                <div key={interacao.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{interacao.titulo}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(interacao.data_interacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {interacao.clientes && (
                      <p className="text-sm text-gray-600">Cliente: {interacao.clientes.nome}</p>
                    )}
                    {interacao.descricao && (
                      <p className="text-sm text-gray-500 mt-1">{interacao.descricao}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma interação recente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clientes em Risco */}
      {csData?.clientesRiscoDetalhes && csData.clientesRiscoDetalhes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Clientes em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {csData.clientesRiscoDetalhes.map((cliente) => (
                <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cliente.nome}</p>
                      <p className="text-sm text-gray-600">{cliente.email}</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {cliente.diasSemInteracao} dias
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
