
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, List, Settings } from "lucide-react";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { useNicheSettings } from "@/hooks/useNicheSettings";
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
  const { settings: nicheSettings, isLoading: nicheLoading } = useNicheSettings();

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

  // Configurações específicas do nicho
  const nicheConfig = nicheSettings?.config;
  const nicheType = nicheSettings?.niche_type || 'fitness';

  if (isLoading || nicheLoading) {
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
          <p className="text-gray-600">
            Gerencie suas tarefas e prazos
            {nicheConfig?.name && ` - ${nicheConfig.name}`}
          </p>
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

      {/* Card de Configurações do Nicho */}
      {nicheConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Nicho - {nicheConfig.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campos Personalizados */}
            {nicheConfig.customFields && nicheConfig.customFields.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Campos Personalizados Disponíveis:</h4>
                <div className="flex flex-wrap gap-2">
                  {nicheConfig.customFields.map((field) => (
                    <Badge key={field.id} variant="outline">
                      {field.name} ({field.type})
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Métricas */}
            {nicheConfig.metrics && nicheConfig.metrics.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Métricas de Acompanhamento:</h4>
                <div className="flex flex-wrap gap-2">
                  {nicheConfig.metrics.map((metric, index) => (
                    <Badge key={index} variant="secondary">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dicas específicas do nicho */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {nicheType === 'fitness' && "💪 Dica: Acompanhe a frequência de treinos e evolução dos alunos"}
                {nicheType === 'consultoria' && "🎯 Dica: Monitore o progresso das sessões e resultados dos clientes"}
                {nicheType === 'medical' && "🏥 Dica: Organize consultas de retorno e acompanhamento de tratamentos"}
                {nicheType === 'dental' && "🦷 Dica: Controle prazos de tratamentos e retornos preventivos"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
