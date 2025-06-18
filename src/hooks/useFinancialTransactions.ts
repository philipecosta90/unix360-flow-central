
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

export const useFinancialTransactions = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['financial-transactions', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('data', { ascending: false });

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

  // Calculate monthly stats
  const monthlyStats = {
    totalRevenue: transactions
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0),
    totalExpenses: transactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0),
    pendingRevenue: transactions
      .filter(t => t.tipo === 'entrada' && t.a_receber)
      .reduce((sum, t) => sum + Number(t.valor), 0),
  };

  const netProfit = monthlyStats.totalRevenue - monthlyStats.totalExpenses;

  return {
    transactions,
    isLoading,
    monthlyStats: {
      ...monthlyStats,
      netProfit,
    },
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
