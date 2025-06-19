
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useCRMProspects } from "@/hooks/useCRMProspects";

interface Task {
  id: string;
  cliente_id: string | null;
  descricao: string;
  vencimento: string;
  concluida: boolean;
  created_at: string;
}

interface TasksCalendarProps {
  tasks: Task[];
}

export const TasksCalendar = ({ tasks }: TasksCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: prospects = [] } = useCRMProspects({
    search: "",
    tags: [],
    responsavel: "",
    stage: "",
    startDate: undefined,
    endDate: undefined,
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Não vinculado";
    const client = prospects.find(p => p.id === clientId);
    return client?.nome ?? "Cliente não encontrado";
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.vencimento === dateString);
  };

  const getTasksForWeek = () => {
    if (!selectedDate) return [];
    
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekTasks = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const tasksForDay = getTasksForDate(currentDate);
      weekTasks.push({
        date: new Date(currentDate),
        tasks: tasksForDay
      });
    }
    return weekTasks;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekTasks = getTasksForWeek();

  const isOverdue = (vencimento: string) => {
    const vencimentoSeguro = vencimento ?? "";
    const today = new Date().toISOString().split('T')[0];
    return vencimentoSeguro < today;
  };

  const isDueToday = (vencimento: string) => {
    const vencimentoSeguro = vencimento ?? "";
    const today = new Date().toISOString().split('T')[0];
    return vencimentoSeguro === today;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão de Calendário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-shrink-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4">
              Semana de {selectedDate?.toLocaleDateString('pt-BR') ?? "-"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {weekTasks.map((dayData, index) => (
                <div key={index} className="border rounded-lg p-3 min-h-[120px]">
                  <div className="font-medium text-sm mb-2 text-center">
                    {weekDays[index]}
                    <br />
                    <span className="text-xs text-gray-500">
                      {dayData.date.getDate()}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {dayData.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2 rounded text-xs border-l-2 ${
                          task.concluida 
                            ? 'bg-green-50 border-green-500 opacity-60' 
                            : isOverdue(task.vencimento)
                            ? 'bg-red-50 border-red-500'
                            : isDueToday(task.vencimento)
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${task.concluida ? 'line-through' : ''}`}>
                              {task.descricao ?? "Sem descrição"}
                            </div>
                            <div className="text-gray-600 truncate">
                              {getClientName(task.cliente_id)}
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {task.concluida ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : isOverdue(task.vencimento ?? "") ? (
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {dayData.tasks.length === 0 && (
                      <div className="text-xs text-gray-400 text-center py-2">
                        Sem tarefas
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
