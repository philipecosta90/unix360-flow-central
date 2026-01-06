import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ServicoReportData {
  servico_id: string | null;
  servico_nome: string;
  total_receita: number;
  quantidade_vendas: number;
  ticket_medio: number;
}

export interface ServicoReportFilters {
  startDate?: string | null;
  endDate?: string | null;
}

export const useServicosReport = (filters?: ServicoReportFilters) => {
  const { userProfile } = useAuth();

  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ['servicos-report', userProfile?.empresa_id, filters],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];

      let query = supabase
        .from('financeiro_lancamentos')
        .select(`
          servico_id,
          valor,
          servicos (
            id,
            nome
          )
        `)
        .eq('empresa_id', userProfile.empresa_id)
        .eq('tipo', 'entrada')
        .eq('a_receber', false);

      if (filters?.startDate) {
        query = query.gte('data', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('data', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar por serviço
      const grouped = (data || []).reduce((acc, item) => {
        const servicoId = item.servico_id || 'sem_servico';
        const servicoNome = item.servicos?.nome || 'Sem serviço vinculado';
        
        if (!acc[servicoId]) {
          acc[servicoId] = {
            servico_id: item.servico_id,
            servico_nome: servicoNome,
            total_receita: 0,
            quantidade_vendas: 0,
            ticket_medio: 0,
          };
        }
        
        acc[servicoId].total_receita += Number(item.valor);
        acc[servicoId].quantidade_vendas += 1;
        
        return acc;
      }, {} as Record<string, ServicoReportData>);

      // Calcular ticket médio e ordenar por receita
      const result = Object.values(grouped).map(item => ({
        ...item,
        ticket_medio: item.quantidade_vendas > 0 
          ? item.total_receita / item.quantidade_vendas 
          : 0,
      }));

      return result.sort((a, b) => b.total_receita - a.total_receita);
    },
    enabled: !!userProfile?.empresa_id,
  });

  // Calcular totais
  const totals = reportData.reduce(
    (acc, item) => ({
      total_receita: acc.total_receita + item.total_receita,
      quantidade_vendas: acc.quantidade_vendas + item.quantidade_vendas,
    }),
    { total_receita: 0, quantidade_vendas: 0 }
  );

  return {
    reportData,
    isLoading,
    totals: {
      ...totals,
      ticket_medio: totals.quantidade_vendas > 0 
        ? totals.total_receita / totals.quantidade_vendas 
        : 0,
    },
  };
};
