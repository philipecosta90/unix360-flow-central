import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useServicos, type Servico } from "@/hooks/useServicos";

interface EditServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico: Servico;
}

const tipoToDuracao: Record<string, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
  avulso: 0,
};

const categorias = [
  "Serviços",
  "Consultoria",
  "Produtos",
  "Aulas",
  "Eventos",
  "Outros",
];

export const EditServicoDialog = ({ open, onOpenChange, servico }: EditServicoDialogProps) => {
  const { updateServico } = useServicos();
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    valor: "",
    tipo: "mensal",
    duracao_meses: 1,
    categoria: "Serviços",
    ativo: true,
  });

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao || "",
        valor: servico.valor.toString(),
        tipo: servico.tipo,
        duracao_meses: servico.duracao_meses,
        categoria: servico.categoria,
        ativo: servico.ativo,
      });
    }
  }, [servico]);

  const handleTipoChange = (tipo: string) => {
    setFormData(prev => ({
      ...prev,
      tipo,
      duracao_meses: tipoToDuracao[tipo] || prev.duracao_meses,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.valor) {
      return;
    }

    await updateServico.mutateAsync({
      id: servico.id,
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || undefined,
      valor: parseFloat(formData.valor),
      tipo: formData.tipo,
      duracao_meses: formData.duracao_meses,
      categoria: formData.categoria,
      ativo: formData.ativo,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Serviço *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Consultoria Mensal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o serviço..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={handleTipoChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="avulso">Avulso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (meses)</Label>
              <Input
                id="duracao"
                type="number"
                min="0"
                value={formData.duracao_meses}
                onChange={(e) => setFormData(prev => ({ ...prev, duracao_meses: parseInt(e.target.value) || 0 }))}
                disabled={formData.tipo === "avulso"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="ativo" className="cursor-pointer">Serviço ativo</Label>
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateServico.isPending}>
              {updateServico.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
