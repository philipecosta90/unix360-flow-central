
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
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface CreateTransactionData {
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  a_receber?: boolean;
}

interface FinancialFilters {
  startDate?: string | null;
  endDate?: string | null;
}

export const useFinancialTransactions = (filters?: FinancialFilters) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['financial-transactions', userProfile?.empresa_id, filters],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      let query = supabase
        .from('financeiro_lancamentos')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id);

      if (filters?.startDate) {
        query = query.gte('data', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('data', filters.endDate);
      }

      const { data, error } = await query.order('data', { ascending: false });

      if (error) throw error;
      return data as FinancialTransaction[];
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
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financeiro_lancamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
  });

  // Calculate KPIs
  const totalRevenue = transactions
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const totalExpenses = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const pendingRevenue = transactions
    .filter(t => t.tipo === 'entrada' && t.a_receber)
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const balance = totalRevenue - totalExpenses;

  // Group by category for charts
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
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
