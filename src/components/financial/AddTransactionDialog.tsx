
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { toast } from "sonner";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTransactionDialog = ({ open, onOpenChange }: AddTransactionDialogProps) => {
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    valor: '',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    a_receber: false,
  });

  const { createTransaction } = useFinancialTransactions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.categoria) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        ...formData,
        valor: parseFloat(formData.valor),
      });
      
      toast.success("Transação criada com sucesso!");
      onOpenChange(false);
      setFormData({
        tipo: 'entrada',
        descricao: '',
        valor: '',
        categoria: '',
        data: new Date().toISOString().split('T')[0],
        a_receber: false,
      });
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast.error("Erro ao criar transação");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => setFormData({...formData, tipo: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Receita</SelectItem>
                <SelectItem value="saida">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descrição da transação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Produtos">Produtos</SelectItem>
                <SelectItem value="Consultoria">Consultoria</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="a_receber"
              checked={formData.a_receber}
              onCheckedChange={(checked) => setFormData({...formData, a_receber: checked})}
            />
            <Label htmlFor="a_receber">A receber</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#43B26D] hover:bg-[#37A05B]"
              disabled={createTransaction.isPending}
            >
              {createTransaction.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
