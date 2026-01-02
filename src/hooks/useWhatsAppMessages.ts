import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WhatsAppMessage {
  id: string;
  empresa_id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  variaveis_disponiveis: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
  icone?: string;
  descricao?: string;
  is_system?: boolean;
}

interface MessageTypeConfig {
  tipo: string;
  titulo: string;
  descricao: string;
  icone: string;
  conteudoPadrao: string;
  variaveis: string[];
}

// System message types (cannot be deleted)
const SYSTEM_MESSAGE_TYPES = ['boas_vindas', 'anamnese', 'checkin'];

export const MESSAGE_TYPES: MessageTypeConfig[] = [
  {
    tipo: 'boas_vindas',
    titulo: 'Mensagem de Boas-vindas',
    descricao: 'Enviada automaticamente ao cadastrar um novo cliente',
    icone: '👋',
    variaveis: ['clienteNome', 'nomeEmpresa'],
    conteudoPadrao: `Olá {clienteNome}! 👋

Bem-vindo(a) à *{nomeEmpresa}*! 🎉

Estamos muito felizes em tê-lo(a) como nosso cliente.

Se precisar de algo, é só responder esta mensagem.

Atenciosamente,
Equipe {nomeEmpresa}`,
  },
  {
    tipo: 'anamnese',
    titulo: 'Envio de Anamnese',
    descricao: 'Enviada com o link do questionário de anamnese',
    icone: '📋',
    variaveis: ['clienteNome', 'link', 'nomeEmpresa'],
    conteudoPadrao: `Olá {clienteNome}! 👋

📋 *Questionário de Anamnese*

Parabéns pela decisão! Este é o primeiro passo no caminho em direção aos seus objetivos.

Para começarmos, preencha o questionário clicando no link abaixo:

🔗 {link}

⏰ O link é válido por 7 dias.

Dúvidas? Responda esta mensagem!

Equipe *{nomeEmpresa}*`,
  },
  {
    tipo: 'checkin',
    titulo: 'Envio de Check-in',
    descricao: 'Enviada com o link do check-in de acompanhamento',
    icone: '📊',
    variaveis: ['clienteNome', 'nomeTemplate', 'link', 'nomeEmpresa'],
    conteudoPadrao: `Olá {clienteNome}! 👋

📊 *{nomeTemplate}*

Como está seu progresso? Responda este check-in rápido para que possamos acompanhar sua evolução.

🔗 {link}

⏰ O link é válido por 3 dias.

Dúvidas? Responda esta mensagem!

Equipe *{nomeEmpresa}*`,
  },
];

export const useWhatsAppMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .order('is_system', { ascending: false })
        .order('titulo');

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const initializeMessages = useCallback(async () => {
    if (!user) return;

    try {
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (perfilError || !perfil) {
        console.error('Erro ao buscar perfil:', perfilError);
        return;
      }

      const { data: existingMessages } = await supabase
        .from('whatsapp_mensagens')
        .select('id')
        .eq('empresa_id', perfil.empresa_id)
        .limit(1);

      if (existingMessages && existingMessages.length > 0) {
        return;
      }

      const { error } = await supabase.rpc('create_default_whatsapp_messages_for_company', {
        p_empresa_id: perfil.empresa_id,
      });

      if (error) {
        console.error('Erro ao inicializar mensagens:', error);
      } else {
        await fetchMessages();
      }
    } catch (error) {
      console.error('Erro ao inicializar mensagens:', error);
    }
  }, [user, fetchMessages]);

  const updateMessage = async (id: string, conteudo: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('whatsapp_mensagens')
        .update({ conteudo })
        .eq('id', id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, conteudo } : m))
      );

      toast.success('Mensagem atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
      toast.error('Erro ao atualizar mensagem');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateCustomMessage = async (
    id: string,
    data: { titulo?: string; conteudo?: string; descricao?: string; icone?: string }
  ) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('whatsapp_mensagens')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data } : m))
      );

      toast.success('Mensagem atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
      toast.error('Erro ao atualizar mensagem');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createMessage = async (data: {
    titulo: string;
    tipo: string;
    conteudo: string;
    variaveis_disponiveis: string[];
    icone?: string;
    descricao?: string;
  }) => {
    try {
      setSaving(true);

      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('user_id', user?.id)
        .single();

      if (perfilError || !perfil) throw new Error('Perfil não encontrado');

      const { data: newMessage, error } = await supabase
        .from('whatsapp_mensagens')
        .insert({
          empresa_id: perfil.empresa_id,
          titulo: data.titulo,
          tipo: data.tipo,
          conteudo: data.conteudo,
          variaveis_disponiveis: data.variaveis_disponiveis,
          icone: data.icone || '📩',
          descricao: data.descricao || null,
          ativo: true,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, newMessage]);
      toast.success('Mensagem criada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao criar mensagem:', error);
      toast.error('Erro ao criar mensagem');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      setSaving(true);

      const message = messages.find((m) => m.id === id);
      if (message && isSystemMessage(message.tipo)) {
        toast.error('Mensagens do sistema não podem ser excluídas');
        return false;
      }

      const { error } = await supabase
        .from('whatsapp_mensagens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success('Mensagem excluída com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      toast.error('Erro ao excluir mensagem');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, ativo: boolean) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('whatsapp_mensagens')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ativo } : m))
      );

      toast.success(ativo ? 'Mensagem ativada!' : 'Mensagem desativada!');
      return true;
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da mensagem');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async (id: string, tipo: string) => {
    const messageConfig = MESSAGE_TYPES.find((m) => m.tipo === tipo);
    if (!messageConfig) return false;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('whatsapp_mensagens')
        .update({ conteudo: messageConfig.conteudoPadrao })
        .eq('id', id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, conteudo: messageConfig.conteudoPadrao } : m
        )
      );

      toast.success('Mensagem restaurada para o padrão!');
      return true;
    } catch (error) {
      console.error('Erro ao restaurar mensagem:', error);
      toast.error('Erro ao restaurar mensagem');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getMessage = (tipo: string): WhatsAppMessage | undefined => {
    return messages.find((m) => m.tipo === tipo);
  };

  const getMessageConfig = (tipo: string): MessageTypeConfig | undefined => {
    return MESSAGE_TYPES.find((m) => m.tipo === tipo);
  };

  const isSystemMessage = (tipo: string): boolean => {
    return SYSTEM_MESSAGE_TYPES.includes(tipo);
  };

  const getSystemMessages = (): WhatsAppMessage[] => {
    return messages.filter((m) => isSystemMessage(m.tipo));
  };

  const getCustomMessages = (): WhatsAppMessage[] => {
    return messages.filter((m) => !isSystemMessage(m.tipo));
  };

  useEffect(() => {
    if (user) {
      initializeMessages().then(() => fetchMessages());
    }
  }, [user, initializeMessages, fetchMessages]);

  return {
    messages,
    loading,
    saving,
    fetchMessages,
    updateMessage,
    updateCustomMessage,
    createMessage,
    deleteMessage,
    toggleActive,
    resetToDefault,
    getMessage,
    getMessageConfig,
    isSystemMessage,
    getSystemMessages,
    getCustomMessages,
    initializeMessages,
    MESSAGE_TYPES,
  };
};
