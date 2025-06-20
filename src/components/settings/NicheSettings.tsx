
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required: boolean;
}

interface NicheConfig {
  name: string;
  leadStages: string[];
  customFields: CustomField[];
  metrics: string[];
}

const NICHE_TEMPLATES = {
  fitness: {
    name: "Academia/Estúdio",
    leadStages: ["Interesse", "Avaliação", "Proposta", "Matrícula", "Ativo"],
    customFields: [
      { id: '1', name: 'Objetivo', type: 'select' as const, options: ['Emagrecimento', 'Hipertrofia', 'Condicionamento'], required: true },
      { id: '2', name: 'Experiência', type: 'select' as const, options: ['Iniciante', 'Intermediário', 'Avançado'], required: false }
    ],
    metrics: ['Frequência Semanal', 'IMC', 'Peso Atual', 'Meta de Peso']
  },
  consultoria: {
    name: "Consultoria",
    leadStages: ["Contato Inicial", "Diagnóstico", "Proposta", "Contrato", "Execução"],
    customFields: [
      { id: '1', name: 'Tipo de Consultoria', type: 'select' as const, options: ['Fitness', 'Nutricional', 'Performance'], required: true },
      { id: '2', name: 'Objetivo Principal', type: 'text' as const, required: true },
      { id: '3', name: 'IMC Inicial', type: 'number' as const, required: false }
    ],
    metrics: ['Sessões Realizadas', 'Resultados Alcançados', 'Satisfação', 'Renovações']
  },
  medical: {
    name: "Clínica Médica",
    leadStages: ["Agendamento", "Consulta", "Retorno", "Tratamento", "Alta"],
    customFields: [
      { id: '1', name: 'Especialidade', type: 'select' as const, options: ['Cardiologia', 'Dermatologia', 'Pediatria'], required: true },
      { id: '2', name: 'Plano de Saúde', type: 'text' as const, required: false }
    ],
    metrics: ['Consultas/Mês', 'Taxa de Retorno', 'Satisfação', 'Tempo Médio']
  },
  dental: {
    name: "Consultório Odontológico",
    leadStages: ["Triagem", "Orçamento", "Aprovação", "Tratamento", "Finalizado"],
    customFields: [
      { id: '1', name: 'Tratamento', type: 'select' as const, options: ['Limpeza', 'Restauração', 'Implante', 'Ortodontia'], required: true },
      { id: '2', name: 'Urgência', type: 'select' as const, options: ['Baixa', 'Média', 'Alta'], required: false }
    ],
    metrics: ['Procedimentos/Mês', 'Valor Médio', 'Tempo de Tratamento', 'Retorno']
  }
} satisfies Record<string, NicheConfig>;

export const NicheSettings = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [selectedNiche, setSelectedNiche] = useState<keyof typeof NICHE_TEMPLATES | 'custom'>('fitness');
  const [config, setConfig] = useState<NicheConfig>({
    ...NICHE_TEMPLATES.fitness,
    leadStages: [...NICHE_TEMPLATES.fitness.leadStages],
    customFields: [...NICHE_TEMPLATES.fitness.customFields],
    metrics: [...NICHE_TEMPLATES.fitness.metrics]
  });
  const [newStage, setNewStage] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNicheChange = (niche: keyof typeof NICHE_TEMPLATES | 'custom') => {
    setSelectedNiche(niche);
    if (niche !== 'custom') {
      const template = NICHE_TEMPLATES[niche];
      setConfig({
        ...template,
        leadStages: [...template.leadStages],
        customFields: [...template.customFields],
        metrics: [...template.metrics]
      });
    }
  };

  const addStage = () => {
    if (newStage.trim()) {
      setConfig(prev => ({
        ...prev,
        leadStages: [...prev.leadStages, newStage.trim()]
      }));
      setNewStage('');
    }
  };

  const removeStage = (index: number) => {
    setConfig(prev => ({
      ...prev,
      leadStages: prev.leadStages.filter((_, i) => i !== index)
    }));
  };

  const addMetric = () => {
    if (newMetric.trim()) {
      setConfig(prev => ({
        ...prev,
        metrics: [...prev.metrics, newMetric.trim()]
      }));
      setNewMetric('');
    }
  };

  const removeMetric = (index: number) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSettings = async () => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Usuário não está associado a uma empresa.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Salvar configurações de nicho na tabela empresas
      const { error } = await supabase
        .from('empresas')
        .update({
          // Armazenamos as configurações como JSON em um campo personalizado
          configuracoes_nicho: {
            niche_type: selectedNiche,
            config: config,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', userProfile.empresa_id);

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar as configurações. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Configurações salvas!",
        description: "As configurações do nicho foram salvas com sucesso.",
      });

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Nicho</h1>
          <p className="text-gray-600 mt-2">Personalize o sistema para seu tipo de negócio</p>
        </div>
        <Settings className="w-8 h-8 text-[#43B26D]" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de Negócio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecione seu nicho</Label>
            <Select value={selectedNiche} onValueChange={handleNicheChange}>
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
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Academia Fit"
            />
          </div>
        </CardContent>
      </Card>

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

      <div className="flex justify-end">
        <Button 
          className="bg-[#43B26D] hover:bg-[#37A05B]"
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};
