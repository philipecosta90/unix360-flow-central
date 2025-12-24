import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode, Smartphone, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppInstance } from "@/hooks/useWhatsAppInstances";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
  getQRCode: (instanceId: string) => Promise<string>;
  getPairCode: (instanceId: string, phone: string) => Promise<string>;
  checkStatus: (instanceId: string) => Promise<{ status: string; jid?: string }>;
  onConnected?: () => void;
}

export const QRCodeDialog = ({
  open,
  onOpenChange,
  instance,
  getQRCode,
  getPairCode,
  checkStatus,
  onConnected,
}: QRCodeDialogProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isLoadingPair, setIsLoadingPair] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Buscar QR Code
  const fetchQRCode = useCallback(async () => {
    if (!instance) return;

    setIsLoadingQR(true);
    try {
      const qr = await getQRCode(instance.id);
      setQrCode(qr);
    } catch (error) {
      console.error("Erro ao buscar QR:", error);
      toast.error("Erro ao carregar QR Code. Tente novamente.");
    } finally {
      setIsLoadingQR(false);
    }
  }, [instance, getQRCode]);

  // Solicitar código de pareamento
  const requestPairCode = async () => {
    if (!instance || !phone) {
      toast.error("Informe o número do telefone");
      return;
    }

    setIsLoadingPair(true);
    try {
      const code = await getPairCode(instance.id, phone);
      setPairCode(code);
      toast.success("Código gerado! Digite-o no seu WhatsApp.");
    } catch (error) {
      console.error("Erro ao solicitar código:", error);
      toast.error("Erro ao gerar código de pareamento");
    } finally {
      setIsLoadingPair(false);
    }
  };

  // Polling de status
  useEffect(() => {
    if (!open || !instance || isConnected) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkStatus(instance.id);
        if (result.status === "connected") {
          setIsConnected(true);
          toast.success("WhatsApp conectado com sucesso!");
          onConnected?.();
          clearInterval(interval);
        }
      } catch (error) {
        // Silenciar erros de polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [open, instance, isConnected, checkStatus, onConnected]);

  // Buscar QR quando abrir
  useEffect(() => {
    if (open && instance && !isConnected) {
      fetchQRCode();
    }
  }, [open, instance, isConnected, fetchQRCode]);

  // Resetar ao fechar
  useEffect(() => {
    if (!open) {
      setQrCode(null);
      setPairCode(null);
      setPhone("");
      setIsConnected(false);
    }
  }, [open]);

  if (!instance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp - {instance.nome}</DialogTitle>
        </DialogHeader>

        {isConnected ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium text-center">
              WhatsApp conectado com sucesso!
            </p>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        ) : (
          <Tabs defaultValue="qrcode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Código
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qrcode" className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4">
                {isLoadingQR ? (
                  <div className="flex flex-col items-center space-y-2 py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Carregando QR Code...
                    </p>
                  </div>
                ) : qrCode ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      <img
                        src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                        alt="QR Code WhatsApp"
                        className="w-64 h-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={fetchQRCode}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 py-8">
                    <p className="text-sm text-muted-foreground">
                      QR Code não disponível
                    </p>
                    <Button variant="outline" onClick={fetchQRCode}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar novamente
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Abra o WhatsApp no seu celular, vá em Configurações {">"}{" "}
                Dispositivos vinculados {">"} Vincular dispositivo e escaneie o
                QR Code.
              </p>
            </TabsContent>

            <TabsContent value="phone" className="space-y-4">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número do telefone</Label>
                  <Input
                    id="phone"
                    placeholder="5511999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o número com código do país e DDD (sem espaços ou
                    símbolos)
                  </p>
                </div>

                <Button
                  onClick={requestPairCode}
                  disabled={isLoadingPair || !phone}
                  className="w-full"
                >
                  {isLoadingPair ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar Código"
                  )}
                </Button>

                {pairCode && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground mb-2">
                      Digite este código no seu WhatsApp:
                    </p>
                    <p className="text-2xl font-bold text-center tracking-widest text-primary">
                      {pairCode}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Abra o WhatsApp no seu celular, vá em Configurações {">"}{" "}
                Dispositivos vinculados {">"} Vincular dispositivo {">"}{" "}
                Vincular com número de telefone.
              </p>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
