import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, CheckCircle } from "lucide-react";

interface SubscriptionData {
  id: string;
  nome: string;
  sobrenome?: string;
  email: string;
  empresa_id?: string;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    subscription_status: subscription.subscription_status,
    subscription_plan: subscription.subscription_plan || 'free',
    trial_end_date: subscription.trial_end_date || '',
    data_de_expiracao_da_assinatura_ativa: subscription.data_de_expiracao_da_assinatura_ativa || '',
    ativo: subscription.ativo,
    observacoes: ''
  });
  const { toast } = useToast();

  // Resetar formData quando a subscription mudar ou dialog abrir
  useEffect(() => {
    if (open) {
      setFormData({
        subscription_status: subscription.subscription_status,
        subscription_plan: subscription.subscription_plan || 'free',
        trial_end_date: subscription.trial_end_date || '',
        data_de_expiracao_da_assinatura_ativa: subscription.data_de_expiracao_da_assinatura_ativa || '',
        ativo: subscription.ativo,
        observacoes: ''
      });
    }
  }, [open, subscription]);

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
        // Preservar data de início existente se já era ativo, senão usar hoje
        const dataInicio = subscription.subscription_status === 'active' && subscription.data_de_assinatura_ativa
          ? subscription.data_de_assinatura_ativa
          : new Date().toISOString().split('T')[0];
        
        // Validar que expiração é posterior ao início
        if (formData.data_de_expiracao_da_assinatura_ativa) {
          const dataInicioDate = new Date(dataInicio);
          const dataExpiracaoDate = new Date(formData.data_de_expiracao_da_assinatura_ativa);
          
          if (dataExpiracaoDate <= dataInicioDate) {
            toast({
              title: "Erro de validação",
              description: "A data de expiração deve ser posterior à data de início da assinatura",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }
        
        updateData.data_de_assinatura_ativa = dataInicio;
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

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Primeiro, excluir o perfil
      const { error: perfilError } = await supabase
        .from('perfis')
        .delete()
        .eq('id', subscription.id);

      if (perfilError) {
        throw perfilError;
      }

      // Se tiver empresa_id, excluir a empresa também (se não houver outros perfis)
      if (subscription.empresa_id) {
        // Verificar se há outros perfis na empresa
        const { data: outrosPerfis } = await supabase
          .from('perfis')
          .select('id')
          .eq('empresa_id', subscription.empresa_id)
          .limit(1);

        if (!outrosPerfis || outrosPerfis.length === 0) {
          // Não há outros perfis, excluir a empresa
          await supabase
            .from('empresas')
            .delete()
            .eq('id', subscription.empresa_id);
        }
      }

      toast({
        title: "Sucesso",
        description: "Empresa/assinatura excluída com sucesso",
      });

      onUpdate();
      onClose();
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir empresa/assinatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async () => {
    try {
      setLoading(true);
      
      // Calcular data de expiração (1 ano a partir de hoje por padrão)
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const expirationDate = formData.data_de_expiracao_da_assinatura_ativa || nextYear.toISOString().split('T')[0];

      const { error } = await supabase
        .from('perfis')
        .update({
          subscription_status: 'active',
          data_de_assinatura_ativa: today.toISOString().split('T')[0],
          data_de_expiracao_da_assinatura_ativa: expirationDate,
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura ativada com sucesso",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Erro ao ativar assinatura:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao ativar assinatura",
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

  // Mostrar botão ativar se status atual não é 'active'
  const showActivateButton = subscription.subscription_status !== 'active';

  return (
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa/assinatura de <strong>{subscription.nome}</strong>?
              Esta ação não pode ser desfeita e todos os dados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

          {showActivateButton && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handleActivateSubscription} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Ativar Assinatura (1 ano)
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => setShowDeleteConfirm(true)} 
              variant="destructive" 
              size="sm"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
    </>
  );
};