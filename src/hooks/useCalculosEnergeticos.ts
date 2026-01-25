import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ProtocoloTMB } from '@/utils/tmbCalculations';

export interface CalculoEnergetico {
  id: string;
  empresa_id: string;
  cliente_id: string;
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: 'masculino' | 'feminino';
  massa_livre_gordura_kg?: number;
  protocolo_tmb: ProtocoloTMB;
  fator_atividade: number;
  fator_injuria: number;
  tmb_kcal: number;
  get_kcal: number;
  observacoes?: string;
  created_at: string;
  created_by?: string;
}

export interface CalculoEnergeticoInput {
  cliente_id: string;
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: 'masculino' | 'feminino';
  massa_livre_gordura_kg?: number;
  protocolo_tmb: ProtocoloTMB;
  fator_atividade: number;
  fator_injuria: number;
  tmb_kcal: number;
  get_kcal: number;
  observacoes?: string;
}

export const useCalculosEnergeticos = (clienteId?: string) => {
  const { userProfile } = useAuthContext();
  const [calculos, setCalculos] = useState<CalculoEnergetico[]>([]);
  const [loading, setLoading] = useState(false);

  const empresaId = userProfile?.empresa_id;

  const fetchCalculos = useCallback(async () => {
    if (!empresaId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('cliente_calculos_energeticos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCalculos((data || []) as CalculoEnergetico[]);
    } catch (error: any) {
      console.error('Erro ao buscar cálculos:', error);
      toast.error('Erro ao carregar histórico de cálculos');
    } finally {
      setLoading(false);
    }
  }, [empresaId, clienteId]);

  const saveCalculo = async (input: CalculoEnergeticoInput): Promise<CalculoEnergetico | null> => {
    if (!empresaId) return null;

    try {
      const { data, error } = await supabase
        .from('cliente_calculos_energeticos')
        .insert({
          empresa_id: empresaId,
          ...input,
          created_by: userProfile?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Cálculo salvo no histórico!');
      await fetchCalculos();
      return data as CalculoEnergetico;
    } catch (error: any) {
      console.error('Erro ao salvar cálculo:', error);
      toast.error('Erro ao salvar cálculo');
      return null;
    }
  };

  const deleteCalculo = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cliente_calculos_energeticos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Cálculo excluído!');
      await fetchCalculos();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir cálculo:', error);
      toast.error('Erro ao excluir cálculo');
      return false;
    }
  };

  const getUltimoCalculo = useCallback(async (clienteIdParam: string): Promise<CalculoEnergetico | null> => {
    if (!empresaId) return null;

    try {
      const { data, error } = await supabase
        .from('cliente_calculos_energeticos')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('cliente_id', clienteIdParam)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CalculoEnergetico | null;
    } catch (error: any) {
      console.error('Erro ao buscar último cálculo:', error);
      return null;
    }
  }, [empresaId]);

  useEffect(() => {
    if (empresaId) {
      fetchCalculos();
    }
  }, [empresaId, fetchCalculos]);

  return {
    calculos,
    loading,
    fetchCalculos,
    saveCalculo,
    deleteCalculo,
    getUltimoCalculo
  };
};
