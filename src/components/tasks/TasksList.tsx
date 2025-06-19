import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { useCRMProspects } from "@/hooks/useCRMProspects";

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
  const { updateTask } = useFinancialTasks();
  const { data: prospects = [] } = useCRMProspects({
    search: "",
    tags: [],
    responsavel: "",
    stage: "",
    startDate: undefined,
    endDate: undefined,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Não vinculado";
    const client = prospects.find(p => p.id === clientId);
    return client?.nome || "Cliente não encontrado";
  };

  const getStatusBadge = (vencimento: string, concluida: boolean) => {
    if (concluida) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Concluída
        </Badge>
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = vencimento < today;
    const isDueToday = vencimento === today;

    if (isOverdue) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Vencida
        </Badge>
      );
    }

    if (isDueToday) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Calendar className="h-3 w-3 mr-1" />
          Vence Hoje
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-100 text-blue-800">
        Pendente
      </Badge>
    );
  };

  const getRowClassName = (vencimento: string, concluida: boolean) => {
    if (concluida) return "opacity-60";
    
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = vencimento < today;
    const isDueToday = vencimento === today;

    if (isOverdue) return "bg-red-50 border-l-4 border-red-500";
    if (isDueToday) return "bg-yellow-50 border-l-4 border-yellow-500";
    
    return "";
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateTask.mutateAsync({ id, concluida: completed });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  return (
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
                <TableHead>Ação</TableHead>
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
                  <TableRow key={task.id} className={getRowClassName(task.vencimento, task.concluida)}>
                    <TableCell className="font-medium">
                      {formatDate(task.vencimento)}
                    </TableCell>
                    <TableCell className={task.concluida ? "line-through text-gray-500" : ""}>
                      {task.descricao}
                    </TableCell>
                    <TableCell>
                      {getClientName(task.cliente_id)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.vencimento, task.concluida)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleComplete(task.id, !task.concluida)}
                        className={task.concluida ? "text-blue-600 hover:text-blue-800" : "text-green-600 hover:text-green-800"}
                      >
                        {task.concluida ? "Reabrir" : "Concluir"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
