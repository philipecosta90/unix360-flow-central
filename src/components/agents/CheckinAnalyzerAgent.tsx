import { useState, useEffect } from 'react';
import { Send, Trash2, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AgentChat } from './AgentChat';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const CheckinAnalyzerAgent = () => {
  const [input, setInput] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [checkinData, setCheckinData] = useState<string>('');
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useAIAgent();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    if (selectedClientId) {
      loadCheckinData(selectedClientId);
    } else {
      setCheckinData('');
    }
  }, [selectedClientId]);

  const loadCheckinData = async (clientId: string) => {
    setLoadingCheckin(true);
    try {
      // Get all completed check-ins for this client
      const { data: envios, error: enviosError } = await supabase
        .from('checkin_envios')
        .select(`
          id,
          respondido_em,
          pontuacao_total,
          pontuacao_maxima,
          template:checkin_templates(nome)
        `)
        .eq('cliente_id', clientId)
        .eq('status', 'respondido')
        .order('respondido_em', { ascending: false })
        .limit(10);

      if (enviosError) throw enviosError;

      if (!envios || envios.length === 0) {
        setCheckinData('');
        toast.info('Este cliente não possui check-ins respondidos');
        return;
      }

      // Get responses for all check-ins
      const allData: string[] = [];

      for (const envio of envios) {
        const { data: respostas, error: respostasError } = await supabase
          .from('checkin_respostas')
          .select(`
            resposta,
            pontuacao,
            pergunta:checkin_perguntas(pergunta, secao, pontos_maximo)
          `)
          .eq('envio_id', envio.id);

        if (respostasError) throw respostasError;

        const formattedResponses = respostas
          ?.map(r => `- ${(r.pergunta as any)?.pergunta}: ${r.resposta || 'N/A'} (${r.pontuacao || 0}/${(r.pergunta as any)?.pontos_maximo || 0} pts)`)
          .join('\n');

        const percentual = envio.pontuacao_maxima 
          ? Math.round((envio.pontuacao_total || 0) / envio.pontuacao_maxima * 100)
          : 0;

        allData.push(`### Check-in de ${envio.respondido_em ? new Date(envio.respondido_em).toLocaleDateString('pt-BR') : 'N/A'}\nTemplate: ${(envio.template as any)?.nome}\nPontuação: ${envio.pontuacao_total || 0}/${envio.pontuacao_maxima || 0} (${percentual}%)\n\n${formattedResponses}`);
      }

      const cliente = clients.find(c => c.id === clientId);
      const fullData = `## Histórico de Check-ins de ${cliente?.nome || 'Cliente'}\n\nTotal de check-ins analisados: ${envios.length}\n\n${allData.join('\n\n---\n\n')}`;
      
      setCheckinData(fullData);
      toast.success(`${envios.length} check-ins carregados`);
    } catch (err) {
      console.error('Error loading check-ins:', err);
      toast.error('Erro ao carregar check-ins');
    } finally {
      setLoadingCheckin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const contextToSend = checkinData 
      ? `${checkinData}\n\n---\nPergunta do profissional: ${input || 'Analise a evolução deste cliente baseado nos check-ins e destaque tendências e pontos de atenção.'}`
      : input;

    if (!contextToSend.trim()) return;

    setInput('');
    await sendMessage('checkin', contextToSend);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Selecione um cliente para carregar seu histórico de check-ins e analisar a evolução.
        </AlertDescription>
      </Alert>

      <div className="flex-shrink-0 space-y-3">
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

        {checkinData && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Check-ins carregados! Clique em "Analisar" ou faça uma pergunta específica.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AgentChat
          messages={messages} 
          isLoading={isLoading || loadingCheckin} 
          error={error}
          onClearError={clearError}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 space-y-3">
        <Textarea
          placeholder={checkinData 
            ? "Faça uma pergunta específica ou deixe em branco para análise de evolução..." 
            : "Cole os dados dos check-ins ou descreva o que deseja analisar..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          disabled={isLoading || loadingCheckin}
          className="resize-none"
        />
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              clearMessages();
              setSelectedClientId('');
              setCheckinData('');
            }}
            disabled={messages.length === 0 || isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={((!input.trim() && !checkinData) || isLoading || loadingCheckin)}
          >
            <Send className="h-4 w-4 mr-2" />
            Analisar
          </Button>
        </div>
      </form>
    </div>
  );
};
