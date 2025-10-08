import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, Calendar, Edit, Trash2 } from "lucide-react";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { useClients } from "@/hooks/useClients";
import { TaskFormModal } from "./TaskFormModal";
import { useState } from "react";
import { toLocalISODate, formatDateDisplay } from "@/utils/dateUtils";

interface Task {
  id: string;
  cliente_id: string | null;
  descricao: string;
  vencimento: string;
  concluida: boolean;
  created_at: string;
}

interface TasksListProps {
  tasks: Task[];
}

export const TasksList = ({ tasks }: TasksListProps) => {
  const { updateTask, deleteTask } = useFinancialTasks();
  const { data: clientes = [] } = useClients();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Não vinculado";
    if (!clientes || clientes.length === 0) return "Cliente não encontrado";
    const client = clientes.find(c => c && c.id === clientId);
    return client?.nome || "Cliente não encontrado";
  };

  const getStatusBadge = (vencimento: string, concluida: boolean) => {
    if (concluida) {
      return (
        <Badge className="bg-task-success-muted text-task-success-muted-foreground">
          <CheckCircle className="h-3 w-3 mr-1" />
          Concluída
        </Badge>
      );
    }

    if (!vencimento) {
      return (
        <Badge className="bg-muted text-muted-foreground">
          Pendente
        </Badge>
      );
    }

    const vencimentoSeguro = vencimento.toString();
    const today = toLocalISODate(new Date());
    const isOverdue = vencimentoSeguro < today;
    const isDueToday = vencimentoSeguro === today;

    if (isOverdue) {
      return (
        <Badge className="bg-task-overdue-muted text-task-overdue-muted-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Vencida
        </Badge>
      );
    }

    if (isDueToday) {
      return (
        <Badge className="bg-task-warning-muted text-task-warning-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          Vence Hoje
        </Badge>
      );
    }

    return (
      <Badge className="bg-muted text-muted-foreground">
        Pendente
      </Badge>
    );
  };

  const getRowClassName = (vencimento: string, concluida: boolean) => {
    if (concluida) return "opacity-60";
    
    if (!vencimento) return "";
    
    const vencimentoSeguro = vencimento.toString();
    const today = toLocalISODate(new Date());
    const isOverdue = vencimentoSeguro < today;
    const isDueToday = vencimentoSeguro === today;

    if (isOverdue) return "bg-task-overdue-muted/20 border-l-4 border-task-overdue";
    if (isDueToday) return "bg-task-warning-muted/20 border-l-4 border-task-warning";
    
    return "";
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateTask.mutateAsync({ id, concluida: completed });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
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

  // Safe check for tasks array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhuma tarefa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  safeTasks.map((task) => {
                    if (!task || !task.id) return null;
                    
                    return (
                      <TableRow key={task.id} className={getRowClassName(task.vencimento || "", task.concluida)}>
                        <TableCell className="font-medium">
                          {formatDateDisplay(task.vencimento)}
                        </TableCell>
                        <TableCell className={task.concluida ? "line-through text-gray-500" : ""}>
                          {task.descricao || "Sem descrição"}
                        </TableCell>
                        <TableCell>
                          {getClientName(task.cliente_id)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.vencimento || "", task.concluida)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleComplete(task.id, !task.concluida)}
                              className={task.concluida ? "text-blue-600 hover:text-blue-800" : "text-green-600 hover:text-green-800"}
                            >
                              {task.concluida ? "Reabrir" : "Concluir"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                                  try {
                                    await deleteTask.mutateAsync(task.id);
                                  } catch (error) {
                                    console.error('Erro ao excluir tarefa:', error);
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TaskFormModal
        open={showEditModal}
        onOpenChange={handleCloseEditModal}
        task={editingTask}
      />
    </>
  );
};
