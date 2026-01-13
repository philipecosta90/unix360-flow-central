import { useState } from "react";
import { Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const WhatsAppUsageNotice = () => {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-4">
      {/* Banner de aviso principal */}
      <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-amber-600 dark:text-amber-400">
            Aviso importante sobre o uso do WhatsApp Connect
          </h3>
          <p className="text-sm text-muted-foreground">
            O envio simultâneo de mensagens automáticas pode resultar no bloqueio do número pelo WhatsApp (Meta). 
            Utilize esta ferramenta apenas para comunicações individuais, como lembretes, confirmações e mensagens de boas-vindas. 
            Evite agendar muitos envios no mesmo horário. Recomendamos intervalos de 15 a 30 segundos entre cada envio.
          </p>
        </div>

        {/* Tooltip com mais informações */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-5 w-5 text-amber-500 cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">
                <strong>Limite máximo sugerido:</strong> 50 mensagens por hora por número conectado.
                <br /><br />
                Evite disparos em massa para não ser classificado como spam.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Botão para abrir modal de aceite */}
      {!accepted && (
        <Button 
          variant="outline" 
          className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
          onClick={() => setOpen(true)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Concordar com o uso responsável
        </Button>
      )}

      {accepted && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Você concordou com os termos de uso responsável
        </div>
      )}

      {/* Modal de aceite */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Termos de Uso da Ferramenta de Envio Automatizado
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-4 text-left">
                <p className="text-sm text-muted-foreground">
                  O uso da integração com o WhatsApp destina-se exclusivamente a comunicações administrativas e individuais 
                  com pacientes, como confirmações de consulta e lembretes.
                </p>

                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ É proibido o envio de mensagens em massa, campanhas ou disparos simultâneos. 
                    O descumprimento pode levar ao bloqueio permanente do número.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Recomendamos enviar mensagens de forma sequencial, respeitando intervalos de 15–30 segundos entre cada envio.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                setAccepted(true);
                setOpen(false);
              }}
            >
              Concordo e entendo os riscos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppUsageNotice;
