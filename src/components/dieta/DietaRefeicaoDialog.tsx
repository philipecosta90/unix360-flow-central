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

interface DietaRefeicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nome: string; horario_sugerido?: string; observacoes?: string }) => Promise<void>;
}

const REFEICOES_SUGERIDAS = [
  'Café da Manhã',
  'Lanche da Manhã',
  'Almoço',
  'Lanche da Tarde',
  'Pré-Treino',
  'Pós-Treino',
  'Jantar',
  'Ceia'
];

export const DietaRefeicaoDialog = ({ open, onOpenChange, onSubmit }: DietaRefeicaoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    horario_sugerido: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        nome: formData.nome,
        horario_sugerido: formData.horario_sugerido || undefined,
        observacoes: formData.observacoes || undefined
      });
      setFormData({ nome: '', horario_sugerido: '', observacoes: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (nome: string) => {
    setFormData(prev => ({ ...prev, nome }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Refeição</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Sugestões Rápidas</Label>
            <div className="flex flex-wrap gap-2">
              {REFEICOES_SUGERIDAS.map(nome => (
                <Button
                  key={nome}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(nome)}
                  className={formData.nome === nome ? 'border-primary' : ''}
                >
                  {nome}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Refeição *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Café da Manhã"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horario">Horário Sugerido</Label>
            <Input
              id="horario"
              type="time"
              value={formData.horario_sugerido}
              onChange={(e) => setFormData(prev => ({ ...prev, horario_sugerido: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações sobre esta refeição..."
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
