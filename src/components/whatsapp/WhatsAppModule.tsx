import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Trash2,
  QrCode,
} from "lucide-react";
import { CreateInstanceDialog } from "./CreateInstanceDialog";
import { QRCodeDialog } from "./QRCodeDialog";
import { WhatsAppUsageNotice } from "./WhatsAppUsageNotice";
import {
  useWhatsAppInstances,
  WhatsAppInstance,
} from "@/hooks/useWhatsAppInstances";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const WhatsAppModule = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] =
    useState<WhatsAppInstance | null>(null);
  const [instanceToDelete, setInstanceToDelete] = useState<WhatsAppInstance | null>(
    null
  );

  const {
    instances,
    isLoading,
    isCreating,
    createInstance,
    connectInstance,
    getQRCode,
    getPairCode,
    checkStatus,
    deleteInstance,
    refetch,
  } = useWhatsAppInstances();

  const handleInstanceCreated = () => {
    refetch();
    setShowCreateDialog(false);
  };

  const handleGenerateQRCode = async (instance: WhatsAppInstance) => {
    await connectInstance(instance.id);
    setSelectedInstance(instance);
    setShowQRDialog(true);
  };

  const handleDelete = async () => {
    if (instanceToDelete) {
      await deleteInstance(instanceToDelete.id);
      setInstanceToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case "connecting":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Conectando
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso de uso responsável */}
      <WhatsAppUsageNotice />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Integração WhatsApp</h1>
          <p className="text-muted-foreground">
            Conecte suas contas do WhatsApp para automatizar comunicações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Instância
          </Button>
        </div>
      </div>

      {/* Lista de Instâncias */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : instances.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma instância configurada
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Crie uma nova instância do WhatsApp para começar a automatizar
              suas mensagens e comunicações com clientes.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Instância
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <Card key={instance.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{instance.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      +{instance.numero}
                    </p>
                  </div>
                  {getStatusBadge(instance.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {instance.jid && (
                  <p className="text-xs text-muted-foreground truncate">
                    JID: {instance.jid}
                  </p>
                )}

                <div className="flex gap-2">
                  {instance.status !== "connected" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleGenerateQRCode(instance)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      GERAR QRCODE
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkStatus(instance.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setInstanceToDelete(instance)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informações */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Como funciona a integração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <h4 className="font-medium mb-1">Crie uma instância</h4>
              <p className="text-sm text-muted-foreground">
                Dê um nome e informe o número do WhatsApp que deseja conectar.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <h4 className="font-medium mb-1">Escaneie o QR Code</h4>
              <p className="text-sm text-muted-foreground">
                Use o WhatsApp do seu celular para escanear o QR Code ou digite
                o código de pareamento.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <h4 className="font-medium mb-1">Pronto para usar</h4>
              <p className="text-sm text-muted-foreground">
                Sua instância está conectada e pronta para enviar e receber
                mensagens automatizadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateInstanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onInstanceCreated={handleInstanceCreated}
        createInstance={createInstance}
        isCreating={isCreating}
      />

      <QRCodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        instance={selectedInstance}
        getQRCode={getQRCode}
        getPairCode={getPairCode}
        checkStatus={checkStatus}
        onConnected={refetch}
      />

      <AlertDialog
        open={!!instanceToDelete}
        onOpenChange={() => setInstanceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a instância "{instanceToDelete?.nome}
              "? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
