import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AlimentoBase, TabelaOrigem } from '@/types/dieta';

interface UseAlimentosBaseOptions {
  limit?: number;
}

interface AlimentoBaseFilters {
  tabela_origem?: TabelaOrigem | 'todos';
  grupo?: string;
}

export const useAlimentosBase = (options: UseAlimentosBaseOptions = {}) => {
  const { userProfile } = useAuthContext();
  const [alimentos, setAlimentos] = useState<AlimentoBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AlimentoBaseFilters>({});

  const empresaId = userProfile?.empresa_id;
  const limit = options.limit || 50;

  const searchAlimentos = useCallback(async (term: string, currentFilters?: AlimentoBaseFilters) => {
    if (term.length < 2) {
      setAlimentos([]);
      return [];
    }

    setLoading(true);
    try {
      let query = supabase
        .from('alimentos_base')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })
        .limit(limit);

      // Filtro por tabela de origem
      const tabelaFiltro = currentFilters?.tabela_origem || filters.tabela_origem;
      if (tabelaFiltro && tabelaFiltro !== 'todos') {
        query = query.eq('tabela_origem', tabelaFiltro);
      }

      // Filtro por grupo
      const grupoFiltro = currentFilters?.grupo || filters.grupo;
      if (grupoFiltro) {
        query = query.eq('grupo', grupoFiltro);
      }

      // Busca por nome usando ilike (case insensitive)
      query = query.ilike('nome', `%${term}%`);

      const { data, error } = await query;

      if (error) throw error;

      const result = (data || []) as AlimentoBase[];
      setAlimentos(result);
      return result;
    } catch (error: any) {
      console.error('Erro ao buscar alimentos:', error);
      toast.error('Erro ao buscar alimentos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters, limit]);

  const getGruposDisponiveis = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('alimentos_base')
        .select('grupo')
        .eq('ativo', true)
        .not('grupo', 'is', null);

      if (error) throw error;

      const grupos = [...new Set((data || []).map(item => item.grupo).filter(Boolean))] as string[];
      return grupos.sort();
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      return [];
    }
  }, []);

  const createAlimentoCustom = async (data: Omit<AlimentoBase, 'id' | 'created_at' | 'updated_at' | 'ativo'>): Promise<AlimentoBase | null> => {
    if (!empresaId) {
      toast.error('Empresa não identificada');
      return null;
    }

    try {
      const { data: newAlimento, error } = await supabase
        .from('alimentos_base')
        .insert({
          ...data,
          empresa_id: empresaId,
          tabela_origem: 'custom',
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Alimento customizado criado!');
      return newAlimento as AlimentoBase;
    } catch (error: any) {
      console.error('Erro ao criar alimento:', error);
      toast.error('Erro ao criar alimento customizado');
      return null;
    }
  };

  const calculateNutrientsByPortion = (alimento: AlimentoBase, portionGrams: number) => {
    const factor = portionGrams / 100;
    return {
      calorias: Math.round((alimento.calorias_100g || 0) * factor),
      proteinas_g: Math.round((alimento.proteinas_100g || 0) * factor * 10) / 10,
      carboidratos_g: Math.round((alimento.carboidratos_100g || 0) * factor * 10) / 10,
      gorduras_g: Math.round((alimento.gorduras_100g || 0) * factor * 10) / 10,
      fibras_g: Math.round((alimento.fibras_100g || 0) * factor * 10) / 10,
    };
  };

  return {
    alimentos,
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    searchAlimentos,
    getGruposDisponiveis,
    createAlimentoCustom,
    calculateNutrientsByPortion
  };
};
