import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

interface RenewPlanButtonProps {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

const RENEWAL_OPTIONS = [
  { label: "30 dias", days: 30 },
  { label: "6 meses", days: 180 },
  { label: "1 ano", days: 365 },
];

export const RenewPlanButton = ({ clientId, clientName, onSuccess }: RenewPlanButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRenew = async (days: number, label: string) => {
    setLoading(true);
    try {
      const today = new Date();
      const endDate = addDays(today, days);

      const { error } = await supabase
        .from("clientes")
        .update({
          data_inicio_plano: format(today, "yyyy-MM-dd"),
          data_fim_plano: format(endDate, "yyyy-MM-dd"),
          status: "ativo",
        })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Plano renovado!",
        description: `${clientName} agora tem plano até ${format(endDate, "dd/MM/yyyy")} (${label}).`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Erro ao renovar plano:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível renovar o plano.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          className="text-primary hover:text-primary/80 hover:bg-primary/10"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-1" />
              Renovar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {RENEWAL_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.days}
            onClick={() => handleRenew(option.days, option.label)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
