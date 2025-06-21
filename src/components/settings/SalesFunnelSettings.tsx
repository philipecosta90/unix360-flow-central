
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { type NicheConfig } from "@/constants/nicheTemplates";

interface SalesFunnelSettingsProps {
  config: NicheConfig;
  onConfigChange: (config: NicheConfig) => void;
}

export const SalesFunnelSettings = ({ config, onConfigChange }: SalesFunnelSettingsProps) => {
  const [newStage, setNewStage] = useState('');

  const addStage = () => {
    if (newStage.trim()) {
      onConfigChange({
        ...config,
        leadStages: [...config.leadStages, newStage.trim()]
      });
      setNewStage('');
    }
  };

  const removeStage = (index: number) => {
    onConfigChange({
      ...config,
      leadStages: config.leadStages.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {config.leadStages.map((stage, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2">
              {stage}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => removeStage(index)}
              />
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Nova etapa do funil"
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addStage()}
          />
          <Button onClick={addStage} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
