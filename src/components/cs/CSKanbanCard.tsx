import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CSClient } from '@/hooks/useCSClients';

interface CSKanbanCardProps {
  client: CSClient;
  onViewDetails?: (clientId: string) => void;
  onOpenWhatsApp?: (phone: string) => void;
}

export const CSKanbanCard = ({ client, onViewDetails, onOpenWhatsApp }: CSKanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: client.id,
    data: client,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatPhoneForWhatsApp = (phone: string | null) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10 && !cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedPhone = formatPhoneForWhatsApp(client.telefone);
    if (formattedPhone && onOpenWhatsApp) {
      onOpenWhatsApp(formattedPhone);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(client.id);
    }
  };

  const stageEnteredText = client.cs_stage_entered_at
    ? formatDistanceToNow(new Date(client.cs_stage_entered_at), { 
        addSuffix: true, 
        locale: ptBR 
      })
    : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card border-border"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {client.foto_url && (
            <AvatarImage src={client.foto_url} alt={client.nome} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {getInitials(client.nome)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate">
            {client.nome}
          </h4>
          
          {client.email && (
            <p className="text-xs text-muted-foreground truncate">
              {client.email}
            </p>
          )}
          
          {stageEnteredText && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Entrou {stageEnteredText}</span>
            </div>
          )}
          
          {client.plano_contratado && (
            <div className="mt-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                {client.plano_contratado}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border">
        {client.telefone && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={handleWhatsAppClick}
            title="Abrir WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
          onClick={handleViewClick}
          title="Ver detalhes"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
