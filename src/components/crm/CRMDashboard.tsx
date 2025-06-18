
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Users, Target, Handshake, CheckCircle, DollarSign } from "lucide-react";
import { useCRMDashboard } from "@/hooks/useCRMDashboard";

export const CRMDashboard = () => {
  const { data: dashboardData, isLoading } = useCRMDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral do pipeline de vendas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const kpis = [
    {
      title: "Total de Prospects",
      value: dashboardData?.totalProspects || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Leads",
      value: dashboardData?.totalLeads || 0,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Em Negociação",
      value: dashboardData?.totalNegotiation || 0,
      icon: Handshake,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Fechados",
      value: dashboardData?.totalClosed || 0,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Valor Estimado Total",
      value: formatCurrency(dashboardData?.totalEstimatedValue || 0),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ];

  const chartConfig = {
    count: {
      label: "Prospects",
      color: "#43B26D",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral do pipeline de vendas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Prospects by Stage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Prospects por Estágio</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.prospectsByStage || []}>
                <XAxis 
                  dataKey="stage" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="#43B26D" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
