
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddActivityDialogProps {
  prospectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddActivityDialog = ({ prospectId, open, onOpenChange }: AddActivityDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    tipo: "none",
    titulo: "",
    descricao: "",
    data_atividade: new Date().toISOString().slice(0, 16), // Current datetime in HTML format
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!prospectId || !userProfile?.id) {
        throw new Error('Missing prospect ID or user profile');
      }

      const { error } = await supabase
        .from('crm_atividades')
        .insert({
          prospect_id: prospectId,
          tipo: data.tipo === "none" ? null : data.tipo,
          titulo: data.titulo,
          descricao: data.descricao,
          data_atividade: data.data_atividade,
          created_by: userProfile.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities', prospectId] });
      toast({
        title: "Atividade criada",
        description: "A atividade foi registrada com sucesso.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating activity:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a atividade.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      tipo: "none",
      titulo: "",
      descricao: "",
      data_atividade: new Date().toISOString().slice(0, 16),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tipo === "none" || !formData.titulo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o tipo e título da atividade.",
        variant: "destructive",
      });
      return;
    }

    createActivityMutation.mutate(formData);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione o tipo</SelectItem>
                  <SelectItem value="call">Ligação</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_atividade">Data/Hora</Label>
              <Input
                id="data_atividade"
                type="datetime-local"
                value={formData.data_atividade}
                onChange={(e) => setFormData(prev => ({ ...prev, data_atividade: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Ligação de follow-up"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Detalhes da atividade..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createActivityMutation.isPending}
              className="bg-[#43B26D] hover:bg-[#37A05B]"
            >
              {createActivityMutation.isPending ? "Criando..." : "Criar Atividade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
