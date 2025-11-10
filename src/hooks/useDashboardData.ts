
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardData {
  clientesAtivos: number;
  receitaMensal: number;
  despesasMensal: number;
  saldoMensal: number;
  aReceber: number;
  aReceberVencidos: number;
  aReceberEmDia: number;
  quantidadeVencidos: number;
  tarefasPendentes: number;
  tarefasConcluidas: number;
  propostasEnviadas: number;
  atividadesRecentes: any[];
}

export const useDashboardData = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['dashboard-data', userProfile?.empresa_id],
    queryFn: async (): Promise<DashboardData> => {
    if (!userProfile?.empresa_id) {
      return {
        clientesAtivos: 0,
        receitaMensal: 0,
        despesasMensal: 0,
        saldoMensal: 0,
        aReceber: 0,
        aReceberVencidos: 0,
        aReceberEmDia: 0,
        quantidadeVencidos: 0,
        tarefasPendentes: 0,
        tarefasConcluidas: 0,
        propostasEnviadas: 0,
        atividadesRecentes: []
      };
    }

      const empresaId = userProfile.empresa_id;
      
      // Datas do mês atual
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
      const hojeStr = hoje.toISOString().split('T')[0];

      // 1. Clientes Ativos
      const { count: clientesAtivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('status', 'ativo');

      // 2. Receita Mensal
      const { data: receitasData } = await supabase
        .from('financeiro_lancamentos')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'entrada')
        .gte('data', primeiroDiaMes)
        .lte('data', ultimoDiaMes);

      const receitaMensal = receitasData?.reduce((acc, r) => acc + Number(r.valor), 0) || 0;

      // 3. Despesas do Mês
      const { data: despesasData } = await supabase
        .from('financeiro_lancamentos')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'saida')
        .gte('data', primeiroDiaMes)
        .lte('data', ultimoDiaMes);

      const despesasMensal = despesasData?.reduce((acc, d) => acc + Number(d.valor), 0) || 0;

      // 4. Saldo do Mês (calculado)
      const saldoMensal = receitaMensal - despesasMensal;

      // 5. A Receber (lançamentos com a_receber = true)
      const { data: aReceberData } = await supabase
        .from('financeiro_lancamentos')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'entrada')
        .eq('a_receber', true);

      const aReceber = aReceberData?.reduce((acc, r) => acc + Number(r.valor), 0) || 0;

      // 5A. A Receber VENCIDOS (data < hoje)
      const { data: aReceberVencidosData } = await supabase
        .from('financeiro_lancamentos')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'entrada')
        .eq('a_receber', true)
        .lt('data', hojeStr);

      const aReceberVencidos = aReceberVencidosData?.reduce((acc, r) => acc + Number(r.valor), 0) || 0;
      const quantidadeVencidos = aReceberVencidosData?.length || 0;

      // 5B. A Receber EM DIA (data >= hoje)
      const { data: aReceberEmDiaData } = await supabase
        .from('financeiro_lancamentos')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'entrada')
        .eq('a_receber', true)
        .gte('data', hojeStr);

      const aReceberEmDia = aReceberEmDiaData?.reduce((acc, r) => acc + Number(r.valor), 0) || 0;

      // 6. Tarefas Pendentes
      const { count: tarefasPendentes } = await supabase
        .from('financeiro_tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('concluida', false);

      // 7. Tarefas Concluídas
      const { count: tarefasConcluidas } = await supabase
        .from('financeiro_tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('concluida', true);

      // 8. Propostas Enviadas
      const { count: propostasEnviadas } = await supabase
        .from('crm_prospects')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('stage', 'proposta enviada');

      // 9. Atividades Recentes
      const atividadesRecentes = await buscarAtividadesRecentes(empresaId);

      return {
        clientesAtivos: clientesAtivos || 0,
        receitaMensal,
        despesasMensal,
        saldoMensal,
        aReceber,
        aReceberVencidos,
        aReceberEmDia,
        quantidadeVencidos,
        tarefasPendentes: tarefasPendentes || 0,
        tarefasConcluidas: tarefasConcluidas || 0,
        propostasEnviadas: propostasEnviadas || 0,
        atividadesRecentes
      };
    },
    enabled: !!userProfile?.empresa_id,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};

async function buscarAtividadesRecentes(empresaId: string) {
  const atividades = [];

  // Últimos clientes criados
  const { data: clientesRecentes } = await supabase
    .from('clientes')
    .select('nome, created_at')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(3);

  clientesRecentes?.forEach(cliente => {
    atividades.push({
      action: "Novo cliente cadastrado",
      client: cliente.nome,
      time: formatarTempo(cliente.created_at),
      tipo: 'cliente'
    });
  });

  // Últimas tarefas concluídas
  const { data: tarefasRecentes } = await supabase
    .from('financeiro_tarefas')
    .select('descricao, updated_at')
    .eq('empresa_id', empresaId)
    .eq('concluida', true)
    .order('updated_at', { ascending: false })
    .limit(3);

  tarefasRecentes?.forEach(tarefa => {
    atividades.push({
      action: "Tarefa concluída",
      client: tarefa.descricao,
      time: formatarTempo(tarefa.updated_at),
      tipo: 'tarefa'
    });
  });

  // Últimos prospects criados
  const { data: prospectsRecentes } = await supabase
    .from('crm_prospects')
    .select('nome, created_at')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(2);

  prospectsRecentes?.forEach(prospect => {
    atividades.push({
      action: "Novo prospect adicionado",
      client: prospect.nome,
      time: formatarTempo(prospect.created_at),
      tipo: 'prospect'
    });
  });

  // Últimos lançamentos financeiros
  const { data: lancamentosRecentes } = await supabase
    .from('financeiro_lancamentos')
    .select('descricao, tipo, valor, created_at')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(2);

  lancamentosRecentes?.forEach(lancamento => {
    atividades.push({
      action: lancamento.tipo === 'entrada' ? "Receita registrada" : "Despesa registrada",
      client: `${lancamento.descricao} - R$ ${Number(lancamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      time: formatarTempo(lancamento.created_at),
      tipo: 'financeiro'
    });
  });

  // Ordena por data mais recente e pega os 10 primeiros
  return atividades
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);
}

function formatarTempo(dataStr: string): string {
  const data = new Date(dataStr);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffHoras < 1) {
    return "Agora há pouco";
  } else if (diffHoras < 24) {
    return `${diffHoras} hora${diffHoras > 1 ? 's' : ''} atrás`;
  } else if (diffDias < 7) {
    return `${diffDias} dia${diffDias > 1 ? 's' : ''} atrás`;
  } else {
    return data.toLocaleDateString('pt-BR');
  }
}
