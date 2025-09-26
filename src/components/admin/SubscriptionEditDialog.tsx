import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SubscriptionData {
  id: string;
  nome: string;
  sobrenome?: string;
  email: string;
  subscription_status: string;
  subscription_plan?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  data_de_assinatura_ativa?: string;
  data_de_expiracao_da_assinatura_ativa?: string;
  ativo: boolean;
}

interface SubscriptionEditDialogProps {
  open: boolean;
  onClose: () => void;
  subscription: SubscriptionData;
  onUpdate: () => void;
}

export const SubscriptionEditDialog = ({ 
  open, 
  onClose, 
  subscription, 
  onUpdate 
}: SubscriptionEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subscription_status: subscription.subscription_status,
    subscription_plan: subscription.subscription_plan || 'free',
    trial_end_date: subscription.trial_end_date || '',
    data_de_expiracao_da_assinatura_ativa: subscription.data_de_expiracao_da_assinatura_ativa || '',
    ativo: subscription.ativo,
    observacoes: ''
  });
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const updateData: any = {
        subscription_status: formData.subscription_status,
        subscription_plan: formData.subscription_plan,
        ativo: formData.ativo,
        updated_at: new Date().toISOString()
      };

      // Ajustar datas baseadas no status
      if (formData.subscription_status === 'trial') {
        updateData.trial_end_date = formData.trial_end_date || null;
        updateData.data_de_assinatura_ativa = null;
        updateData.data_de_expiracao_da_assinatura_ativa = null;
      } else if (formData.subscription_status === 'active') {
        updateData.data_de_assinatura_ativa = new Date().toISOString().split('T')[0];
        updateData.data_de_expiracao_da_assinatura_ativa = formData.data_de_expiracao_da_assinatura_ativa || null;
      } else {
        // Para status expired ou canceled, manter as datas existentes
        if (formData.subscription_status === 'expired') {
          updateData.ativo = false;
        }
      }

      const { error } = await supabase
        .from('perfis')
        .update(updateData)
        .eq('id', subscription.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Assinatura atualizada com sucesso",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar assinatura:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar assinatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEndDateLabel = () => {
    if (formData.subscription_status === 'trial') {
      return 'Data de Fim do Trial';
    }
    return 'Data de Expiração da Assinatura';
  };

  const getEndDateValue = () => {
    if (formData.subscription_status === 'trial') {
      return formData.trial_end_date;
    }
    return formData.data_de_expiracao_da_assinatura_ativa;
  };

  const handleEndDateChange = (value: string) => {
    if (formData.subscription_status === 'trial') {
      setFormData(prev => ({ ...prev, trial_end_date: value }));
    } else {
      setFormData(prev => ({ ...prev, data_de_expiracao_da_assinatura_ativa: value }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar Assinatura - {subscription.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Status da Assinatura</Label>
            <Select 
              value={formData.subscription_status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="plan">Plano</Label>
            <Select 
              value={formData.subscription_plan} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_plan: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="endDate">{getEndDateLabel()}</Label>
            <Input
              type="date"
              value={getEndDateValue()}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="ativo">Status do Usuário</Label>
            <Select 
              value={formData.ativo ? "true" : "false"} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, ativo: value === "true" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              placeholder="Adicione observações sobre esta alteração..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};