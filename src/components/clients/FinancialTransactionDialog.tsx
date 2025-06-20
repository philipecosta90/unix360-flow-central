
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FinancialTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onTransactionAdded: () => void;
}

export const FinancialTransactionDialog = ({ open, onOpenChange, clientId, onTransactionAdded }: FinancialTransactionDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "",
    categoria: "",
    descricao: "",
    valor: "",
    data: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.empresa_id || !formData.tipo || !formData.categoria || !formData.descricao || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Usar os valores corretos para o tipo conforme o check constraint do banco
      const tipoCorreto = formData.tipo === "receita" ? "entrada" : "saida";
      
      const { error } = await supabase
        .from('financeiro_lancamentos')
        .insert([{
          empresa_id: userProfile.empresa_id,
          tipo: tipoCorreto,
          categoria: formData.categoria,
          descricao: `${formData.descricao} - Cliente: ${clientId}`,
          valor: parseFloat(formData.valor),
          data: formData.data,
          created_by: userProfile.id
        }]);

      if (error) {
        console.error('Erro ao registrar movimentação:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Movimentação financeira registrada com sucesso!",
      });

      setFormData({
        tipo: "",
        categoria: "",
        descricao: "",
        valor: "",
        data: new Date().toISOString().split('T')[0]
      });
      onOpenChange(false);
      onTransactionAdded();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a movimentação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Movimentação Financeira</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="produtos">Produtos</SelectItem>
                <SelectItem value="consultoria">Consultoria</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da movimentação"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0,00"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#43B26D] hover:bg-[#37A05B]">
              {loading ? "Registrando..." : "Registrar Movimentação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
