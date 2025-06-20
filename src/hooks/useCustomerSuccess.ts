
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

        // Calcular métricas
        const totalOnboardings = onboardings?.length || 0;
        const onboardingsConcluidos = onboardings?.filter(o => o.concluido).length || 0;
        const percentualOnboarding = totalOnboardings > 0 ? (onboardingsConcluidos / totalOnboardings) * 100 : 0;

        const npsMedian = npsData?.length ? 
          npsData.reduce((acc, curr) => acc + curr.nota, 0) / npsData.length : 0;

        // Identificar clientes em risco com base na última interação real
        const agora = new Date();
        const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Criar mapa da última interação de cada cliente
        const ultimaInteracaoMap = new Map<string, Date>();
        todasInteracoes?.forEach(interacao => {
          if (!ultimaInteracaoMap.has(interacao.cliente_id)) {
            ultimaInteracaoMap.set(interacao.cliente_id, new Date(interacao.data_interacao));
          }
        });

        // Identificar clientes em risco
        const clientesEmRisco = clientes?.filter(cliente => {
          const ultimaInteracao = ultimaInteracaoMap.get(cliente.id);
          
          // Se não há interação registrada ou a última foi há mais de 30 dias
          if (!ultimaInteracao) {
            return true; // Cliente sem nenhuma interação está em risco
          }
          
          return ultimaInteracao < trintaDiasAtras;
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

        return {
          totalClientes: clientes?.length || 0,
          percentualOnboarding,
          npsMedian,
          clientesEmRisco: clientesEmRisco.length,
          interacoesRecentes: interacoes || [],
          onboardings: onboardings || [],
          clientes: clientes || [],
          clientesRiscoDetalhes
        };
      },
      enabled: !!userProfile?.empresa_id
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
