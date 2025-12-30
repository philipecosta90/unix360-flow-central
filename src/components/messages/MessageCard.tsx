import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, RotateCcw } from 'lucide-react';
import { WhatsAppMessage } from '@/hooks/useWhatsAppMessages';

interface MessageCardProps {
  message: WhatsAppMessage | undefined;
  config: {
    tipo: string;
    titulo: string;
    descricao: string;
    icone: string;
    variaveis: string[];
    conteudoPadrao: string;
  };
  onEdit: () => void;
  onReset: () => void;
  saving: boolean;
}

export const MessageCard = ({
  message,
  config,
  onEdit,
  onReset,
  saving,
}: MessageCardProps) => {
  const isActive = message?.ativo ?? true;
  const hasCustomMessage = message && message.conteudo !== config.conteudoPadrao;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icone}</span>
            <div>
              <CardTitle className="text-lg">{config.titulo}</CardTitle>
              <CardDescription className="mt-1">{config.descricao}</CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'} className="shrink-0">
            {isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {message?.conteudo || config.conteudoPadrao}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Variáveis disponíveis:</strong>{' '}
            {config.variaveis.map((v) => `{${v}}`).join(', ')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onEdit} variant="default" size="sm" className="flex-1">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {hasCustomMessage && (
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
        </div>
      </CardContent>
    </Card>
  );
};
