
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Contract {
  id: string;
  titulo: string;
  cliente_nome?: string;
  valor?: number;
  data_inicio: string;
  data_fim?: string;
  status: 'ativo' | 'inativo' | 'pendente' | 'cancelado';
  tipo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface EditContractDialogProps {
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (contractData: Contract) => Promise<void>;
}

export const EditContractDialog = ({ contract, open, onOpenChange, onSubmit }: EditContractDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    cliente_nome: "",
    valor: "",
    data_inicio: "",
    data_fim: "",
    status: "pendente" as const,
    tipo: "",
    observacoes: "",
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        titulo: contract.titulo || "",
        cliente_nome: contract.cliente_nome || "",
        valor: contract.valor ? contract.valor.toString() : "",
        data_inicio: contract.data_inicio || "",
        data_fim: contract.data_fim || "",
        status: contract.status || "pendente",
        tipo: contract.tipo || "",
        observacoes: contract.observacoes || "",
      });
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.data_inicio) {
      toast({
        title: "Erro",
        description: "Título e data de início são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...contract,
        titulo: formData.titulo,
        cliente_nome: formData.cliente_nome || undefined,
        valor: formData.valor ? parseFloat(formData.valor) : undefined,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || undefined,
        status: formData.status,
        tipo: formData.tipo || undefined,
        observacoes: formData.observacoes || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao editar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível editar o contrato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título*</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título do contrato"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="cliente_nome">Cliente</Label>
            <Input
              id="cliente_nome"
              value={formData.cliente_nome}
              onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data Início*</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Input
              id="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              placeholder="Tipo do contrato"
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações sobre o contrato"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#43B26D] hover:bg-[#37A05B]">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
