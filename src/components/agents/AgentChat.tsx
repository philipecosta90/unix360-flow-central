import { useRef, useEffect, useState } from 'react';
import { Bot, User, Loader2, AlertCircle, Copy, Check, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Message, MessageImage } from '@/hooks/useAIAgent';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
              {/* Display images if any */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.images.map((img, imgIndex) => (
                    <div key={imgIndex} className="relative">
                      <img 
                        src={img.url} 
                        alt={`Imagem ${imgIndex + 1}`}
                        className="max-w-[200px] max-h-[150px] rounded-md object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-headings:font-semibold prose-p:my-1.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-inherit">
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !String(children).includes('\n');
                      return !isInline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md my-2 text-sm"
                          {...(props as any)}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
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

// Image upload input component for use in agent forms
interface ImageUploadProps {
  images: MessageImage[];
  onImagesChange: (images: MessageImage[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export const ImageUploadInput = ({ images, onImagesChange, disabled, maxImages = 4 }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: MessageImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (images.length + newImages.length >= maxImages) break;
      
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande (máx. 5MB)');
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newImages.push({ url: base64, type: 'base64' });
      } catch {
        toast.error('Erro ao processar imagem');
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img 
                src={img.url} 
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || images.length >= maxImages}
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || images.length >= maxImages}
      >
        <ImageIcon className="h-4 w-4 mr-2" />
        {images.length > 0 ? `Imagens (${images.length}/${maxImages})` : 'Adicionar Imagens'}
      </Button>
    </div>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}
