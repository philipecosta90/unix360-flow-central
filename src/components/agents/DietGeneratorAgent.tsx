import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AgentChat } from './AgentChat';
import { useAIAgent } from '@/hooks/useAIAgent';

export const DietGeneratorAgent = () => {
  const [objetivo, setObjetivo] = useState('');
  const [calorias, setCalorias] = useState('');
  const [refeicoes, setRefeicoes] = useState('');
  const [restricoes, setRestricoes] = useState('');
  const [preferencias, setPreferencias] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useAIAgent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !objetivo) return;

    const context = `## Parâmetros para Montagem de Dieta

**Objetivo:** ${objetivo}
**Meta calórica:** ${calorias || 'A definir pelo profissional'}
**Número de refeições:** ${refeicoes || '5-6 refeições'}
**Restrições alimentares:** ${restricoes || 'Nenhuma informada'}
**Preferências alimentares:** ${preferencias || 'Nenhuma informada'}
**Observações adicionais:** ${observacoes || 'Nenhuma'}

Por favor, monte uma sugestão de plano alimentar considerando estes parâmetros.`;

    await sendMessage('dieta', context);
  };

  const handleClear = () => {
    clearMessages();
    setObjetivo('');
    setCalorias('');
    setRefeicoes('');
    setRestricoes('');
    setPreferencias('');
    setObservacoes('');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Preencha os parâmetros abaixo para gerar uma sugestão de plano alimentar personalizado.
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
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="performance">Performance Esportiva</SelectItem>
                  <SelectItem value="saude">Saúde Geral</SelectItem>
                  <SelectItem value="definicao">Definição Muscular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Meta Calórica (kcal)</Label>
              <Input
                type="number"
                placeholder="Ex: 2000"
                value={calorias}
                onChange={(e) => setCalorias(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Número de Refeições</Label>
              <Select value={refeicoes} onValueChange={setRefeicoes}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 refeições</SelectItem>
                  <SelectItem value="4">4 refeições</SelectItem>
                  <SelectItem value="5">5 refeições</SelectItem>
                  <SelectItem value="6">6 refeições</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Restrições Alimentares</Label>
            <Textarea
              placeholder="Ex: Intolerância à lactose, alergia a frutos do mar, vegetariano..."
              value={restricoes}
              onChange={(e) => setRestricoes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Preferências Alimentares</Label>
            <Textarea
              placeholder="Ex: Prefere frango a carne vermelha, gosta de ovos, não gosta de brócolis..."
              value={preferencias}
              onChange={(e) => setPreferencias(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Observações Adicionais</Label>
            <Textarea
              placeholder="Ex: Trabalha à noite, treina pela manhã, tem pouco tempo para cozinhar..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={!objetivo || isLoading}>
              <Send className="h-4 w-4 mr-2" />
              Gerar Dieta
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
              Nova Dieta
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
