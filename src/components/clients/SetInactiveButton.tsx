import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMinus, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";

interface SetInactiveButtonProps {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export const SetInactiveButton = ({ clientId, clientName, onSuccess }: SetInactiveButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSetInactive = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("clientes")
        .update({ status: "inativo" })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Cliente inativado",
        description: `${clientName} foi marcado como inativo.`,
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao inativar cliente:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível inativar o cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground"
        >
          <UserMinus className="w-4 h-4 mr-1" />
          Inativar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <AlertDialogTitle>Inativar cliente</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Tem certeza que deseja marcar <strong className="text-foreground">{clientName}</strong> como inativo?
            <br /><br />
            O cliente não aparecerá mais na lista de planos vencidos e poderá ser reativado posteriormente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSetInactive}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inativando...
              </>
            ) : (
              <>
                <UserMinus className="w-4 h-4 mr-2" />
                Confirmar Inativação
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
