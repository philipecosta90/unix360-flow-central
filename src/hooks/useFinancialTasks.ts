
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toLocalISODate } from "@/utils/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { canMakeChanges } from "@/utils/securityUtils";

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
  const { userProfile } = useAuth();

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
      // Verificar se o usuário tem assinatura ativa
      if (!canMakeChanges(userProfile)) {
        toast.error('Assinatura necessária', {
          description: 'Você precisa de uma assinatura ativa para criar tarefas.'
        });
        throw new Error('Assinatura necessária para criar tarefas');
      }

      console.log('Criando nova tarefa:', taskData);

      // Buscar dados do usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Usuário não autenticado');
      }

      // Buscar perfil do usuário para obter empresa_id
      const { data: profile, error: profileError } = await supabase
        .from('perfis')
        .select('id, empresa_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.empresa_id) {
        console.error('Erro ao buscar perfil do usuário:', profileError);
        throw new Error('Perfil de usuário não encontrado ou empresa não associada');
      }

      console.log('Perfil do usuário:', profile);

      const insertData = {
        descricao: taskData.descricao,
        vencimento: taskData.vencimento,
        cliente_id: taskData.cliente_id,
        concluida: taskData.concluida ?? false,
        empresa_id: profile.empresa_id,
        created_by: profile.id
      };

      console.log('Dados para insert:', insertData);

      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .insert(insertData)
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['proximas-tarefas'] });
    },
    onError: (error) => {
      console.error('Erro na criação da tarefa:', error);
      toast.error('Erro ao criar tarefa');
    },
  });

  // Atualizar tarefa
  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskData) => {
      // Verificar se o usuário tem assinatura ativa
      if (!canMakeChanges(userProfile)) {
        toast.error('Assinatura necessária', {
          description: 'Você precisa de uma assinatura ativa para atualizar tarefas.'
        });
        throw new Error('Assinatura necessária para atualizar tarefas');
      }

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
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['proximas-tarefas'] });
    },
    onError: (error) => {
      console.error('Erro na atualização da tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    },
  });

  // Excluir tarefa
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se o usuário tem assinatura ativa
      if (!canMakeChanges(userProfile)) {
        toast.error('Assinatura necessária', {
          description: 'Você precisa de uma assinatura ativa para excluir tarefas.'
        });
        throw new Error('Assinatura necessária para excluir tarefas');
      }

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
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['proximas-tarefas'] });
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
      const today = toLocalISODate(new Date());
      return task.vencimento < today;
    }).length,
    dueToday: tasks.filter(task => {
      if (task.concluida) return false;
      const today = toLocalISODate(new Date());
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
