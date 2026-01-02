import { useState } from 'react';
import { MessageSquare, RefreshCw, AlertCircle, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCard } from './MessageCard';
import { MessageEditDialog } from './MessageEditDialog';
import { MessageCreateDialog } from './MessageCreateDialog';
import { MessageScheduleDialog } from './MessageScheduleDialog';
import { MessageSchedulesList } from './MessageSchedulesList';
import { useWhatsAppMessages, MESSAGE_TYPES, WhatsAppMessage } from '@/hooks/useWhatsAppMessages';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { useMessageSchedules } from '@/hooks/useMessageSchedules';

export const MessagesModule = () => {
  const {
    messages,
    loading,
    saving,
    fetchMessages,
    updateMessage,
    createMessage,
    deleteMessage,
    toggleActive,
    resetToDefault,
    getMessage,
    getMessageConfig,
    isSystemMessage,
    getSystemMessages,
    getCustomMessages,
  } = useWhatsAppMessages();

  const { instances, isLoading: loadingInstances } = useWhatsAppInstances();
  
  const {
    schedules,
    loading: loadingSchedules,
    saving: savingSchedule,
    fetchSchedules,
    createSchedule,
    deleteSchedule,
    toggleActive: toggleScheduleActive,
    getActiveSchedules,
  } = useMessageSchedules();

  const [activeTab, setActiveTab] = useState('mensagens');
  
  const [editingMessage, setEditingMessage] = useState<{
    message: WhatsAppMessage | undefined;
    config: (typeof MESSAGE_TYPES)[0] | null;
    isSystem: boolean;
  } | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const hasConnectedInstance = instances.some((i) => i.status === 'connected');
  const activeSchedulesCount = getActiveSchedules().length;

  const handleEditSystem = (tipo: string) => {
    const config = getMessageConfig(tipo);
    const message = getMessage(tipo);
    if (config) {
      setEditingMessage({ message, config, isSystem: true });
    }
  };

  const handleEditCustom = (message: WhatsAppMessage) => {
    setEditingMessage({ message, config: null, isSystem: false });
  };

  const handleReset = async (tipo: string) => {
    const message = getMessage(tipo);
    if (message) {
      await resetToDefault(message.id, tipo);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMessage(id);
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

  const handleCreate = async (data: {
    titulo: string;
    tipo: string;
    conteudo: string;
    variaveis_disponiveis: string[];
    icone: string;
    descricao: string;
  }) => {
    return await createMessage(data);
  };

  const systemMessages = getSystemMessages();
  const customMessages = getCustomMessages();

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchMessages(); fetchSchedules(); }} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mensagens" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Agendamentos
            {activeSchedulesCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeSchedulesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Mensagens Tab */}
        <TabsContent value="mensagens" className="space-y-6 mt-6">
          {/* Info */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="font-medium">Como funciona?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Estas mensagens são enviadas automaticamente quando você realiza determinadas ações no
              sistema. Você pode personalizar o texto e usar as variáveis disponíveis para incluir
              informações dinâmicas como nome do cliente e links.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Mensagem
            </Button>
          </div>

          {/* System Messages */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>🔒</span> Mensagens do Sistema
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {MESSAGE_TYPES.map((config) => (
                <MessageCard
                  key={config.tipo}
                  message={getMessage(config.tipo)}
                  config={config}
                  isSystemMessage={true}
                  onEdit={() => handleEditSystem(config.tipo)}
                  onReset={() => handleReset(config.tipo)}
                  saving={saving}
                />
              ))}
            </div>
          </div>

          {/* Custom Messages */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>✨</span> Mensagens Personalizadas
            </h2>
            {customMessages.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed bg-muted/20 p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhuma mensagem personalizada.
                </p>
                <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira mensagem
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {customMessages.map((message) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    isSystemMessage={false}
                    onEdit={() => handleEditCustom(message)}
                    onDelete={() => handleDelete(message.id)}
                    saving={saving}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Agendamentos Tab */}
        <TabsContent value="agendamentos" className="space-y-6 mt-6">
          {/* Info */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="font-medium">Agendamentos automáticos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure o envio automático de mensagens em datas específicas, como aniversários de
              clientes, datas comemorativas ou campanhas programadas.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>

          {/* Schedules List */}
          <MessageSchedulesList
            schedules={schedules}
            loading={loadingSchedules}
            saving={savingSchedule}
            onToggleActive={toggleScheduleActive}
            onDelete={deleteSchedule}
            onAddNew={() => setShowScheduleDialog(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingMessage && (
        <MessageEditDialog
          open={!!editingMessage}
          onOpenChange={(open) => !open && setEditingMessage(null)}
          message={editingMessage.message}
          config={editingMessage.config}
          isSystemMessage={editingMessage.isSystem}
          onSave={handleSave}
          onToggleActive={handleToggleActive}
          saving={saving}
        />
      )}

      {/* Create Dialog */}
      <MessageCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={handleCreate}
        saving={saving}
      />

      {/* Schedule Dialog */}
      <MessageScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        messages={messages}
        onSave={createSchedule}
        saving={savingSchedule}
      />
    </div>
  );
};
