import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface DietaAlimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    nome: string;
    quantidade?: string;
    calorias?: number;
    proteinas_g?: number;
    carboidratos_g?: number;
    gorduras_g?: number;
    observacoes?: string;
  }) => Promise<void>;
}

export const DietaAlimentoDialog = ({ open, onOpenChange, onSubmit }: DietaAlimentoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    quantidade: '',
    calorias: '',
    proteinas_g: '',
    carboidratos_g: '',
    gorduras_g: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        nome: formData.nome,
        quantidade: formData.quantidade || undefined,
        calorias: formData.calorias ? parseInt(formData.calorias) : undefined,
        proteinas_g: formData.proteinas_g ? parseFloat(formData.proteinas_g) : undefined,
        carboidratos_g: formData.carboidratos_g ? parseFloat(formData.carboidratos_g) : undefined,
        gorduras_g: formData.gorduras_g ? parseFloat(formData.gorduras_g) : undefined,
        observacoes: formData.observacoes || undefined
      });
      setFormData({
        nome: '',
        quantidade: '',
        calorias: '',
        proteinas_g: '',
        carboidratos_g: '',
        gorduras_g: '',
        observacoes: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Alimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Alimento *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Peito de Frango Grelhado"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              value={formData.quantidade}
              onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
              placeholder="Ex: 150g, 1 unidade, 2 colheres"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="calorias">Calorias (kcal)</Label>
              <Input
                id="calorias"
                type="number"
                value={formData.calorias}
                onChange={(e) => setFormData(prev => ({ ...prev, calorias: e.target.value }))}
                placeholder="Ex: 165"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proteinas">Proteínas (g)</Label>
              <Input
                id="proteinas"
                type="number"
                step="0.1"
                value={formData.proteinas_g}
                onChange={(e) => setFormData(prev => ({ ...prev, proteinas_g: e.target.value }))}
                placeholder="Ex: 31"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carboidratos">Carboidratos (g)</Label>
              <Input
                id="carboidratos"
                type="number"
                step="0.1"
                value={formData.carboidratos_g}
                onChange={(e) => setFormData(prev => ({ ...prev, carboidratos_g: e.target.value }))}
                placeholder="Ex: 0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gorduras">Gorduras (g)</Label>
              <Input
                id="gorduras"
                type="number"
                step="0.1"
                value={formData.gorduras_g}
                onChange={(e) => setFormData(prev => ({ ...prev, gorduras_g: e.target.value }))}
                placeholder="Ex: 3.6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Ex: Pode substituir por filé de tilápia..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.nome.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
