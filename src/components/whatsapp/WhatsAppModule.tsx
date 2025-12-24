import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle2, Bell, Users, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const WhatsAppModule = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Conectar WhatsApp</h1>
        <p className="text-muted-foreground mt-1">
          Integre seu WhatsApp para automatizar comunicações
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <MessageCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <CardTitle>Integração WhatsApp</CardTitle>
                <CardDescription>
                  Conecte sua conta para enviar mensagens automáticas
                </CardDescription>
              </div>
            </div>
            <Badge variant="destructive" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              Não conectado
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Lembretes Automáticos</p>
                <p className="text-xs text-muted-foreground">
                  Envie lembretes de consultas e treinos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Notificações de Renovação</p>
                <p className="text-xs text-muted-foreground">
                  Avise clientes sobre planos expirando
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Comunicação com Prospects</p>
                <p className="text-xs text-muted-foreground">
                  Follow-up automático com leads
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4 text-center">
              Clique no botão abaixo para conectar seu WhatsApp
            </p>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-5 w-5 mr-2" />
              Conectar WhatsApp
            </Button>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Como funciona
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Clique em "Conectar WhatsApp"</li>
              <li>Escaneie o QR Code com seu celular</li>
              <li>Pronto! Suas mensagens serão enviadas automaticamente</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
