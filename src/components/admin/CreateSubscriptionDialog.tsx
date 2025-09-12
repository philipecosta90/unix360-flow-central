import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateSubscriptionDialogProps {
  onSuccess: () => void;
}

export const CreateSubscriptionDialog = ({ onSuccess }: CreateSubscriptionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    empresa_id: "",
    status: "active",
    monthly_value: "75.00",
    days: "30"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-subscription', {
        body: {
          empresa_id: formData.empresa_id,
          status: formData.status,
          monthly_value: parseFloat(formData.monthly_value),
          days: parseInt(formData.days)
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura criada com sucesso!",
      });

      setOpen(false);
      setFormData({
        empresa_id: "",
        status: "active",
        monthly_value: "75.00",
        days: "30"
      });
      onSuccess();
    } catch (error: any) {
      console.error('Create subscription error:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar assinatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Assinatura
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Assinatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="empresa_id">ID da Empresa</Label>
            <Input
              id="empresa_id"
              value={formData.empresa_id}
              onChange={(e) => setFormData({...formData, empresa_id: e.target.value})}
              placeholder="UUID da empresa"
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="monthly_value">Valor Mensal (R$)</Label>
            <Input
              id="monthly_value"
              type="number"
              step="0.01"
              value={formData.monthly_value}
              onChange={(e) => setFormData({...formData, monthly_value: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="days">Dias do Período</Label>
            <Input
              id="days"
              type="number"
              value={formData.days}
              onChange={(e) => setFormData({...formData, days: e.target.value})}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Assinatura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};