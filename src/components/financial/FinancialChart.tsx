
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface CategoryData {
  categoria: string;
  tipo: string;
  valor: number;
}

interface FinancialChartProps {
  data: CategoryData[];
}

export const FinancialChart = ({ data }: FinancialChartProps) => {
  const chartData = data.map(item => ({
    name: item.categoria,
    entrada: item.tipo === 'entrada' ? item.valor : 0,
    saida: item.tipo === 'saida' ? item.valor : 0,
  }));

  // Group by category and sum values
  const groupedData = chartData.reduce((acc, item) => {
    const existing = acc.find(x => x.name === item.name);
    if (existing) {
      existing.entrada += item.entrada;
      existing.saida += item.saida;
    } else {
      acc.push(item);
    }
    return acc;
  }, [] as { name: string; entrada: number; saida: number }[]);

  const chartConfig = {
    entrada: {
      label: "Receitas",
      color: "#22c55e",
    },
    saida: {
      label: "Despesas", 
      color: "#ef4444",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {groupedData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="entrada" fill="var(--color-entrada)" />
                <Bar dataKey="saida" fill="var(--color-saida)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-80 text-gray-500">
            Nenhum dado disponível para exibir o gráfico
          </div>
        )}
      </CardContent>
    </Card>
  );
};
