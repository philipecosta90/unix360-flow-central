import { useState } from 'react';
import { MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MessageCard } from './MessageCard';
import { MessageEditDialog } from './MessageEditDialog';
import { useWhatsAppMessages, MESSAGE_TYPES, WhatsAppMessage } from '@/hooks/useWhatsAppMessages';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';

export const MessagesModule = () => {
  const {
    messages,
    loading,
    saving,
    fetchMessages,
    updateMessage,
    toggleActive,
    resetToDefault,
    getMessage,
    getMessageConfig,
  } = useWhatsAppMessages();

  const { instances, isLoading: loadingInstances } = useWhatsAppInstances();

  const [editingMessage, setEditingMessage] = useState<{
    message: WhatsAppMessage | undefined;
    config: (typeof MESSAGE_TYPES)[0];
  } | null>(null);

  const hasConnectedInstance = instances.some((i) => i.status === 'connected');

  const handleEdit = (tipo: string) => {
    const config = getMessageConfig(tipo);
    const message = getMessage(tipo);
    if (config) {
      setEditingMessage({ message, config });
    }
  };

  const handleReset = async (tipo: string) => {
    const message = getMessage(tipo);
    if (message) {
      await resetToDefault(message.id, tipo);
    }
  };

  const handleSave = async (conteudo: string) => {
    if (editingMessage?.message) {
      return await updateMessage(editingMessage.message.id, conteudo);
    }
    return false;
  };

  const handleToggleActive = async (ativo: boolean) => {
    if (editingMessage?.message) {
      return await toggleActive(editingMessage.message.id, ativo);
    }
    return false;
  };

  if (loading || loadingInstances) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mensagens WhatsApp</h1>
            <p className="text-muted-foreground">
              Personalize as mensagens enviadas automaticamente
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mensagens WhatsApp</h1>
          </div>
          <p className="text-muted-foreground">
            Personalize as mensagens enviadas automaticamente via WhatsApp
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchMessages()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alert if no WhatsApp connected */}
      {!hasConnectedInstance && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>WhatsApp não conectado</AlertTitle>
          <AlertDescription>
            Para enviar mensagens automaticamente, conecte sua instância do WhatsApp na aba
            &quot;WhatsApp&quot; no menu lateral.
          </AlertDescription>
        </Alert>
      )}

      {/* Info */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="font-medium">Como funciona?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Estas mensagens são enviadas automaticamente quando você realiza determinadas ações no
          sistema. Você pode personalizar o texto e usar as variáveis disponíveis para incluir
          informações dinâmicas como nome do cliente e links.
        </p>
      </div>

      {/* Message Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MESSAGE_TYPES.map((config) => (
          <MessageCard
            key={config.tipo}
            message={getMessage(config.tipo)}
            config={config}
            onEdit={() => handleEdit(config.tipo)}
            onReset={() => handleReset(config.tipo)}
            saving={saving}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      {editingMessage && (
        <MessageEditDialog
          open={!!editingMessage}
          onOpenChange={(open) => !open && setEditingMessage(null)}
          message={editingMessage.message}
          config={editingMessage.config}
          onSave={handleSave}
          onToggleActive={handleToggleActive}
          saving={saving}
        />
      )}
    </div>
  );
};
