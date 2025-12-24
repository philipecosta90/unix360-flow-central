import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppInstance } from "@/hooks/useWhatsAppInstances";

interface CreateInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstanceCreated?: (instance: WhatsAppInstance) => void;
  createInstance: (nome: string, numero: string) => Promise<WhatsAppInstance>;
  isCreating: boolean;
}

export const CreateInstanceDialog = ({
  open,
  onOpenChange,
  onInstanceCreated,
  createInstance,
  isCreating,
}: CreateInstanceDialogProps) => {
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/\D/g, "");
    setNumero(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Informe o nome da instância");
      return;
    }

    if (!numero.trim()) {
      toast.error("Informe o número do WhatsApp");
      return;
    }

    if (numero.length < 10) {
      toast.error("Número do WhatsApp inválido");
      return;
    }

    try {
      const instance = await createInstance(nome, numero);
      onInstanceCreated?.(instance);
      setNome("");
      setNumero("");
      onOpenChange(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="flex flex-row items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle>Criar Instância</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Instância</Label>
            <Input
              id="nome"
              placeholder="Ex: Vendas Principal"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-background"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero">
              Número do WhatsApp <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero"
              placeholder="559192724395 (apenas números, com código do país)"
              value={numero}
              onChange={handleNumeroChange}
              className="bg-background"
              inputMode="numeric"
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Formato: código do país + DDD + número (sem + ou espaços)
            </p>
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white font-medium"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Instância"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
