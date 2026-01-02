import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface MessageSchedule {
  id: string;
  empresa_id: string;
  mensagem_id: string;
  tipo_agendamento: 'unico' | 'aniversario' | 'recorrente' | 'data_fixa';
  data_envio: string | null;
  dia_mes: string | null;
  filtro_clientes: Record<string, any>;
  cliente_id: string | null;
  hora_envio: string;
  ativo: boolean;
  ultimo_envio: string | null;
  proximo_envio: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  mensagem?: {
    id: string;
    titulo: string;
    icone: string | null;
    conteudo: string;
  };
}

export interface CreateScheduleData {
  mensagem_id: string;
  tipo_agendamento: 'unico' | 'aniversario' | 'recorrente' | 'data_fixa';
  data_envio?: string | null;
  dia_mes?: string | null;
  filtro_clientes?: Record<string, any>;
  cliente_id?: string | null;
  hora_envio?: string;
}

export const useMessageSchedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MessageSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensagens_agendamentos')
        .select(`
          *,
          mensagem:whatsapp_mensagens(id, titulo, icone, conteudo)
        `)
        .order('proximo_envio', { ascending: true });

      if (error) throw error;
      setSchedules((data || []) as unknown as MessageSchedule[]);
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const calculateNextSend = (
    tipo: string,
    dataEnvio?: string | null,
    diaMes?: string | null
  ): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (tipo === 'unico' && dataEnvio) {
      return dataEnvio;
    }

    if (tipo === 'aniversario') {
      // Para aniversário, próximo envio é sempre "amanhã" pois roda diariamente
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    if (tipo === 'data_fixa' && diaMes) {
      // Formato DD-MM
      const [dia, mes] = diaMes.split('-').map(Number);
      const thisYear = new Date(today.getFullYear(), mes - 1, dia);
      
      if (thisYear >= today) {
        return thisYear.toISOString().split('T')[0];
      }
      
      // Ano que vem
      return new Date(today.getFullYear() + 1, mes - 1, dia).toISOString().split('T')[0];
    }

    return null;
  };

  const createSchedule = async (data: CreateScheduleData): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const proximoEnvio = calculateNextSend(
        data.tipo_agendamento,
        data.data_envio,
        data.dia_mes
      );

      const { error } = await supabase
        .from('mensagens_agendamentos')
        .insert({
          empresa_id: profile.empresa_id,
          mensagem_id: data.mensagem_id,
          tipo_agendamento: data.tipo_agendamento,
          data_envio: data.data_envio || null,
          dia_mes: data.dia_mes || null,
          filtro_clientes: data.filtro_clientes || {},
          cliente_id: data.cliente_id || null,
          hora_envio: data.hora_envio || '09:00',
          proximo_envio: proximoEnvio,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Agendamento criado com sucesso!');
      await fetchSchedules();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = async (
    id: string,
    data: Partial<CreateScheduleData>
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const updateData: Record<string, any> = { ...data };
      
      // Recalcular próximo envio se tipo ou datas mudaram
      if (data.tipo_agendamento || data.data_envio !== undefined || data.dia_mes !== undefined) {
        const schedule = schedules.find((s) => s.id === id);
        const tipo = data.tipo_agendamento || schedule?.tipo_agendamento;
        const dataEnvio = data.data_envio !== undefined ? data.data_envio : schedule?.data_envio;
        const diaMes = data.dia_mes !== undefined ? data.dia_mes : schedule?.dia_mes;
        
        if (tipo) {
          updateData.proximo_envio = calculateNextSend(tipo, dataEnvio, diaMes);
        }
      }

      const { error } = await supabase
        .from('mensagens_agendamentos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Agendamento atualizado!');
      await fetchSchedules();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mensagens_agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Agendamento excluído!');
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, ativo: boolean): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mensagens_agendamentos')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;

      toast.success(ativo ? 'Agendamento ativado!' : 'Agendamento pausado!');
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ativo } : s))
      );
      return true;
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getActiveSchedules = () => schedules.filter((s) => s.ativo);
  
  const getUpcomingSchedules = (days: number = 7) => {
    const today = new Date();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + days);
    
    return schedules.filter((s) => {
      if (!s.ativo || !s.proximo_envio) return false;
      const next = new Date(s.proximo_envio);
      return next >= today && next <= limit;
    });
  };

  return {
    schedules,
    loading,
    saving,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleActive,
    getActiveSchedules,
    getUpcomingSchedules,
  };
};
