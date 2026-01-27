import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserMinus, Loader2, AlertTriangle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

interface PendingTransactions {
  count: number;
  total: number;
}

export const SetInactiveButton = ({ clientId, clientName, onSuccess }: SetInactiveButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingData, setPendingData] = useState<PendingTransactions | null>(null);
  const [financialAction, setFinancialAction] = useState<'keep' | 'delete'>('keep');

  // Fetch pending transactions when dialog opens
  useEffect(() => {
    if (open) {
      fetchPendingTransactions();
    } else {
      // Reset state when dialog closes
      setPendingData(null);
      setFinancialAction('keep');
    }
  }, [open]);

  const fetchPendingTransactions = async () => {
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from("financeiro_lancamentos")
        .select("id, valor")
        .eq("cliente_id", clientId)
        .eq("a_receber", true);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, t) => sum + (t.valor || 0), 0);
        setPendingData({
          count: data.length,
          total
        });
      } else {
        setPendingData({ count: 0, total: 0 });
      }
    } catch (error: any) {
      console.error("Erro ao buscar transações pendentes:", error);
      setPendingData({ count: 0, total: 0 });
    } finally {
      setFetchingData(false);
    }
  };

  const handleFinancialAction = async (): Promise<boolean> => {
    if (!pendingData || pendingData.count === 0) return true;

    try {
      if (financialAction === 'keep') {
        // Mark transactions as not receivable
        const { error } = await supabase
          .from("financeiro_lancamentos")
          .update({ a_receber: false })
          .eq("cliente_id", clientId)
          .eq("a_receber", true);

        if (error) throw error;
      } else {
        // Delete pending transactions
        const { error } = await supabase
          .from("financeiro_lancamentos")
          .delete()
          .eq("cliente_id", clientId)
          .eq("a_receber", true);

        if (error) throw error;
      }
      return true;
    } catch (error: any) {
      console.error("Erro ao processar transações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar as transações financeiras.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSetInactive = async () => {
    setLoading(true);
    try {
      // First handle financial data
      const financialSuccess = await handleFinancialAction();
      if (!financialSuccess) {
        setLoading(false);
        return;
      }

      // Then inactivate the client
      const { error } = await supabase
        .from("clientes")
        .update({ status: "inativo" })
        .eq("id", clientId);

      if (error) throw error;

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });

      const actionMessage = pendingData && pendingData.count > 0
        ? financialAction === 'keep'
          ? `${pendingData.count} transação(ões) foram marcadas como não a receber.`
          : `${pendingData.count} transação(ões) pendentes foram excluídas.`
        : '';

      toast({
        title: "Cliente inativado",
        description: `${clientName} foi marcado como inativo.${actionMessage ? ' ' + actionMessage : ''}`,
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const hasPendingTransactions = pendingData && pendingData.count > 0;

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
          <AlertDialogDescription className="pt-2" asChild>
            <div className="space-y-4">
              <p>
                Tem certeza que deseja marcar <strong className="text-foreground">{clientName}</strong> como inativo?
              </p>
              
              {fetchingData ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando transações pendentes...</span>
                </div>
              ) : hasPendingTransactions ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Este cliente possui:</p>
                      <ul className="text-sm text-amber-700 mt-1">
                        <li>• {pendingData.count} transação(ões) pendentes (A Receber)</li>
                        <li>• {formatCurrency(pendingData.total)} em valores a receber</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">O que fazer com os dados financeiros?</p>
                    <RadioGroup 
                      value={financialAction} 
                      onValueChange={(value) => setFinancialAction(value as 'keep' | 'delete')}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="keep" id="keep" className="mt-0.5" />
                        <div className="space-y-1">
                          <Label htmlFor="keep" className="font-medium cursor-pointer">
                            Manter transações (ficam no histórico)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Marca como "não a receber" para sair dos alertas e relatórios
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="delete" id="delete" className="mt-0.5" />
                        <div className="space-y-1">
                          <Label htmlFor="delete" className="font-medium cursor-pointer">
                            Excluir transações pendentes
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Remove completamente os lançamentos futuros do sistema
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  O cliente não aparecerá mais na lista de planos vencidos e poderá ser reativado posteriormente.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSetInactive}
            disabled={loading || fetchingData}
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
