import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AgentInfo } from './AgentCard';
import { ExameAnalyzerAgent } from './ExameAnalyzerAgent';
import { AnamneseAnalyzerAgent } from './AnamneseAnalyzerAgent';
import { CheckinAnalyzerAgent } from './CheckinAnalyzerAgent';
import { FeedbackGeneratorAgent } from './FeedbackGeneratorAgent';
import { DietGeneratorAgent } from './DietGeneratorAgent';
import { TrainingGeneratorAgent } from './TrainingGeneratorAgent';

interface AgentDialogProps {
  agent: AgentInfo | null;
  open: boolean;
  onClose: () => void;
}

export const AgentDialog = ({ agent, open, onClose }: AgentDialogProps) => {
  if (!agent) return null;

  const Icon = agent.icon;

  const renderAgent = () => {
    switch (agent.id) {
      case 'exame':
        return <ExameAnalyzerAgent />;
      case 'anamnese':
        return <AnamneseAnalyzerAgent />;
      case 'checkin':
        return <CheckinAnalyzerAgent />;
      case 'feedback':
        return <FeedbackGeneratorAgent />;
      case 'dieta':
        return <DietGeneratorAgent />;
      case 'treino':
        return <TrainingGeneratorAgent />;
      default:
        return <div>Agente não encontrado</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${agent.color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span>{agent.name}</span>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              teste
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {renderAgent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
