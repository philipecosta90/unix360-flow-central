
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";

export const CSDashboard = () => {
  const { useCSData } = useCustomerSuccess();
  const { data: csData, isLoading } = useCSData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{csData?.totalClientes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos e em onboarding
            </p>
          </CardContent>
        </Card>

        {/* Onboarding Concluído */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {csData?.percentualOnboarding?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de conclusão do onboarding
            </p>
          </CardContent>
        </Card>

        {/* Clientes em Risco */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {csData?.clientesEmRisco || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sem interação há mais de 7 dias
            </p>
          </CardContent>
        </Card>

        {/* Interações Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {csData?.interacoesRecentes?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 10 interações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interações Recentes */}
      {csData?.interacoesRecentes && csData.interacoesRecentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {csData.interacoesRecentes.slice(0, 5).map((interacao) => (
                <div key={interacao.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{interacao.titulo}</p>
                    <p className="text-sm text-gray-600">
                      {interacao.clientes?.nome} - {interacao.tipo}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(interacao.data_interacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
