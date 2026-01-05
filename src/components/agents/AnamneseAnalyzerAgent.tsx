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

export const AnamneseAnalyzerAgent = () => {
  const [input, setInput] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [anamneseData, setAnamneseData] = useState<string>('');
  const [loadingAnamnese, setLoadingAnamnese] = useState(false);
  
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useAIAgent();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    if (selectedClientId) {
      loadAnamneseData(selectedClientId);
    } else {
      setAnamneseData('');
    }
  }, [selectedClientId]);

  const loadAnamneseData = async (clientId: string) => {
    setLoadingAnamnese(true);
    try {
      // Get the latest completed anamnese for this client
      const { data: envios, error: enviosError } = await supabase
        .from('anamnese_envios')
        .select(`
          id,
          preenchido_em,
          template:anamnese_templates(nome)
        `)
        .eq('cliente_id', clientId)
        .eq('status', 'preenchido')
        .order('preenchido_em', { ascending: false })
        .limit(1);

      if (enviosError) throw enviosError;

      if (!envios || envios.length === 0) {
        setAnamneseData('');
        toast.info('Este cliente não possui anamnese preenchida');
        return;
      }

      const envio = envios[0];

      // Get the responses
      const { data: respostas, error: respostasError } = await supabase
        .from('anamnese_respostas')
        .select(`
          resposta,
          pergunta:anamnese_perguntas(pergunta, secao)
        `)
        .eq('envio_id', envio.id);

      if (respostasError) throw respostasError;

      // Format the data
      const formattedData = respostas
        ?.map(r => `**${(r.pergunta as any)?.secao}** - ${(r.pergunta as any)?.pergunta}: ${r.resposta || 'Não respondido'}`)
        .join('\n');

      const cliente = clients.find(c => c.id === clientId);
      const fullData = `## Anamnese de ${cliente?.nome || 'Cliente'}\n\nTemplate: ${(envio.template as any)?.nome}\nData: ${envio.preenchido_em ? new Date(envio.preenchido_em).toLocaleDateString('pt-BR') : 'N/A'}\n\n${formattedData}`;
      
      setAnamneseData(fullData);
      toast.success('Anamnese carregada');
    } catch (err) {
      console.error('Error loading anamnese:', err);
      toast.error('Erro ao carregar anamnese');
    } finally {
      setLoadingAnamnese(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const contextToSend = anamneseData 
      ? `${anamneseData}\n\n---\nPergunta do profissional: ${input || 'Analise esta anamnese e destaque os pontos importantes.'}`
      : input;

    if (!contextToSend.trim()) return;

    setInput('');
    await sendMessage('anamnese', contextToSend);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Selecione um cliente para carregar sua anamnese ou cole/descreva os dados manualmente.
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

        {anamneseData && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Anamnese carregada! Clique em "Analisar" ou faça uma pergunta específica.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <AgentChat 
          messages={messages} 
          isLoading={isLoading || loadingAnamnese} 
          error={error}
          onClearError={clearError}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 space-y-3">
        <Textarea
          placeholder={anamneseData 
            ? "Faça uma pergunta específica ou deixe em branco para análise geral..." 
            : "Cole os dados da anamnese ou descreva o que deseja analisar..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          disabled={isLoading || loadingAnamnese}
          className="resize-none"
        />
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              clearMessages();
              setSelectedClientId('');
              setAnamneseData('');
            }}
            disabled={messages.length === 0 || isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={((!input.trim() && !anamneseData) || isLoading || loadingAnamnese)}
          >
            <Send className="h-4 w-4 mr-2" />
            Analisar
          </Button>
        </div>
      </form>
    </div>
  );
};
