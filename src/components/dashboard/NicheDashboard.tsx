
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Calendar, Target, AlertTriangle } from "lucide-react";

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
}

const FITNESS_METRICS: DashboardMetric[] = [
  { title: "Alunos Ativos", value: "127", change: "+12%", trend: 'up', icon: Users },
  { title: "Receita Mensal", value: "R$ 15.240", change: "+8%", trend: 'up', icon: DollarSign },
  { title: "Frequência Média", value: "3.2x/sem", change: "+0.3", trend: 'up', icon: Target },
  { title: "Aulas Hoje", value: "8", change: "2 restantes", trend: 'stable', icon: Calendar }
];

const MEDICAL_METRICS: DashboardMetric[] = [
  { title: "Pacientes Ativos", value: "89", change: "+5%", trend: 'up', icon: Users },
  { title: "Receita Mensal", value: "R$ 28.500", change: "+12%", trend: 'up', icon: DollarSign },
  { title: "Consultas/Dia", value: "12", change: "Média", trend: 'stable', icon: Calendar },
  { title: "Taxa Retorno", value: "78%", change: "+3%", trend: 'up', icon: Target }
];

const DENTAL_METRICS: DashboardMetric[] = [
  { title: "Pacientes Ativos", value: "156", change: "+7%", trend: 'up', icon: Users },
  { title: "Receita Mensal", value: "R$ 32.100", change: "+15%", trend: 'up', icon: DollarSign },
  { title: "Procedimentos", value: "45", change: "Este mês", trend: 'stable', icon: Target },
  { title: "Agendamentos", value: "23", change: "Próximos 7 dias", trend: 'stable', icon: Calendar }
];

interface NicheDashboardProps {
  niche: 'fitness' | 'medical' | 'dental';
}

export const NicheDashboard = ({ niche }: NicheDashboardProps) => {
  const getMetrics = () => {
    switch (niche) {
      case 'fitness': return FITNESS_METRICS;
      case 'medical': return MEDICAL_METRICS;
      case 'dental': return DENTAL_METRICS;
      default: return FITNESS_METRICS;
    }
  };

  const getNicheAlerts = () => {
    switch (niche) {
      case 'fitness':
        return [
          "3 alunos sem frequência há 7 dias",
          "2 mensalidades em atraso",
          "Equipamento X precisa de manutenção"
        ];
      case 'medical':
        return [
          "5 pacientes sem retorno há 30 dias",
          "2 exames pendentes de análise",
          "Agenda livre na próxima semana"
        ];
      case 'dental':
        return [
          "4 orçamentos aguardando aprovação",
          "1 tratamento em atraso",
          "Material X com estoque baixo"
        ];
      default:
        return [];
    }
  };

  const metrics = getMetrics();
  const alerts = getNicheAlerts();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-[#43B26D]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                  <span className={metric.trend === 'up' ? 'text-green-600' : 'text-gray-600'}>
                    {metric.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas e Ações Necessárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-800">{alert}</span>
                <Badge variant="secondary" className="text-orange-700">
                  Ação Necessária
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
