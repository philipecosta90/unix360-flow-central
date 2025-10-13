
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Nenhum dado disponível para exibir o gráfico
          </div>
        )}
      </CardContent>
    </Card>
  );
};
