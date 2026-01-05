import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AgentChat } from './AgentChat';
import { useAIAgent } from '@/hooks/useAIAgent';

const equipamentos = [
  { id: 'halter', label: 'Halteres' },
  { id: 'barra', label: 'Barras' },
  { id: 'maquinas', label: 'Máquinas' },
  { id: 'cabos', label: 'Cabos/Polias' },
  { id: 'peso_corpo', label: 'Peso Corporal' },
  { id: 'elasticos', label: 'Elásticos' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'cardio', label: 'Equipamentos Cardio' },
];

export const TrainingGeneratorAgent = () => {
  const [objetivo, setObjetivo] = useState('');
  const [nivel, setNivel] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [duracao, setDuracao] = useState('');
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<string[]>([]);
  const [restricoes, setRestricoes] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useAIAgent();

  const handleEquipamentoChange = (equipId: string, checked: boolean) => {
    if (checked) {
      setEquipamentosSelecionados(prev => [...prev, equipId]);
    } else {
      setEquipamentosSelecionados(prev => prev.filter(e => e !== equipId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !objetivo || !nivel || !frequencia) return;

    const equipLabels = equipamentosSelecionados.map(id => 
      equipamentos.find(e => e.id === id)?.label
    ).filter(Boolean).join(', ');

    const context = `## Parâmetros para Montagem de Treino

**Objetivo:** ${objetivo}
**Nível do praticante:** ${nivel}
**Frequência semanal:** ${frequencia}x por semana
**Duração por sessão:** ${duracao || '45-60 minutos'}
**Equipamentos disponíveis:** ${equipLabels || 'Todos'}
**Restrições/Lesões:** ${restricoes || 'Nenhuma informada'}
**Observações adicionais:** ${observacoes || 'Nenhuma'}

Por favor, monte um protocolo de treino considerando estes parâmetros, com divisão de grupos musculares, exercícios, séries, repetições e orientações.`;

    await sendMessage('treino', context);
  };

  const handleClear = () => {
    clearMessages();
    setObjetivo('');
    setNivel('');
    setFrequencia('');
    setDuracao('');
    setEquipamentosSelecionados([]);
    setRestricoes('');
    setObservacoes('');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Preencha os parâmetros abaixo para gerar um protocolo de treino personalizado.
        </AlertDescription>
      </Alert>

      {messages.length === 0 ? (
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4 pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Objetivo *</Label>
              <Select value={objetivo} onValueChange={setObjetivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o objetivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="forca">Força</SelectItem>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="condicionamento">Condicionamento</SelectItem>
                  <SelectItem value="resistencia">Resistência Muscular</SelectItem>
                  <SelectItem value="funcional">Funcional</SelectItem>
                  <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível do Praticante *</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante (0-6 meses)</SelectItem>
                  <SelectItem value="intermediario">Intermediário (6m-2 anos)</SelectItem>
                  <SelectItem value="avancado">Avançado (2+ anos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequência Semanal *</Label>
              <Select value={frequencia} onValueChange={setFrequencia}>
                <SelectTrigger>
                  <SelectValue placeholder="Quantas vezes por semana..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2x por semana</SelectItem>
                  <SelectItem value="3">3x por semana</SelectItem>
                  <SelectItem value="4">4x por semana</SelectItem>
                  <SelectItem value="5">5x por semana</SelectItem>
                  <SelectItem value="6">6x por semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duração por Sessão</Label>
              <Input
                placeholder="Ex: 60 minutos"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipamentos Disponíveis</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 border rounded-lg">
              {equipamentos.map(equip => (
                <div key={equip.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={equip.id}
                    checked={equipamentosSelecionados.includes(equip.id)}
                    onCheckedChange={(checked) => handleEquipamentoChange(equip.id, checked as boolean)}
                  />
                  <Label htmlFor={equip.id} className="text-sm cursor-pointer">
                    {equip.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Restrições / Lesões</Label>
            <Textarea
              placeholder="Ex: Problema no ombro direito, hérnia de disco lombar..."
              value={restricoes}
              onChange={(e) => setRestricoes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Observações Adicionais</Label>
            <Textarea
              placeholder="Ex: Prefere treinos mais curtos e intensos, quer focar em pernas..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={!objetivo || !nivel || !frequencia || isLoading}>
              <Send className="h-4 w-4 mr-2" />
              Gerar Treino
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <AgentChat 
              messages={messages} 
              isLoading={isLoading} 
              error={error}
              onClearError={clearError}
            />
          </div>

          <div className="flex-shrink-0 flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Novo Treino
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
