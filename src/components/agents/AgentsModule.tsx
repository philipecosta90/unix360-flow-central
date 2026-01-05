import { useState } from 'react';
import { 
  Bot, 
  FileSearch, 
  ClipboardCheck, 
  TrendingUp, 
  MessageSquarePlus, 
  Utensils, 
  Dumbbell,
  Sparkles 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AgentCard, AgentInfo } from './AgentCard';
import { AgentDialog } from './AgentDialog';

const agents: AgentInfo[] = [
  {
    id: 'exame',
    name: 'Leitor de Exames',
    description: 'Interpreta resultados de exames laboratoriais e destaca pontos de atenção.',
    icon: FileSearch,
    color: 'bg-blue-500',
  },
  {
    id: 'anamnese',
    name: 'Analista de Anamnese',
    description: 'Analisa anamneses e identifica informações relevantes para prescrição.',
    icon: ClipboardCheck,
    color: 'bg-purple-500',
  },
  {
    id: 'checkin',
    name: 'Analista de Check-in',
    description: 'Analisa evolução do cliente nos check-ins e identifica tendências.',
    icon: TrendingUp,
    color: 'bg-green-500',
  },
  {
    id: 'feedback',
    name: 'Gerador de Feedback',
    description: 'Cria feedbacks personalizados e motivacionais para alunos e profissionais.',
    icon: MessageSquarePlus,
    color: 'bg-orange-500',
  },
  {
    id: 'dieta',
    name: 'Montador de Dieta',
    description: 'Sugere planos alimentares personalizados baseados nos objetivos.',
    icon: Utensils,
    color: 'bg-emerald-500',
  },
  {
    id: 'treino',
    name: 'Montador de Treino',
    description: 'Cria protocolos de treino personalizados com séries e repetições.',
    icon: Dumbbell,
    color: 'bg-red-500',
  },
];

export const AgentsModule = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Agentes IA</h2>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            teste
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Assistentes inteligentes para aumentar sua produtividade. Selecione um agente abaixo para começar.
          <span className="block mt-1 text-xs text-muted-foreground">
            Os resultados são sugestões e devem ser validados pelo profissional.
          </span>
        </AlertDescription>
      </Alert>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            onSelect={() => setSelectedAgent(agent)} 
          />
        ))}
      </div>

      {/* Agent Dialog */}
      <AgentDialog 
        agent={selectedAgent}
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
};
