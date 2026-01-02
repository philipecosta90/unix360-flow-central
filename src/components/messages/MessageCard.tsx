import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, RotateCcw, Trash2 } from 'lucide-react';
import { WhatsAppMessage } from '@/hooks/useWhatsAppMessages';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MessageCardProps {
  message: WhatsAppMessage | undefined;
  config?: {
    tipo: string;
    titulo: string;
    descricao: string;
    icone: string;
    variaveis: string[];
    conteudoPadrao: string;
  };
  isSystemMessage?: boolean;
  onEdit: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  saving: boolean;
}

export const MessageCard = ({
  message,
  config,
  isSystemMessage = true,
  onEdit,
  onReset,
  onDelete,
  saving,
}: MessageCardProps) => {
  const isActive = message?.ativo ?? true;
  
  // For system messages, check against default content
  const hasCustomMessage = isSystemMessage && config && message && message.conteudo !== config.conteudoPadrao;

  // Get display values - prefer message data, fall back to config for system messages
  const displayIcon = message?.icone || config?.icone || '📩';
  const displayTitle = message?.titulo || config?.titulo || 'Mensagem';
  const displayDescription = message?.descricao || config?.descricao || '';
  const displayContent = message?.conteudo || config?.conteudoPadrao || '';
  const displayVariables = message?.variaveis_disponiveis || config?.variaveis || [];

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{displayIcon}</span>
            <div>
              <CardTitle className="text-lg">{displayTitle}</CardTitle>
              {displayDescription && (
                <CardDescription className="mt-1">{displayDescription}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isSystemMessage && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Personalizada
              </Badge>
            )}
            <Badge variant={isActive ? 'default' : 'secondary'} className="shrink-0">
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {displayContent}
          </p>
        </div>

        {displayVariables.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">
              <strong>Variáveis disponíveis:</strong>{' '}
              {displayVariables.map((v) => `{${v}}`).join(', ')}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onEdit} variant="default" size="sm" className="flex-1">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {isSystemMessage && hasCustomMessage && onReset && (
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar
            </Button>
          )}
          {!isSystemMessage && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={saving}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A mensagem &quot;{displayTitle}&quot; será
                    permanentemente excluída.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
