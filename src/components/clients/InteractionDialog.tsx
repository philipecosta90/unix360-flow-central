
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface InteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onInteractionAdded: () => void;
}

export const InteractionDialog = ({ open, onOpenChange, clientId, onInteractionAdded }: InteractionDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "",
    titulo: "",
    descricao: "",
    data_interacao: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.empresa_id || !formData.tipo || !formData.titulo) {
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
        .insert([{
          empresa_id: userProfile.empresa_id,
          cliente_id: clientId,
          tipo: formData.tipo,
          titulo: formData.titulo,
          descricao: formData.descricao,
          data_interacao: new Date(formData.data_interacao).toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Interação registrada com sucesso!",
      });

      setFormData({
        tipo: "",
        titulo: "",
        descricao: "",
        data_interacao: new Date().toISOString().split('T')[0]
      });
      onOpenChange(false);
      onInteractionAdded();
    } catch (error) {
      console.error('Erro ao registrar interação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a interação.",
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
          <DialogTitle>Registrar Nova Interação</DialogTitle>
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
              {loading ? "Registrando..." : "Registrar Interação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
