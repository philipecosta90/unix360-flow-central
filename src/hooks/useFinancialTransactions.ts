import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FinancialTransaction {
  id: string;
  empresa_id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  a_receber: boolean;
  recorrente: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  cliente_id: string | null;
  clientes?: {
    nome: string;
  } | null;
}

interface CreateTransactionData {
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  a_receber?: boolean;
  recorrente?: boolean;
  cliente_id?: string;
}

interface FinancialFilters {
  startDate?: string | null;
  endDate?: string | null;
}

const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  };
};

export const useFinancialTransactions = (filters?: FinancialFilters) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Se não há filtros definidos, usar o mês atual
  const effectiveFilters = {
    startDate: filters?.startDate || getCurrentMonthRange().startDate,
    endDate: filters?.endDate || getCurrentMonthRange().endDate,
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['financial-transactions', userProfile?.empresa_id, effectiveFilters],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      let query = supabase
        .from('financeiro_lancamentos')
        .select('*, clientes(nome)')
        .eq('empresa_id', userProfile.empresa_id);

      if (effectiveFilters.startDate) {
        query = query.gte('data', effectiveFilters.startDate);
      }
      
      if (effectiveFilters.endDate) {
        query = query.lte('data', effectiveFilters.endDate);
      }

      const { data, error } = await query.order('data', { ascending: false });

      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  // Buscar todas as transações para calcular "A Receber" corretamente
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-financial-transactions', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .select('*, clientes(nome)')
        .eq('empresa_id', userProfile.empresa_id);

      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!userProfile?.empresa_id,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0,    // Não manter em cache
  });

  // Buscar tarefas vencidas para alertas
  const { data: overdueTasks = [] } = useQuery({
    queryKey: ['overdue-tasks', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('financeiro_tarefas')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('concluida', false)
        .lte('vencimento', today);

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.empresa_id,
  });

  const createTransaction = useMutation({
    mutationFn: async (transactionData: CreateTransactionData) => {
      if (!userProfile?.empresa_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .insert({
          ...transactionData,
          empresa_id: userProfile.empresa_id,
          created_by: userProfile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financeiro_lancamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      // Atualização otimista: remover do cache imediatamente
      queryClient.setQueryData(
        ['financial-transactions', userProfile?.empresa_id, effectiveFilters],
        (old: FinancialTransaction[] | undefined) => 
          old?.filter(t => t.id !== deletedId) ?? []
      );
      
      queryClient.setQueryData(
        ['all-financial-transactions', userProfile?.empresa_id],
        (old: FinancialTransaction[] | undefined) => 
          old?.filter(t => t.id !== deletedId) ?? []
      );
      
      // Invalidar para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
  });

  // Calculate KPIs baseado no período filtrado
  // Receitas: apenas entradas que NÃO estão marcadas como "a_receber"
  const totalRevenue = transactions
    .filter(t => t.tipo === 'entrada' && !t.a_receber)
    .reduce((sum, t) => sum + Number(t.valor), 0);

  // Despesas: todas as saídas (não precisam estar "a_receber")
  const totalExpenses = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  // A Receber: todas as transações com a_receber = true (independente da data)
  const pendingRevenue = allTransactions
    .filter(t => t.tipo === 'entrada' && t.a_receber)
    .reduce((sum, t) => sum + Number(t.valor), 0);
  
  const today = new Date().toISOString().split('T')[0];

  const balance = totalRevenue - totalExpenses;

  // Transações vencidas (para alertas)
  const overdueTransactions = allTransactions.filter(t => 
    t.a_receber && 
    t.data <= today && 
    !t.recorrente
  );

  // Group by category for charts (usando transações filtradas)
  const categoryData = transactions.reduce((acc, transaction) => {
    const key = `${transaction.categoria}-${transaction.tipo}`;
    if (!acc[key]) {
      acc[key] = {
        categoria: transaction.categoria,
        tipo: transaction.tipo,
        valor: 0,
      };
    }
    acc[key].valor += Number(transaction.valor);
    return acc;
  }, {} as Record<string, { categoria: string; tipo: string; valor: number }>);

  // Agregar faturamento mês a mês (apenas receitas efetivadas)
  const monthlyRevenueData = allTransactions
    .filter(t => t.tipo === 'entrada' && !t.a_receber)
    .reduce((acc, transaction) => {
      const date = new Date(transaction.data);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase().replace('.', '');
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[yearMonth]) {
        acc[yearMonth] = {
          mes: monthKey,
          faturamento: 0,
          sortKey: yearMonth,
        };
      }
      acc[yearMonth].faturamento += Number(transaction.valor);
      return acc;
    }, {} as Record<string, { mes: string; faturamento: number; sortKey: string }>);

  // Ordenar por data (mais antigo primeiro) e remover sortKey
  const sortedMonthlyData = Object.values(monthlyRevenueData)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ mes, faturamento }) => ({ mes, faturamento }));

  return {
    transactions,
    isLoading,
    kpis: {
      totalRevenue,
      totalExpenses,
      balance,
      pendingRevenue,
    },
    categoryData: Object.values(categoryData),
    monthlyRevenueData: sortedMonthlyData,
    overdueTransactions,
    overdueCount: overdueTransactions.length,
    overdueTasks,
    overdueTasksCount: overdueTasks.length,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
