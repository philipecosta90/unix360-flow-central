import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMinus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SetInactiveButtonProps {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export const SetInactiveButton = ({ clientId, clientName, onSuccess }: SetInactiveButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSetInactive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Marcar "${clientName}" como inativo? O cliente não aparecerá mais como vencido.`)) {
      return;
    }

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
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={handleSetInactive}
      className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          Inativar
        </>
      )}
    </Button>
  );
};
