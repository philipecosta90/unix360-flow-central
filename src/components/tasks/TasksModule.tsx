
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
    if (!tasks || !Array.isArray(tasks)) return [];

    return tasks.filter(task => {
      if (!task) return false;
      
      // Filtro de data
      if (filters.startDate && task.vencimento && task.vencimento < filters.startDate) return false;
      if (filters.endDate && task.vencimento && task.vencimento > filters.endDate) return false;
      
      // Filtro de tarefas concluídas
      if (!filters.includeCompleted && task.concluida) return false;
      
      // Filtro de cliente
      if (filters.clientId && task.cliente_id !== filters.clientId) return false;
      
      return true;
    });
  }, [tasks, filters]);

  const overdueCount = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return 0;
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task && !task.concluida && task.vencimento && task.vencimento < today).length;
  }, [tasks]);

  if (isLoading) {
    return <div className="p-6">Carregando tarefas...</div>;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">Tarefas & Agenda</h1>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie suas tarefas e prazos
          </p>
        </div>
        
        <Button
          onClick={() => {
            setSelectedTask(null);
            setIsModalOpen(true);
          }}
          className="bg-[#43B26D] hover:bg-[#37A05B] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {stats && <TasksStats stats={stats} />}

      <TasksFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      <Tabs defaultValue="list" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="list" className="flex items-center gap-2 flex-1 sm:flex-none">
            <List className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Lista</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2 flex-1 sm:flex-none">
            <CalendarIcon className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Calendário</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 sm:space-y-6">
          <TasksList tasks={filteredTasks} />
          <div className="mt-6">
            <TasksCalendar tasks={filteredTasks} />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
          <TasksCalendar tasks={filteredTasks} />
          <div className="mt-6">
            <TasksList tasks={filteredTasks} />
          </div>
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
