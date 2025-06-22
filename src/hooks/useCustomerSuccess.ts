import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useCustomerSuccess = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Hook para buscar dados do dashboard CS
  const useCSData = () => {
    return useQuery({
      queryKey: ['cs-data', userProfile?.empresa_id],
      queryFn: async () => {
        if (!userProfile?.empresa_id) return null;

        console.log('🔍 Buscando dados do Customer Success...');

        // Buscar onboardings por status
        const { data: onboardings } = await supabase
          .from('cs_onboarding')
          .select('*')
          .eq('empresa_id', userProfile.empresa_id);

        // Buscar interações recentes
        const { data: interacoes } = await supabase
          .from('cs_interacoes')
          .select('*, clientes(nome)')
          .eq('empresa_id', userProfile.empresa_id)
          .order('data_interacao', { ascending: false })
          .limit(10);

        // Buscar NPS médio
        const { data: npsData } = await supabase
          .from('cs_nps')
          .select('nota')
          .eq('empresa_id', userProfile.empresa_id);

        // Buscar clientes
        const { data: clientes } = await supabase
          .from('clientes')
          .select('*')
          .eq('empresa_id', userProfile.empresa_id);

        // Buscar TODAS as interações para calcular a última interação de cada cliente
        const { data: todasInteracoes } = await supabase
          .from('cs_interacoes')
          .select('cliente_id, data_interacao')
          .eq('empresa_id', userProfile.empresa_id)
          .order('data_interacao', { ascending: false });

        console.log('📊 Dados coletados:', {
          onboardings: onboardings?.length || 0,
          interacoes: interacoes?.length || 0,
          nps: npsData?.length || 0,
          clientes: clientes?.length || 0,
          todasInteracoes: todasInteracoes?.length || 0
        });

        // Calcular métricas
        const totalOnboardings = onboardings?.length || 0;
        const onboardingsConcluidos = onboardings?.filter(o => o.concluido).length || 0;
        const percentualOnboarding = totalOnboardings > 0 ? (onboardingsConcluidos / totalOnboardings) * 100 : 0;

        const npsMedian = npsData?.length ? 
          npsData.reduce((acc, curr) => acc + curr.nota, 0) / npsData.length : 0;

        // Identificar clientes em risco com base na última interação real
        const agora = new Date();
        const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        console.log('📅 Calculando clientes em risco. Data limite:', trintaDiasAtras.toISOString());
        
        // Criar mapa da última interação de cada cliente
        const ultimaInteracaoMap = new Map<string, Date>();
        todasInteracoes?.forEach(interacao => {
          const dataInteracao = new Date(interacao.data_interacao);
          if (!ultimaInteracaoMap.has(interacao.cliente_id) || 
              dataInteracao > ultimaInteracaoMap.get(interacao.cliente_id)!) {
            ultimaInteracaoMap.set(interacao.cliente_id, dataInteracao);
          }
        });

        console.log('🗺️ Mapa de últimas interações:', Object.fromEntries(ultimaInteracaoMap));

        // Identificar clientes em risco
        const clientesEmRisco = clientes?.filter(cliente => {
          const ultimaInteracao = ultimaInteracaoMap.get(cliente.id);
          
          // Se não há interação registrada, considerar a data de criação do cliente
          if (!ultimaInteracao) {
            const dataCriacao = new Date(cliente.created_at);
            const diasSemInteracao = Math.floor((agora.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`👤 Cliente ${cliente.nome}: sem interação, criado há ${diasSemInteracao} dias`);
            return diasSemInteracao > 30;
          }
          
          const diasSemInteracao = Math.floor((agora.getTime() - ultimaInteracao.getTime()) / (1000 * 60 * 60 * 24));
          const emRisco = diasSemInteracao > 30;
          
          console.log(`👤 Cliente ${cliente.nome}: última interação há ${diasSemInteracao} dias - ${emRisco ? 'EM RISCO' : 'OK'}`);
          
          return emRisco;
        }) || [];

        // Adicionar informações detalhadas dos clientes em risco
        const clientesRiscoDetalhes = clientesEmRisco.map(cliente => {
          const ultimaInteracao = ultimaInteracaoMap.get(cliente.id);
          let diasSemInteracao = 0;
          
          if (ultimaInteracao) {
            diasSemInteracao = Math.floor((agora.getTime() - ultimaInteracao.getTime()) / (1000 * 60 * 60 * 24));
          } else {
            // Se não há interação, calcular desde a criação do cliente
            diasSemInteracao = Math.floor((agora.getTime() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24));
          }

          return {
            ...cliente,
            ultimaInteracao: ultimaInteracao?.toISOString() || null,
            diasSemInteracao
          };
        });

        console.log('⚠️ Clientes em risco identificados:');
        clientesRiscoDetalhes.forEach(cliente => {
          console.log(`  - ${cliente.nome}: ${cliente.diasSemInteracao} dias sem interação`);
        });

        const resultado = {
          totalClientes: clientes?.length || 0,
          percentualOnboarding,
          npsMedian,
          clientesEmRisco: clientesEmRisco.length,
          interacoesRecentes: interacoes || [],
          onboardings: onboardings || [],
          clientes: clientes || [],
          clientesRiscoDetalhes
        };

        console.log('✅ Dashboard CS processado:', {
          totalClientes: resultado.totalClientes,
          clientesEmRisco: resultado.clientesEmRisco,
          percentualOnboarding: resultado.percentualOnboarding.toFixed(1) + '%'
        });

        return resultado;
      },
      enabled: !!userProfile?.empresa_id,
      // Atualizar dados a cada 5 minutos para manter sincronizado
      refetchInterval: 5 * 60 * 1000,
    });
  };

  // Hook para buscar onboarding de um cliente específico
  const useClientOnboarding = (clienteId: string) => {
    return useQuery({
      queryKey: ['onboarding', clienteId, userProfile?.empresa_id],
      queryFn: async () => {
        if (!userProfile?.empresa_id || !clienteId) return [];

        const { data } = await supabase
          .from('cs_onboarding')
          .select('*')
          .eq('empresa_id', userProfile.empresa_id)
          .eq('cliente_id', clienteId)
          .order('ordem', { ascending: true });

        return data || [];
      },
      enabled: !!userProfile?.empresa_id && !!clienteId
    });
  };

  const useClientInteracoes = (clienteId: string) => {
    return useQuery({
      queryKey: ['interacoes', clienteId, userProfile?.empresa_id],
      queryFn: async () => {
        if (!userProfile?.empresa_id || !clienteId) return [];

        const { data } = await supabase
          .from('cs_interacoes')
          .select('*')
          .eq('empresa_id', userProfile.empresa_id)
          .eq('cliente_id', clienteId)
          .order('data_interacao', { ascending: false });

        return data || [];
      },
      enabled: !!userProfile?.empresa_id && !!clienteId
    });
  };

  const useClientNPS = (clienteId: string) => {
    return useQuery({
      queryKey: ['nps', clienteId, userProfile?.empresa_id],
      queryFn: async () => {
        if (!userProfile?.empresa_id || !clienteId) return [];

        const { data } = await supabase
          .from('cs_nps')
          .select('*')
          .eq('empresa_id', userProfile.empresa_id)
          .eq('cliente_id', clienteId)
          .order('data_resposta', { ascending: false });

        return data || [];
      },
      enabled: !!userProfile?.empresa_id && !!clienteId
    });
  };

  const createOnboardingStep = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('cs_onboarding')
        .insert({
          ...data,
          empresa_id: userProfile?.empresa_id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-data'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    }
  });

  const updateOnboardingStep = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('cs_onboarding')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-data'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    }
  });

  const createInteracao = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('cs_interacoes')
        .insert({
          ...data,
          empresa_id: userProfile?.empresa_id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-data'] });
      queryClient.invalidateQueries({ queryKey: ['interacoes'] });
    }
  });

  const createNPS = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('cs_nps')
        .insert({
          ...data,
          empresa_id: userProfile?.empresa_id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-data'] });
      queryClient.invalidateQueries({ queryKey: ['nps'] });
    }
  });

  return {
    useCSData,
    useClientOnboarding,
    useClientInteracoes,
    useClientNPS,
    createOnboardingStep,
    updateOnboardingStep,
    createInteracao,
    createNPS
  };
};
