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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Edit2 } from 'lucide-react';
import { AlimentoSearchInput } from './AlimentoSearchInput';
import { useAlimentosBase } from '@/hooks/useAlimentosBase';
import type { AlimentoBase } from '@/types/dieta';

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
    alimento_base_id?: string;
    tabela_origem?: string;
  }) => Promise<void>;
}

export const DietaAlimentoDialog = ({ open, onOpenChange, onSubmit }: DietaAlimentoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'busca' | 'manual'>('busca');
  const { calculateNutrientsByPortion } = useAlimentosBase();
  
  const [formData, setFormData] = useState({
    nome: '',
    quantidade: '',
    calorias: '',
    proteinas_g: '',
    carboidratos_g: '',
    gorduras_g: '',
    observacoes: '',
    alimento_base_id: '',
    tabela_origem: ''
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      quantidade: '',
      calorias: '',
      proteinas_g: '',
      carboidratos_g: '',
      gorduras_g: '',
      observacoes: '',
      alimento_base_id: '',
      tabela_origem: ''
    });
  };

  const handleSelectFromSearch = async (alimento: AlimentoBase, portionGrams: number, medidaTexto: string) => {
    const nutrients = calculateNutrientsByPortion(alimento, portionGrams);
    
    setLoading(true);
    try {
      await onSubmit({
        nome: alimento.nome,
        quantidade: medidaTexto,
        calorias: nutrients.calorias,
        proteinas_g: nutrients.proteinas_g,
        carboidratos_g: nutrients.carboidratos_g,
        gorduras_g: nutrients.gorduras_g,
        alimento_base_id: alimento.id,
        tabela_origem: alimento.tabela_origem
      });
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
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
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Alimento</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'busca' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="busca" className="flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-1.5">
              <Edit2 className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="busca" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Busque alimentos nas tabelas TACO, TBCA e mais
                </Label>
                <AlimentoSearchInput
                  onSelect={handleSelectFromSearch}
                  onManualAdd={() => setActiveTab('manual')}
                  placeholder="Digite para buscar... (ex: frango, arroz)"
                />
              </div>
              
              <p className="text-xs text-muted-foreground text-center py-4">
                Os valores nutricionais são calculados automaticamente com base na quantidade informada.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
