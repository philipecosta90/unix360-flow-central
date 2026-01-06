import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { useClients } from "@/hooks/useClients";
import { useServicos } from "@/hooks/useServicos";
import { toast } from "sonner";
import { toLocalISODate } from "@/utils/dateUtils";
import { Package } from "lucide-react";

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
    data: toLocalISODate(),
    a_receber: false,
    recorrente: false,
    cliente_id: 'none',
    servico_id: 'none',
  });

  const { createTransaction } = useFinancialTransactions();
  const { data: clientes = [] } = useClients();
  const { servicosAtivos } = useServicos();

  const handleServicoChange = (servicoId: string) => {
    if (servicoId === 'none') {
      setFormData(prev => ({ ...prev, servico_id: 'none' }));
      return;
    }

    const servico = servicosAtivos.find(s => s.id === servicoId);
    if (servico) {
      setFormData(prev => ({
        ...prev,
        servico_id: servicoId,
        descricao: servico.nome,
        valor: servico.valor.toString(),
        categoria: servico.categoria,
        tipo: 'entrada',
        recorrente: servico.tipo !== 'avulso',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.categoria) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        data: formData.data,
        a_receber: formData.a_receber,
        recorrente: formData.recorrente,
        cliente_id: formData.cliente_id !== 'none' ? formData.cliente_id : undefined,
        servico_id: formData.servico_id !== 'none' ? formData.servico_id : undefined,
      });
      
      toast.success("Transação criada com sucesso!");
      onOpenChange(false);
      setFormData({
        tipo: 'entrada',
        descricao: '',
        valor: '',
        categoria: '',
        data: toLocalISODate(),
        a_receber: false,
        recorrente: false,
        cliente_id: 'none',
        servico_id: 'none',
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
          {/* Seleção de Serviço */}
          {servicosAtivos.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="servico" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Serviço (Opcional)
              </Label>
              <Select value={formData.servico_id} onValueChange={handleServicoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (preenchimento manual)</SelectItem>
                  {servicosAtivos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id}>
                      {servico.nome} - R$ {servico.valor.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ao selecionar um serviço, os campos serão preenchidos automaticamente
              </p>
            </div>
          )}

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
                <SelectItem value="Aulas">Aulas</SelectItem>
                <SelectItem value="Eventos">Eventos</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente (Opcional)</Label>
            <Select value={formData.cliente_id} onValueChange={(value) => setFormData({...formData, cliente_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
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

          <div className="flex items-center space-x-2">
            <Switch
              id="recorrente"
              checked={formData.recorrente}
              onCheckedChange={(checked) => setFormData({...formData, recorrente: checked})}
            />
            <Label htmlFor="recorrente">Recorrente mensal</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
