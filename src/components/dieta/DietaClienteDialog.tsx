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
import { useClients } from '@/hooks/useClients';
import { DietaTemplate } from '@/types/dieta';

interface DietaClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: DietaTemplate[];
}

const OBJETIVOS = [
  'Emagrecimento',
  'Hipertrofia',
  'Manutenção',
  'Performance Esportiva',
  'Saúde Geral',
  'Definição Muscular'
];

export const DietaClienteDialog = ({ open, onOpenChange, templates }: DietaClienteDialogProps) => {
  const { createDietaCliente, duplicateFromTemplate } = useDietas();
  const { data: clients = [] } = useClients();
  const [loading, setLoading] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState({
    cliente_id: '',
    nome: '',
    descricao: '',
    objetivo: '',
    calorias_total: '',
    proteinas_g: '',
    carboidratos_g: '',
    gorduras_g: '',
    data_inicio: '',
    observacoes_profissional: ''
  });

  // clients are fetched automatically via react-query

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id) return;

    setLoading(true);
    try {
      if (useTemplate && selectedTemplate) {
        await duplicateFromTemplate(selectedTemplate, formData.cliente_id);
      } else {
        if (!formData.nome.trim()) return;
        
        await createDietaCliente({
          cliente_id: formData.cliente_id,
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          objetivo: formData.objetivo || undefined,
          calorias_total: formData.calorias_total ? parseInt(formData.calorias_total) : undefined,
          proteinas_g: formData.proteinas_g ? parseFloat(formData.proteinas_g) : undefined,
          carboidratos_g: formData.carboidratos_g ? parseFloat(formData.carboidratos_g) : undefined,
          gorduras_g: formData.gorduras_g ? parseFloat(formData.gorduras_g) : undefined,
          data_inicio: formData.data_inicio || undefined,
          observacoes_profissional: formData.observacoes_profissional || undefined
        });
      }
      
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      nome: '',
      descricao: '',
      objetivo: '',
      calorias_total: '',
      proteinas_g: '',
      carboidratos_g: '',
      gorduras_g: '',
      data_inicio: '',
      observacoes_profissional: ''
    });
    setUseTemplate(false);
    setSelectedTemplate('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Dieta para Cliente</DialogTitle>
          <DialogDescription>
            Crie uma dieta personalizada ou use um template
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <Select
              value={formData.cliente_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {templates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useTemplate"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="useTemplate" className="cursor-pointer">
                  Usar template existente
                </Label>
              </div>

              {useTemplate && (
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome} {template.objetivo && `(${template.objetivo})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {!useTemplate && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Dieta *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Dieta Personalizada - João"
                  required={!useTemplate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva a dieta..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="objetivo">Objetivo</Label>
                  <Select
                    value={formData.objetivo}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, objetivo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJETIVOS.map(obj => (
                        <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                  />
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações do Profissional</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes_profissional}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes_profissional: e.target.value }))}
                  placeholder="Anotações internas..."
                  rows={2}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.cliente_id || (!useTemplate && !formData.nome.trim()) || (useTemplate && !selectedTemplate)}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {useTemplate ? 'Criar a partir do Template' : 'Criar Dieta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
