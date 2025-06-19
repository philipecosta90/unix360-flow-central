
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FinancialTask {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  descricao: string;
  vencimento: string;
  concluida: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateTaskData {
  cliente_id?: string | null;
  descricao: string;
  vencimento: string;
}

export const useFinancialTasks = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['financial-tasks', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('vencimento', { ascending: true });

      if (error) throw error;
      return data as FinancialTask[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  const createTask = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      if (!userProfile?.empresa_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .insert({
          ...taskData,
          empresa_id: userProfile.empresa_id,
          created_by: userProfile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-tasks'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financeiro_tarefas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-tasks'] });
    },
  });

  // Calcular estatísticas
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(task => !task.concluida && task.vencimento < today);
  const dueTodayTasks = tasks.filter(task => !task.concluida && task.vencimento === today);
  const completedTasks = tasks.filter(task => task.concluida);
  const pendingTasks = tasks.filter(task => !task.concluida);

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    stats: {
      total: tasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      completed: completedTasks.length,
      pending: pendingTasks.length,
    },
    overdueTasks,
    dueTodayTasks,
  };
};
