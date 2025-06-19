
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { useCRMProspects } from "@/hooks/useCRMProspects";
import { toast } from "sonner";

interface Task {
  id: string;
  cliente_id: string | null;
  descricao: string;
  vencimento: string;
  concluida: boolean;
  created_at: string;
}

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

export const TaskFormModal = ({ open, onOpenChange, task }: TaskFormModalProps) => {
  const [formData, setFormData] = useState({
    descricao: '',
    vencimento: new Date().toISOString().split('T')[0],
    cliente_id: '',
    concluida: false,
  });

  const { createTask, updateTask } = useFinancialTasks();
  const { data: prospects = [] } = useCRMProspects({
    search: "",
    tags: [],
    responsavel: "",
    stage: "",
    startDate: undefined,
    endDate: undefined,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        descricao: task.descricao ?? '',
        vencimento: task.vencimento ?? new Date().toISOString().split('T')[0],
        cliente_id: task.cliente_id ?? '',
        concluida: task.concluida ?? false,
      });
    } else {
      setFormData({
        descricao: '',
        vencimento: new Date().toISOString().split('T')[0],
        cliente_id: '',
        concluida: false,
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const descricaoSegura = formData.descricao?.trim() ?? "";
    const vencimentoSeguro = formData.vencimento ?? "";
    
    if (!descricaoSegura || !vencimentoSeguro) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const taskData = {
        descricao: descricaoSegura,
        vencimento: vencimentoSeguro,
        cliente_id: formData.cliente_id || null,
        concluida: formData.concluida ?? false,
      };

      if (task) {
        await updateTask.mutateAsync({ id: task.id, ...taskData });
        toast.success("Tarefa atualizada com sucesso!");
      } else {
        await createTask.mutateAsync(taskData);
        toast.success("Tarefa criada com sucesso!");
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error("Erro ao salvar tarefa");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao ?? ''}
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
              value={formData.vencimento ?? ''}
              onChange={(e) => setFormData({...formData, vencimento: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente (Opcional)</Label>
            <Select 
              value={formData.cliente_id ?? ''} 
              onValueChange={(value) => setFormData({...formData, cliente_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum cliente</SelectItem>
                {prospects.map((prospect) => (
                  <SelectItem key={prospect.id} value={prospect.id}>
                    {prospect.nome ?? "Cliente sem nome"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="concluida"
              checked={formData.concluida ?? false}
              onCheckedChange={(checked) => setFormData({...formData, concluida: checked as boolean})}
            />
            <Label htmlFor="concluida">Marcar como Concluída</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#43B26D] hover:bg-[#37A05B]"
              disabled={createTask.isPending || updateTask.isPending}
            >
              {createTask.isPending || updateTask.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
