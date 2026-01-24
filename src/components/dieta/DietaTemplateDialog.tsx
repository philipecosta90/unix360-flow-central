import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useDietas } from '@/hooks/useDietas';

interface DietaTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OBJETIVOS = [
  'Emagrecimento',
  'Hipertrofia',
  'Manutenção',
  'Performance Esportiva',
  'Saúde Geral',
  'Definição Muscular'
];

export const DietaTemplateDialog = ({ open, onOpenChange }: DietaTemplateDialogProps) => {
  const { createTemplate } = useDietas();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    objetivo: '',
    calorias_total: '',
    proteinas_g: '',
    carboidratos_g: '',
    gorduras_g: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setLoading(true);
    try {
      await createTemplate({
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        objetivo: formData.objetivo || undefined,
        calorias_total: formData.calorias_total ? parseInt(formData.calorias_total) : undefined,
        proteinas_g: formData.proteinas_g ? parseFloat(formData.proteinas_g) : undefined,
        carboidratos_g: formData.carboidratos_g ? parseFloat(formData.carboidratos_g) : undefined,
        gorduras_g: formData.gorduras_g ? parseFloat(formData.gorduras_g) : undefined
      });
      
      setFormData({
        nome: '',
        descricao: '',
        objetivo: '',
        calorias_total: '',
        proteinas_g: '',
        carboidratos_g: '',
        gorduras_g: ''
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Template de Dieta</DialogTitle>
          <DialogDescription>
            Crie um modelo de dieta reutilizável
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Template *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Dieta Low Carb"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o objetivo e características desta dieta..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo</Label>
            <Select
              value={formData.objetivo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, objetivo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent>
                {OBJETIVOS.map(obj => (
                  <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calorias">Calorias (kcal)</Label>
              <Input
                id="calorias"
                type="number"
                value={formData.calorias_total}
                onChange={(e) => setFormData(prev => ({ ...prev, calorias_total: e.target.value }))}
                placeholder="Ex: 2000"
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
                placeholder="Ex: 150"
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
                placeholder="Ex: 200"
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
                placeholder="Ex: 60"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.nome.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
