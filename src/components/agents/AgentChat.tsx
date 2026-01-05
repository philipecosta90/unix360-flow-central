import { useRef, useEffect, useState } from 'react';
import { Bot, User, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Message } from '@/hooks/useAIAgent';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AgentChatProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onClearError?: () => void;
}

export const AgentChat = ({ messages, isLoading, error, onClearError }: AgentChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success('Copiado!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  if (messages.length === 0 && !isLoading && !error) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Bot className="h-12 w-12 mx-auto opacity-50" />
          <p>Envie uma mensagem para iniciar a conversa</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto pr-4">
      <div className="space-y-4 pb-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {onClearError && (
                <Button variant="ghost" size="sm" onClick={onClearError}>
                  Fechar
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-headings:font-semibold prose-p:my-1.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-inherit">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              
              {message.role === 'assistant' && message.content && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs opacity-70 hover:opacity-100"
                  onClick={() => handleCopy(message.content, index)}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
