
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar as CalendarIcon, List } from "lucide-react";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { TasksFilters } from "./TasksFilters";
import { TasksList } from "./TasksList";
import { TasksCalendar } from "./TasksCalendar";
import { TaskFormModal } from "./TaskFormModal";
import { TasksStats } from "../financial/TasksStats";

export const TasksModule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    includeCompleted: false,
    clientId: '',
  });

  const { tasks, isLoading, stats } = useFinancialTasks();

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter(task => {
      // Filtro de data
      if (filters.startDate && task.vencimento < filters.startDate) return false;
      if (filters.endDate && task.vencimento > filters.endDate) return false;
      
      // Filtro de tarefas concluídas
      if (!filters.includeCompleted && task.concluida) return false;
      
      // Filtro de cliente
      if (filters.clientId && task.cliente_id !== filters.clientId) return false;
      
      return true;
    });
  }, [tasks, filters]);

  const overdueCount = useMemo(() => {
    if (!tasks) return 0;
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => !task.concluida && task.vencimento < today).length;
  }, [tasks]);

  if (isLoading) {
    return <div className="p-6">Carregando tarefas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Tarefas & Agenda</h1>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">Gerencie suas tarefas e prazos</p>
        </div>
        
        <Button
          onClick={() => {
            setSelectedTask(null);
            setIsModalOpen(true);
          }}
          className="bg-[#43B26D] hover:bg-[#37A05B]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <TasksStats stats={stats} />

      <TasksFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <TasksList tasks={filteredTasks} />
        </TabsContent>

        <TabsContent value="calendar">
          <TasksCalendar tasks={filteredTasks} />
        </TabsContent>
      </Tabs>

      <TaskFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={selectedTask}
      />
    </div>
  );
};
