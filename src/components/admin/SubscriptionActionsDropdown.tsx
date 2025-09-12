import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Play, Pause, Ban, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionActionsDropdownProps {
  subscription: {
    id: string;
    status: string;
    empresas?: { nome?: string };
  };
  onSuccess: () => void;
}

export const SubscriptionActionsDropdown = ({ subscription, onSuccess }: SubscriptionActionsDropdownProps) => {
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const { toast } = useToast();

  const handleAction = async (action: string) => {
    if (action === 'delete') {
      setActionType(action);
      setAlertOpen(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-subscription', {
        body: {
          subscription_id: subscription.id,
          action,
          days: 30
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Assinatura ${getActionLabel(action)} com sucesso!`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Manage subscription error:', error);
      toast({
        title: "Erro",
        description: error.message || `Erro ao ${getActionLabel(action)} assinatura`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-subscription', {
        body: {
          subscription_id: subscription.id,
          action: 'delete'
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura excluída com sucesso!",
      });

      setAlertOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Delete subscription error:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir assinatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'activate': return 'ativada';
      case 'suspend': return 'suspensa';
      case 'cancel': return 'cancelada';
      case 'delete': return 'excluída';
      default: return action;
    }
  };

  const canActivate = subscription.status !== 'active';
  const canSuspend = subscription.status === 'active';
  const canCancel = subscription.status === 'active' || subscription.status === 'trial';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canActivate && (
            <DropdownMenuItem onClick={() => handleAction('activate')}>
              <Play className="h-4 w-4 mr-2" />
              Ativar
            </DropdownMenuItem>
          )}
          {canSuspend && (
            <DropdownMenuItem onClick={() => handleAction('suspend')}>
              <Pause className="h-4 w-4 mr-2" />
              Suspender
            </DropdownMenuItem>
          )}
          {canCancel && (
            <DropdownMenuItem onClick={() => handleAction('cancel')}>
              <Ban className="h-4 w-4 mr-2" />
              Cancelar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => handleAction('delete')}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a assinatura da empresa "{subscription.empresas?.nome || 'N/A'}"? 
              Esta ação não pode ser desfeita e todos os usuários da empresa perderão acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};