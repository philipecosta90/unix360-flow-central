import { useState, useEffect } from 'react';
import { Send, Trash2, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AgentChat } from './AgentChat';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const FeedbackGeneratorAgent = () => {
  const [input, setInput] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'aluno' | 'profissional'>('aluno');
  const [clientData, setClientData] = useState<string>('');
  const [loadingClient, setLoadingClient] = useState(false);
  
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useAIAgent();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    if (selectedClientId) {
      loadClientData(selectedClientId);
    } else {
      setClientData('');
    }
  }, [selectedClientId]);

  const loadClientData = async (clientId: string) => {
    setLoadingClient(true);
    try {
      const cliente = clients.find(c => c.id === clientId);
      if (!cliente) return;

      // Get latest check-in
      const { data: checkins } = await supabase
        .from('checkin_envios')
        .select(`
          pontuacao_total,
          pontuacao_maxima,
          respondido_em
        `)
        .eq('cliente_id', clientId)
        .eq('status', 'respondido')
        .order('respondido_em', { ascending: false })
        .limit(3);

      // Get latest interactions
      const { data: interacoes } = await supabase
        .from('cs_interacoes')
        .select('tipo, titulo, data_interacao')
        .eq('cliente_id', clientId)
        .order('data_interacao', { ascending: false })
        .limit(5);

      const checkinsInfo = checkins?.map(c => {
        const pct = c.pontuacao_maxima ? Math.round((c.pontuacao_total || 0) / c.pontuacao_maxima * 100) : 0;
        return `- ${new Date(c.respondido_em || '').toLocaleDateString('pt-BR')}: ${pct}%`;
      }).join('\n') || 'Nenhum check-in encontrado';

      const interacoesInfo = interacoes?.map(i => 
        `- ${new Date(i.data_interacao).toLocaleDateString('pt-BR')}: ${i.tipo} - ${i.titulo}`
      ).join('\n') || 'Nenhuma interação registrada';

      const data = `## Cliente: ${cliente.nome}
Status: ${cliente.status}
Telefone: ${cliente.telefone || 'Não informado'}
Email: ${cliente.email || 'Não informado'}

### Últimos Check-ins
${checkinsInfo}

### Últimas Interações
${interacoesInfo}`;

      setClientData(data);
      toast.success('Dados do cliente carregados');
    } catch (err) {
      console.error('Error loading client data:', err);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setLoadingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const typeDescription = feedbackType === 'aluno' 
      ? 'Crie um feedback motivacional e construtivo para enviar diretamente ao aluno/cliente.'
      : 'Crie uma análise técnica e detalhada para uso interno do profissional.';

    const contextToSend = clientData 
      ? `${clientData}\n\n---\nTipo de feedback solicitado: ${feedbackType.toUpperCase()}\n${typeDescription}\n\nInstruções adicionais do profissional: ${input || 'Nenhuma instrução adicional.'}`
      : `Tipo: ${feedbackType}\n${typeDescription}\n\n${input}`;

    if (!contextToSend.trim()) return;

    setInput('');
    await sendMessage('feedback', contextToSend);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Selecione um cliente e o tipo de feedback desejado para gerar uma mensagem personalizada.
        </AlertDescription>
      </Alert>

      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Selecionar Cliente</Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex items-center gap-2">
                    <UserSearch className="h-4 w-4" />
                    {client.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Feedback</Label>
          <RadioGroup 
            value={feedbackType} 
            onValueChange={(v) => setFeedbackType(v as 'aluno' | 'profissional')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="aluno" id="aluno" />
              <Label htmlFor="aluno" className="cursor-pointer">Para o Aluno</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="profissional" id="profissional" />
              <Label htmlFor="profissional" className="cursor-pointer">Para o Profissional</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {clientData && (
        <Alert className="flex-shrink-0 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Dados do cliente carregados! Clique em "Gerar" ou adicione instruções específicas.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-hidden">
        <AgentChat 
          messages={messages} 
          isLoading={isLoading || loadingClient} 
          error={error}
          onClearError={clearError}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 space-y-3">
        <Textarea
          placeholder={clientData 
            ? "Adicione instruções específicas ou deixe em branco para feedback padrão..." 
            : "Descreva o contexto do cliente e o tipo de feedback desejado..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          disabled={isLoading || loadingClient}
          className="resize-none"
        />
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              clearMessages();
              setSelectedClientId('');
              setClientData('');
            }}
            disabled={messages.length === 0 || isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={((!input.trim() && !clientData) || isLoading || loadingClient)}
          >
            <Send className="h-4 w-4 mr-2" />
            Gerar Feedback
          </Button>
        </div>
      </form>
    </div>
  );
};
