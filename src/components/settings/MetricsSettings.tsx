
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { type NicheConfig } from "@/constants/nicheTemplates";

interface MetricsSettingsProps {
  config: NicheConfig;
  onConfigChange: (config: NicheConfig) => void;
}

export const MetricsSettings = ({ config, onConfigChange }: MetricsSettingsProps) => {
  const [newMetric, setNewMetric] = useState('');

  const addMetric = () => {
    if (newMetric.trim()) {
      onConfigChange({
        ...config,
        metrics: [...config.metrics, newMetric.trim()]
      });
      setNewMetric('');
    }
  };

  const removeMetric = (index: number) => {
    onConfigChange({
      ...config,
      metrics: config.metrics.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de Sucesso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {config.metrics.map((metric, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-2">
              {metric}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => removeMetric(index)}
              />
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Nova métrica"
            value={newMetric}
            onChange={(e) => setNewMetric(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMetric()}
          />
          <Button onClick={addMetric} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
