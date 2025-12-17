import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { toast } from "sonner";
import { toLocalISODate } from "@/utils/dateUtils";

interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  a_receber: boolean;
  recorrente: boolean;
  cliente_id?: string;
}

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onTransactionUpdated?: () => void;
}

// Categorias disponíveis com valores normalizados
const CATEGORIAS = [
  { value: "servicos", label: "Serviços" },
  { value: "produtos", label: "Produtos" },
  { value: "consultoria", label: "Consultoria" },
  { value: "marketing", label: "Marketing" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "administrativo", label: "Administrativo" },
  { value: "outros", label: "Outros" },
];

// Normaliza categoria para lowercase para comparação
const normalizeCategoria = (categoria: string): string => {
  return categoria?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
};

export const EditTransactionDialog = ({ open, onOpenChange, transaction, onTransactionUpdated }: EditTransactionDialogProps) => {
  // Inicialização DIRETA do estado com dados da transação (sem useEffect)
  const [formData, setFormData] = useState(() => ({
    tipo: transaction?.tipo ?? 'entrada' as 'entrada' | 'saida',
    descricao: transaction?.descricao ?? '',
    valor: transaction?.valor?.toString() ?? '',
    categoria: normalizeCategoria(transaction?.categoria ?? ''),
    data: transaction?.data ?? toLocalISODate(),
    a_receber: transaction?.a_receber ?? false,
    recorrente: transaction?.recorrente ?? false,
  }));

  const { updateTransaction } = useFinancialTransactions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.categoria || !transaction) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        ...formData,
        valor: parseFloat(formData.valor),
        cliente_id: transaction.cliente_id,
      });
      
      toast.success("Transação atualizada com sucesso!");
      onOpenChange(false);
      onTransactionUpdated?.();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error("Erro ao atualizar transação");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
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
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
              disabled={updateTransaction.isPending}
            >
              {updateTransaction.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
