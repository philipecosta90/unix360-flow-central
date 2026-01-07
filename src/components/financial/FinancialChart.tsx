import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  CartesianGrid,
  Area,
  ComposedChart
} from "recharts";
import { formatCurrency } from "@/utils/crmFormatters";

interface MonthlyRevenueData {
  mes: string;
  faturamento: number;
}

interface FinancialChartProps {
  data: MonthlyRevenueData[];
}

export const FinancialChart = ({ data }: FinancialChartProps) => {
  const chartConfig = {
    faturamento: {
      label: "Faturamento",
      color: "hsl(var(--chart-1))",
    },
  };

  const lineChartConfig = {
    faturamento: {
      label: "Faturamento",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="mes" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => formatCurrency(Number(value))}
                    />} 
                  />
                  <Bar 
                    dataKey="faturamento" 
                    fill="var(--color-faturamento)" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              Nenhum dado disponível para exibir o gráfico
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ChartContainer config={lineChartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    <linearGradient id="faturamentoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="mes" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => formatCurrency(Number(value))}
                    />} 
                  />
                  <Area
                    type="monotone"
                    dataKey="faturamento"
                    stroke="transparent"
                    fill="url(#faturamentoGradient)"
                  />
                  <Line 
                    type="monotone"
                    dataKey="faturamento" 
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              Nenhum dado disponível para exibir o gráfico
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
