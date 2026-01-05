import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

interface AgentCardProps {
  agent: AgentInfo;
  onSelect: () => void;
}

export const AgentCard = ({ agent, onSelect }: AgentCardProps) => {
  const Icon = agent.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${agent.color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-lg">{agent.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm">
          {agent.description}
        </CardDescription>
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
        >
          Iniciar
        </Button>
      </CardContent>
    </Card>
  );
};
