import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Interaction {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  data_interacao: string;
}

interface EditInteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interaction: Interaction | null;
  onInteractionUpdated: () => void;
}

export const EditInteractionDialog = ({ open, onOpenChange, interaction, onInteractionUpdated }: EditInteractionDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "",
    titulo: "",
    descricao: "",
    data_interacao: ""
  });

  useEffect(() => {
    if (interaction) {
      setFormData({
        tipo: interaction.tipo,
        titulo: interaction.titulo,
        descricao: interaction.descricao || "",
        data_interacao: new Date(interaction.data_interacao).toISOString().split('T')[0]
      });
    }
  }, [interaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.empresa_id || !formData.tipo || !formData.titulo || !interaction) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cs_interacoes')
        .update({
          tipo: formData.tipo,
          titulo: formData.titulo,
          descricao: formData.descricao,
          data_interacao: new Date(formData.data_interacao).toISOString()
        })
        .eq('id', interaction.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Interação atualizada com sucesso!",
      });

      onOpenChange(false);
      onInteractionUpdated();
    } catch (error) {
      console.error('Erro ao atualizar interação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a interação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Interação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo de Interação *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Ligação</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Follow-up semanal"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Detalhes da interação..."
            />
          </div>
          
          <div>
            <Label htmlFor="data">Data da Interação</Label>
            <Input
              id="data"
              type="date"
              value={formData.data_interacao}
              onChange={(e) => setFormData({ ...formData, data_interacao: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#43B26D] hover:bg-[#37A05B]">
              {loading ? "Atualizando..." : "Atualizar Interação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};