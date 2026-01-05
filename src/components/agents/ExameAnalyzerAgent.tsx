import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AgentChat, ImageUploadInput } from './AgentChat';
import { useAIAgent, MessageImage } from '@/hooks/useAIAgent';

export const ExameAnalyzerAgent = () => {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<MessageImage[]>([]);
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useAIAgent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && images.length === 0) || isLoading) return;

    const userInput = input || 'Analise estas imagens de exames';
    setInput('');
    setImages([]);
    await sendMessage('exame', userInput, images.length > 0 ? images : undefined);
  };

  const handleClear = () => {
    clearMessages();
    setImages([]);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Cole ou descreva os resultados do exame laboratorial, ou envie fotos dos exames para análise. 
          Inclua valores de referência quando disponíveis.
        </AlertDescription>
      </Alert>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AgentChat
          messages={messages} 
          isLoading={isLoading} 
          error={error}
          onClearError={clearError}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 space-y-3">
        <ImageUploadInput 
          images={images} 
          onImagesChange={setImages} 
          disabled={isLoading}
        />
        
        <Textarea
          placeholder="Cole os resultados do exame ou descreva o que deseja analisar..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          disabled={isLoading}
          className="resize-none"
        />
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClear}
            disabled={(messages.length === 0 && images.length === 0) || isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button type="submit" disabled={(!input.trim() && images.length === 0) || isLoading}>
            <Send className="h-4 w-4 mr-2" />
            Analisar
          </Button>
        </div>
      </form>
    </div>
  );
};
