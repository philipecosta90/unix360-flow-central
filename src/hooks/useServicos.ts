import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  tipo: string;
  duracao_meses: number;
  categoria: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServicoData {
  nome: string;
  descricao?: string;
  valor: number;
  tipo: string;
  duracao_meses: number;
  categoria: string;
}

export interface UpdateServicoData extends Partial<CreateServicoData> {
  id: string;
  ativo?: boolean;
}

export const useServicos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servicos = [], isLoading } = useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .single();

      if (!profile?.empresa_id) return [];

      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Servico[];
    },
  });

  const createServico = useMutation({
    mutationFn: async (data: CreateServicoData) => {
      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada');
      }

      const { data: servico, error } = await supabase
        .from('servicos')
        .insert({
          empresa_id: profile.empresa_id,
          nome: data.nome,
          descricao: data.descricao || null,
          valor: data.valor,
          tipo: data.tipo,
          duracao_meses: data.duracao_meses,
          categoria: data.categoria,
        })
        .select()
        .single();

      if (error) throw error;
      return servico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({
        title: 'Serviço criado',
        description: 'O serviço foi cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateServico = useMutation({
    mutationFn: async (data: UpdateServicoData) => {
      const { id, ...updateData } = data;

      const { data: servico, error } = await supabase
        .from('servicos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return servico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({
        title: 'Serviço atualizado',
        description: 'O serviço foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteServico = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({
        title: 'Serviço excluído',
        description: 'O serviço foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const servicosAtivos = servicos.filter(s => s.ativo);

  return {
    servicos,
    servicosAtivos,
    isLoading,
    createServico,
    updateServico,
    deleteServico,
  };
};
