
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Task {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  descricao: string;
  vencimento: string;
  concluida: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface CreateTaskData {
  descricao: string;
  vencimento: string;
  cliente_id?: string | null;
  concluida?: boolean;
}

interface UpdateTaskData {
  id: string;
  descricao?: string;
  vencimento?: string;
  cliente_id?: string | null;
  concluida?: boolean;
}

export const useFinancialTasks = () => {
  const queryClient = useQueryClient();

  // Buscar tarefas
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['financial-tasks'],
    queryFn: async () => {
      console.log('Buscando tarefas financeiras...');
      
      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .select('*')
        .order('vencimento', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
        throw error;
      }

      console.log('Tarefas carregadas:', data);
      return data as Task[];
    },
  });

  // Criar tarefa
  const createTask = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      console.log('Criando nova tarefa:', taskData);

      // Buscar empresa_id do usuário atual
      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada para o usuário');
      }

      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .insert({
          ...taskData,
          empresa_id: profile.empresa_id,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        throw error;
      }

      console.log('Tarefa criada:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-tasks'] });
    },
    onError: (error) => {
      console.error('Erro na criação da tarefa:', error);
      toast.error('Erro ao criar tarefa');
    },
  });

  // Atualizar tarefa
  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskData) => {
      console.log('Atualizando tarefa:', id, updates);
      
      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        throw error;
      }

      console.log('Tarefa atualizada:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-tasks'] });
    },
    onError: (error) => {
      console.error('Erro na atualização da tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    },
  });

  // Excluir tarefa
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      console.log('Excluindo tarefa:', id);
      
      const { error } = await supabase
        .from('financeiro_tarefas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        throw error;
      }

      console.log('Tarefa excluída com sucesso');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-tasks'] });
      toast.success('Tarefa excluída com sucesso');
    },
    onError: (error) => {
      console.error('Erro na exclusão da tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    },
  });

  // Calcular estatísticas
  const stats = {
    total: tasks.length,
    overdue: tasks.filter(task => {
      if (task.concluida) return false;
      const today = new Date().toISOString().split('T')[0];
      return task.vencimento < today;
    }).length,
    dueToday: tasks.filter(task => {
      if (task.concluida) return false;
      const today = new Date().toISOString().split('T')[0];
      return task.vencimento === today;
    }).length,
    completed: tasks.filter(task => task.concluida).length,
    pending: tasks.filter(task => !task.concluida).length,
  };

  return {
    tasks,
    isLoading,
    stats,
    createTask,
    updateTask,
    deleteTask,
  };
};
