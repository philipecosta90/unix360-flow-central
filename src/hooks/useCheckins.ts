import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DEFAULT_CHECKIN_TEMPLATE, DEFAULT_CHECKIN_PERGUNTAS } from "@/constants/defaultCheckinTemplate";
// Types
export interface CheckinTemplate {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckinPergunta {
  id: string;
  template_id: string;
  secao: string;
  secao_icone: string | null;
  ordem: number;
  pergunta: string;
  tipo: string;
  pontos_maximo: number;
  opcoes_pontuacao: Record<string, number> | null;
  obrigatoria: boolean;
  placeholder: string | null;
  created_at: string;
}

export interface CheckinAgendamento {
  id: string;
  empresa_id: string;
  cliente_id: string;
  template_id: string;
  frequencia: string;
  intervalo_dias: number | null;
  proximo_envio: string;
  hora_envio: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  cliente?: { nome: string };
  template?: { nome: string };
}

export interface CheckinEnvio {
  id: string;
  empresa_id: string;
  cliente_id: string;
  template_id: string;
  agendamento_id: string | null;
  token: string;
  status: string;
  pontuacao_total: number;
  pontuacao_maxima: number;
  enviado_em: string;
  respondido_em: string | null;
  expira_em: string;
  revisado: boolean;
  anotacoes_profissional: string | null;
  created_at: string;
  cliente?: { nome: string };
  template?: { nome: string };
}

export interface CheckinResposta {
  id: string;
  envio_id: string;
  pergunta_id: string;
  resposta: string | null;
  resposta_arquivo: string | null;
  pontuacao: number;
  indicador_visual: string | null;
  created_at: string;
  pergunta?: CheckinPergunta;
}

// Tipos de perguntas disponíveis
export const TIPOS_PERGUNTA_CHECKIN = [
  { value: 'likert_5', label: 'Escala 1-5 (😞 a 😄)', pontuavel: true },
  { value: 'likert_10', label: 'Escala 0-10 (NPS)', pontuavel: true },
  { value: 'select_pontuado', label: 'Opções com pontuação', pontuavel: true },
  { value: 'sim_nao', label: 'Sim ou Não', pontuavel: false },
  { value: 'multipla_escolha', label: 'Múltipla escolha', pontuavel: false },
  { value: 'texto', label: 'Texto livre', pontuavel: false },
  { value: 'numero', label: 'Número', pontuavel: false },
  { value: 'foto', label: 'Upload de foto', pontuavel: false },
  { value: 'arquivo', label: 'Upload de arquivo', pontuavel: false },
];

export const FREQUENCIAS = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'personalizado', label: 'Personalizado' },
];

