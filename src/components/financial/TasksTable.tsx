
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Calendar, AlertTriangle, Edit } from "lucide-react";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { TaskFormModal } from "../tasks/TaskFormModal";
import { useState } from "react";

interface Task {
  id: string;
  cliente_id: string | null;
  descricao: string;
  vencimento: string;
  concluida: boolean;
  created_at: string;
}

interface TasksTableProps {
  tasks: Task[];
}

export const TasksTable = ({ tasks }: TasksTableProps) => {
  const { updateTask, deleteTask } = useFinancialTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (vencimento: string, concluida: boolean) => {
    if (concluida) {
      return (
        <Badge variant="outline" className="bg-task-success-muted text-task-success-muted-foreground">
          Concluída
        </Badge>
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = vencimento < today;
    const isDueToday = vencimento === today;

    if (isOverdue) {
      return (
        <Badge className="bg-task-overdue text-task-overdue-foreground flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vencida
        </Badge>
      );
    }

    if (isDueToday) {
      return (
        <Badge className="bg-task-warning text-task-warning-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Vence Hoje
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        Pendente
      </Badge>
    );
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateTask.mutateAsync({ id, concluida: completed });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">✓</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[160px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhuma tarefa encontrada
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} className={task.concluida ? "opacity-60" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={task.concluida}
                      onCheckedChange={(checked) => handleToggleComplete(task.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className={`font-medium ${task.concluida ? "line-through" : ""}`}>
                    {task.descricao}
                  </TableCell>
                  <TableCell>{formatDate(task.vencimento)}</TableCell>
                  <TableCell>
                    {getStatusBadge(task.vencimento, task.concluida)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                             handleDelete(task.id);
                           }
                         }}
                         className="text-red-600 hover:text-red-800"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TaskFormModal
        open={showEditModal}
        onOpenChange={handleCloseEditModal}
        task={editingTask}
      />
    </>
  );
};
