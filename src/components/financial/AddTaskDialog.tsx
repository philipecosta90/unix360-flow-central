
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { toast } from "sonner";
import { toLocalISODate } from "@/utils/dateUtils";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTaskDialog = ({ open, onOpenChange }: AddTaskDialogProps) => {
  const [formData, setFormData] = useState({
    descricao: '',
    vencimento: toLocalISODate(new Date()),
  });

  const { createTask } = useFinancialTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.vencimento) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createTask.mutateAsync(formData);
      
      toast.success("Tarefa criada com sucesso!");
      onOpenChange(false);
      setFormData({
        descricao: '',
        vencimento: toLocalISODate(new Date()),
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error("Erro ao criar tarefa");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descreva a tarefa..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vencimento">Data de Vencimento *</Label>
            <Input
              id="vencimento"
              type="date"
              value={formData.vencimento}
              onChange={(e) => setFormData({...formData, vencimento: e.target.value})}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#43B26D] hover:bg-[#37A05B]"
              disabled={createTask.isPending}
            >
              {createTask.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