// Hook principal
export const useCheckinTemplates = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['checkin-templates', userProfile?.empresa_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_templates')
        .select('*')
        .eq('empresa_id', userProfile!.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CheckinTemplate[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: { nome: string; descricao?: string; ativo?: boolean }) => {
      const { data, error } = await supabase
        .from('checkin_templates')
        .insert({
          nome: template.nome,
          descricao: template.descricao || null,
          ativo: template.ativo ?? true,
          empresa_id: userProfile!.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<CheckinTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('checkin_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-templates'] });
      toast.success('Template atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checkin_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-templates'] });
      toast.success('Template excluído!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const createDefaultTemplate = useMutation({
    mutationFn: async () => {
      // 1. Criar o template
      const { data: template, error: templateError } = await supabase
        .from('checkin_templates')
        .insert({
          ...DEFAULT_CHECKIN_TEMPLATE,
          empresa_id: userProfile!.empresa_id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // 2. Inserir as perguntas padrão
      const perguntasComTemplateId = DEFAULT_CHECKIN_PERGUNTAS.map(p => ({
        ...p,
        template_id: template.id,
      }));

      const { error: perguntasError } = await supabase
        .from('checkin_perguntas')
        .insert(perguntasComTemplateId);

      if (perguntasError) throw perguntasError;

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-templates'] });
      toast.success('Template padrão criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar template padrão: ${error.message}`);
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      // 1. Buscar o template original
      const { data: originalTemplate, error: templateError } = await supabase
        .from('checkin_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // 2. Buscar as perguntas do template original
      const { data: originalPerguntas, error: perguntasError } = await supabase
        .from('checkin_perguntas')
        .select('*')
        .eq('template_id', templateId)
        .order('ordem', { ascending: true });

      if (perguntasError) throw perguntasError;

      // 3. Criar o novo template com nome modificado
      const { data: newTemplate, error: newTemplateError } = await supabase
        .from('checkin_templates')
        .insert({
          nome: `${originalTemplate.nome} (Cópia)`,
          descricao: originalTemplate.descricao,
          ativo: originalTemplate.ativo,
          empresa_id: userProfile!.empresa_id,
        })
        .select()
        .single();

      if (newTemplateError) throw newTemplateError;

      // 4. Duplicar as perguntas para o novo template
      if (originalPerguntas && originalPerguntas.length > 0) {
        const novasPerguntas = originalPerguntas.map(p => ({
          template_id: newTemplate.id,
          secao: p.secao,
          secao_icone: p.secao_icone,
          ordem: p.ordem,
          pergunta: p.pergunta,
          tipo: p.tipo,
          pontos_maximo: p.pontos_maximo,
          opcoes_pontuacao: p.opcoes_pontuacao,
          obrigatoria: p.obrigatoria,
          placeholder: p.placeholder,
        }));

        const { error: insertError } = await supabase
          .from('checkin_perguntas')
          .insert(novasPerguntas);

        if (insertError) throw insertError;
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-templates'] });
      toast.success('Template duplicado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao duplicar template: ${error.message}`);
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createDefaultTemplate,
    duplicateTemplate,
  };
};

// Hook para perguntas de um template
export const useCheckinPerguntas = (templateId: string | null) => {
  const queryClient = useQueryClient();

  const { data: perguntas, isLoading } = useQuery({
    queryKey: ['checkin-perguntas', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_perguntas')
        .select('*')
        .eq('template_id', templateId!)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as CheckinPergunta[];
    },
    enabled: !!templateId,
  });

  const createPergunta = useMutation({
    mutationFn: async (pergunta: Omit<CheckinPergunta, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('checkin_perguntas')
        .insert({
          template_id: pergunta.template_id,
          secao: pergunta.secao,
          secao_icone: pergunta.secao_icone,
          ordem: pergunta.ordem,
          pergunta: pergunta.pergunta,
          tipo: pergunta.tipo,
          pontos_maximo: pergunta.pontos_maximo,
          opcoes_pontuacao: pergunta.opcoes_pontuacao,
          obrigatoria: pergunta.obrigatoria,
          placeholder: pergunta.placeholder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-perguntas', templateId] });
      toast.success('Pergunta adicionada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updatePergunta = useMutation({
    mutationFn: async ({ id, ...pergunta }: Partial<CheckinPergunta> & { id: string }) => {
      const { data, error } = await supabase
        .from('checkin_perguntas')
        .update(pergunta)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-perguntas', templateId] });
      toast.success('Pergunta atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deletePergunta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checkin_perguntas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-perguntas', templateId] });
      toast.success('Pergunta excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const reorderPerguntas = useMutation({
    mutationFn: async (updates: { id: string; ordem: number; secao?: string }[]) => {
      // Update each question's order
      const promises = updates.map(({ id, ordem, secao }) =>
        supabase
          .from('checkin_perguntas')
          .update({ ordem, ...(secao && { secao }) })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar perguntas');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-perguntas', templateId] });
      toast.success('Ordem atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateSecao = useMutation({
    mutationFn: async ({ secaoAntiga, secaoNova, icone }: { secaoAntiga: string; secaoNova: string; icone: string | null }) => {
      const { error } = await supabase
        .from('checkin_perguntas')
        .update({ secao: secaoNova, secao_icone: icone })
        .eq('template_id', templateId!)
        .eq('secao', secaoAntiga);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-perguntas', templateId] });
      toast.success('Seção atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteSecao = useMutation({
    mutationFn: async (secao: string) => {
      const { error } = await supabase
        .from('checkin_perguntas')
        .delete()
        .eq('template_id', templateId!)
        .eq('secao', secao);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-perguntas', templateId] });
      toast.success('Seção e perguntas excluídas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return {
    perguntas,
    isLoading,
    createPergunta,
    updatePergunta,
    deletePergunta,
    reorderPerguntas,
    updateSecao,
    deleteSecao,
  };
};

// Hook para agendamentos
export const useCheckinAgendamentos = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['checkin-agendamentos', userProfile?.empresa_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_agendamentos')
        .select(`
          *,
          cliente:clientes(nome),
          template:checkin_templates(nome)
        `)
        .eq('empresa_id', userProfile!.empresa_id)
        .order('proximo_envio', { ascending: true });

      if (error) throw error;
      return data as CheckinAgendamento[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  const createAgendamento = useMutation({
    mutationFn: async (agendamento: { cliente_id: string; template_id: string; frequencia: string; intervalo_dias?: number | null; proximo_envio: string; hora_envio?: string; ativo?: boolean }) => {
      const { data, error } = await supabase
        .from('checkin_agendamentos')
        .insert({
          cliente_id: agendamento.cliente_id,
          template_id: agendamento.template_id,
          frequencia: agendamento.frequencia,
          intervalo_dias: agendamento.intervalo_dias,
          proximo_envio: agendamento.proximo_envio,
          hora_envio: agendamento.hora_envio || '09:00',
          ativo: agendamento.ativo ?? true,
          empresa_id: userProfile!.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-agendamentos'] });
      toast.success('Agendamento criado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateAgendamento = useMutation({
    mutationFn: async ({ id, ...agendamento }: Partial<CheckinAgendamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('checkin_agendamentos')
        .update(agendamento)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-agendamentos'] });
      toast.success('Agendamento atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteAgendamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checkin_agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-agendamentos'] });
      toast.success('Agendamento excluído!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return {
    agendamentos,
    isLoading,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
  };
};

// Hook para envios
export const useCheckinEnvios = (clienteId?: string) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: envios, isLoading } = useQuery({
    queryKey: ['checkin-envios', userProfile?.empresa_id, clienteId],
    queryFn: async () => {
      let query = supabase
        .from('checkin_envios')
        .select(`
          *,
          cliente:clientes(nome),
          template:checkin_templates(nome)
        `)
        .eq('empresa_id', userProfile!.empresa_id)
        .order('enviado_em', { ascending: false });

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CheckinEnvio[];
    },
    enabled: !!userProfile?.empresa_id,
  });

  const createEnvio = useMutation({
    mutationFn: async (envio: { cliente_id: string; template_id: string; agendamento_id?: string; expira_em?: string }) => {
      const token = crypto.randomUUID();
      
      const { data: perguntas } = await supabase
        .from('checkin_perguntas')
        .select('pontos_maximo')
        .eq('template_id', envio.template_id);

      const pontuacaoMaxima = perguntas?.reduce((sum, p) => sum + (p.pontos_maximo || 0), 0) || 0;

      const { data, error } = await supabase
        .from('checkin_envios')
        .insert({
          cliente_id: envio.cliente_id,
          template_id: envio.template_id,
          agendamento_id: envio.agendamento_id || null,
          empresa_id: userProfile!.empresa_id,
          token,
          pontuacao_maxima: pontuacaoMaxima,
          expira_em: envio.expira_em || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-envios'] });
      toast.success('Check-in enviado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteEnvio = useMutation({
    mutationFn: async (envioId: string) => {
      // 1. Deletar respostas associadas
      const { error: respostasError } = await supabase
        .from('checkin_respostas')
        .delete()
        .eq('envio_id', envioId);

      if (respostasError) throw respostasError;

      // 2. Deletar o envio
      const { error } = await supabase
        .from('checkin_envios')
        .delete()
        .eq('id', envioId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-envios'] });
      toast.success('Check-in excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  return {
    envios,
    isLoading,
    createEnvio,
    deleteEnvio,
  };
};

// Helper para calcular indicador visual
export const getIndicadorVisual = (pontuacao: number, maximo: number) => {
  if (maximo === 0) return { cor: 'gray', emoji: '➖', status: 'N/A' };
  
  const percentual = (pontuacao / maximo) * 100;
  if (percentual >= 70) return { cor: 'verde', emoji: '😄', status: 'Ótimo' };
  if (percentual >= 40) return { cor: 'amarelo', emoji: '😐', status: 'Atenção' };
  return { cor: 'vermelho', emoji: '😞', status: 'Crítico' };
};
