
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";
import { AddTaskDialog } from "./AddTaskDialog";
import { TasksTable } from "./TasksTable";
import { TasksStats } from "./TasksStats";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

export const TasksModule = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { tasks, isLoading, stats } = useFinancialTasks();

  if (isLoading) {
    return <div className="p-6">Carregando tarefas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tarefas Financeiras</h1>
          <p className="text-gray-600">Gerencie suas tarefas e prazos financeiros</p>
        </div>
        <SubscriptionGuard action="criar novas tarefas">
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#43B26D] hover:bg-[#37A05B]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </SubscriptionGuard>
      </div>

      <TasksStats stats={stats} />

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <TasksTable tasks={tasks} />
        </div>
      </div>

      <SubscriptionGuard action="criar novas tarefas">
        <AddTaskDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
      </SubscriptionGuard>
    </div>
  );
};
