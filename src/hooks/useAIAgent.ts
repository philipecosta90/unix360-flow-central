import { useState, useCallback } from 'react';

export type AgentType = 'exame' | 'anamnese' | 'checkin' | 'feedback' | 'dieta' | 'treino';

export interface MessageImage {
  url: string;
  type: 'base64' | 'url';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: MessageImage[];
}

interface UseAIAgentReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (agentType: AgentType, context: string, images?: MessageImage[], previousMessages?: Message[]) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

export const useAIAgent = (): UseAIAgentReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(async (
    agentType: AgentType,
    context: string,
    images?: MessageImage[],
    previousMessages?: Message[]
  ) => {
    setIsLoading(true);
    setError(null);

    // Add user message with images if any
    const userMessage: Message = { 
      role: 'user', 
      content: context,
      images: images && images.length > 0 ? images : undefined
    };
    setMessages(prev => [...prev, userMessage]);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          agentType,
          context,
          images: images?.map(img => img.url),
          messages: previousMessages || messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error(errorData.error || 'Limite de requisições excedido. Aguarde alguns segundos.');
        }
        if (response.status === 402) {
          throw new Error(errorData.error || 'Créditos insuficientes. Adicione créditos na sua conta.');
        }
        throw new Error(errorData.error || 'Erro ao comunicar com o agente IA');
      }

      if (!response.body) {
        throw new Error('Resposta sem corpo');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      // Add empty assistant message to start streaming into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                  newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                  newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }

    } catch (err) {
      console.error('AI Agent error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      // Remove the empty assistant message if there was an error
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    clearError,
  };
};
