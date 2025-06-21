
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NICHE_TEMPLATES, type NicheConfig } from "@/constants/nicheTemplates";

interface NicheSelectorProps {
  selectedNiche: keyof typeof NICHE_TEMPLATES | 'custom';
  config: NicheConfig;
  onNicheChange: (niche: keyof typeof NICHE_TEMPLATES | 'custom') => void;
  onConfigChange: (config: NicheConfig) => void;
}

export const NicheSelector = ({ 
  selectedNiche, 
  config, 
  onNicheChange, 
  onConfigChange 
}: NicheSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipo de Negócio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Selecione seu nicho</Label>
          <Select value={selectedNiche} onValueChange={onNicheChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fitness">Academia/Estúdio</SelectItem>
              <SelectItem value="consultoria">Consultoria</SelectItem>
              <SelectItem value="medical">Clínica Médica</SelectItem>
              <SelectItem value="dental">Consultório Odontológico</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nome do Negócio</Label>
          <Input
            value={config.name}
            onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
            placeholder="Ex: Academia Fit"
          />
        </div>
      </CardContent>
    </Card>
  );
};
