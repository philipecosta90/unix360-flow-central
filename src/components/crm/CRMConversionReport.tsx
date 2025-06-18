
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, Target, Users } from "lucide-react";
import { useCRMConversion } from "@/hooks/useCRMConversion";

export const CRMConversionReport = () => {
  const { data: conversionData, isLoading } = useCRMConversion();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatório de Conversão</h2>
          <p className="text-gray-600 mt-2">Análise do funil de conversão de prospects</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Taxa de Conversão",
      value: `${conversionData?.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total de Prospects",
      value: conversionData?.totalProspects || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Prospects Fechados",
      value: conversionData?.closedProspects || 0,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
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
        <h2 className="text-2xl font-bold text-gray-900">Relatório de Conversão</h2>
        <p className="text-gray-600 mt-2">Análise do funil de conversão de prospects</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão por Estágio</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={conversionData?.stageData || []} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-gray-600">
                            Prospects: {data.count}
                          </p>
                          <p className="text-sm text-gray-600">
                            Percentual: {data.percentage.toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#43B26D" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Stage Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Estágio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversionData?.stageData.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-[#43B26D] rounded-full"></div>
                  <span className="font-medium">{stage.stage}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{stage.count} prospects</span>
                  <span className="font-medium">{stage.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
