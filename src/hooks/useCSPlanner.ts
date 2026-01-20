import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PlannerCliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  tipo_contrato: string | null;
  ciclo_atual: number | null;
  semana_atual: number | null;
  ultimo_contato: string | null;
  planner_obs: string | null;
  data_inicio_plano: string | null;
  data_fim_plano: string | null;
  plano_contratado: string | null;
  created_at: string;
}

export interface PlannerSemana {
  id: string;
  empresa_id: string;
  cliente_id: string;
  semana_numero: number;
  micro_meta: string | null;
  checkin_realizado: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// Calcula o ciclo e semana atual baseado na data de início
export const calcularCicloSemana = (dataInicio: string | null, tipoContrato: string | null) => {
  if (!dataInicio) return { cicloAtual: 1, semanaAtual: 1 };
  
  const hoje = new Date();
  const inicio = new Date(dataInicio);
  const diasDecorridos = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diasDecorridos < 0) return { cicloAtual: 1, semanaAtual: 1 };
  
  // Duração do ciclo por tipo de contrato (em dias)
  const duracaoCiclo: Record<string, number> = {
    'mensal': 30,
    'trimestral': 90,
    'semestral': 180,
    'anual': 365,
    'parceria': 365,
    'voucher': 30
  };
  
  const diasCiclo = duracaoCiclo[(tipoContrato || 'mensal').toLowerCase()] || 30;
  const cicloAtual = Math.floor(diasDecorridos / diasCiclo) + 1;
  const diasNoCiclo = diasDecorridos % diasCiclo;
  const semanaAtual = Math.floor(diasNoCiclo / 7) + 1;
  
  return { cicloAtual, semanaAtual };
};

export const useCSPlanner = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar clientes ativos com dados do planner
  const useClientesPlanner = () => {
    return useQuery({
      queryKey: ['cs-planner-clientes', userProfile?.empresa_id],
      queryFn: async () => {
        if (!userProfile?.empresa_id) return [];

        const { data, error } = await supabase
          .from('clientes')
          .select('id, nome, email, telefone, status, tipo_contrato, ciclo_atual, semana_atual, ultimo_contato, planner_obs, data_inicio_plano, data_fim_plano, plano_contratado, created_at')
          .eq('empresa_id', userProfile.empresa_id)
          .eq('status', 'ativo')
          .order('nome', { ascending: true });

        if (error) {
          console.error('Error fetching planner clients:', error);
          throw error;
        }

        return (data || []) as PlannerCliente[];
      },
      enabled: !!userProfile?.empresa_id,
    });
  };

  // Buscar todas as semanas de todos os clientes
  const useSemanas = () => {
    return useQuery({
      queryKey: ['cs-planner-semanas', userProfile?.empresa_id],
      queryFn: async () => {
        if (!userProfile?.empresa_id) return [];

        const { data, error } = await supabase
          .from('cs_planner_semanas')
          .select('*')
          .eq('empresa_id', userProfile.empresa_id)
          .order('semana_numero', { ascending: true });

        if (error) {
          console.error('Error fetching planner semanas:', error);
          throw error;
        }

        return (data || []) as PlannerSemana[];
      },
      enabled: !!userProfile?.empresa_id,
    });
  };

  // Atualizar dados do cliente (tipo_contrato, ciclo, obs, etc)
  const updateClientePlanner = useMutation({
    mutationFn: async ({ clienteId, updates }: { 
      clienteId: string; 
      updates: {
        tipo_contrato?: string | null;
        ciclo_atual?: number | null;
        semana_atual?: number | null;
        ultimo_contato?: string | null;
        planner_obs?: string | null;
      }
    }) => {
      const { error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', clienteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-planner-clientes'] });
    },
    onError: (error) => {
      console.error('Error updating cliente planner:', error);
      toast.error('Erro ao atualizar cliente');
    },
  });

  // Criar ou atualizar semana
  const upsertSemana = useMutation({
    mutationFn: async ({ 
      clienteId, 
      semanaNumero, 
      updates 
    }: { 
      clienteId: string; 
      semanaNumero: number; 
      updates: Partial<PlannerSemana>;
    }) => {
      if (!userProfile?.empresa_id) throw new Error('Empresa não encontrada');

      const { data: existing } = await supabase
        .from('cs_planner_semanas')
        .select('id')
        .eq('cliente_id', clienteId)
        .eq('semana_numero', semanaNumero)
        .eq('empresa_id', userProfile.empresa_id)
        .single();

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from('cs_planner_semanas')
          .update(updates)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('cs_planner_semanas')
          .insert({
            empresa_id: userProfile.empresa_id,
            cliente_id: clienteId,
            semana_numero: semanaNumero,
            ...updates,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cs-planner-semanas'] });
    },
    onError: (error) => {
      console.error('Error upserting semana:', error);
      toast.error('Erro ao salvar dados da semana');
    },
  });

  return {
    useClientesPlanner,
    useSemanas,
    updateClientePlanner,
    upsertSemana,
  };
};
