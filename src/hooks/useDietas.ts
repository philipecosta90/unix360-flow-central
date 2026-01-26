import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  DietaTemplate, 
  DietaCliente, 
  DietaTemplateFormData,
  DietaClienteFormData,
  DietaHistorico,
  DietaTemplateRefeicao,
  DietaClienteRefeicao,
  RefeicaoFormData,
  AlimentoFormData
} from '@/types/dieta';

export const useDietas = () => {
  const { userProfile } = useAuthContext();
  const [templates, setTemplates] = useState<DietaTemplate[]>([]);
  const [dietasClientes, setDietasClientes] = useState<DietaCliente[]>([]);
  const [loading, setLoading] = useState(false);

  const empresaId = userProfile?.empresa_id;

  // ============ TEMPLATES ============

  const fetchTemplates = async () => {
    if (!empresaId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dieta_templates')
        .select(`
          *,
          refeicoes:dieta_template_refeicoes(
            *,
            alimentos:dieta_template_alimentos(*)
          )
        `)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Sort refeicoes and alimentos by ordem
      const sortedData = (data || []).map(template => ({
        ...template,
        refeicoes: (template.refeicoes || [])
          .sort((a: DietaTemplateRefeicao, b: DietaTemplateRefeicao) => a.ordem - b.ordem)
          .map((refeicao: DietaTemplateRefeicao) => ({
            ...refeicao,
            alimentos: (refeicao.alimentos || []).sort((a, b) => a.ordem - b.ordem)
          }))
      }));
      
      setTemplates(sortedData as DietaTemplate[]);
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
      toast.error('Erro ao carregar templates de dieta');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (data: DietaTemplateFormData): Promise<DietaTemplate | null> => {
    if (!empresaId) return null;

    try {
      const { data: newTemplate, error } = await supabase
        .from('dieta_templates')
        .insert({
          empresa_id: empresaId,
          ...data
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Template criado com sucesso!');
      await fetchTemplates();
      return newTemplate as DietaTemplate;
    } catch (error: any) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
      return null;
    }
  };

  const updateTemplate = async (id: string, data: Partial<DietaTemplateFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_templates')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Template atualizado!');
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
      return false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_templates')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Template excluído!');
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
      return false;
    }
  };

  // ============ DIETAS DOS CLIENTES ============

  const fetchDietasClientes = async (clienteId?: string) => {
    if (!empresaId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('dieta_clientes')
        .select(`
          *,
          cliente:clientes(id, nome, foto_url),
          refeicoes:dieta_cliente_refeicoes(
            *,
            alimentos:dieta_cliente_alimentos(*)
          )
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Sort refeicoes and alimentos by ordem
      const sortedData = (data || []).map(dieta => ({
        ...dieta,
        refeicoes: (dieta.refeicoes || [])
          .sort((a: DietaClienteRefeicao, b: DietaClienteRefeicao) => a.ordem - b.ordem)
          .map((refeicao: DietaClienteRefeicao) => ({
            ...refeicao,
            alimentos: (refeicao.alimentos || []).sort((a, b) => a.ordem - b.ordem)
          }))
      }));
      
      setDietasClientes(sortedData as DietaCliente[]);
    } catch (error: any) {
      console.error('Erro ao buscar dietas:', error);
      toast.error('Erro ao carregar dietas');
    } finally {
      setLoading(false);
    }
  };

  const createDietaCliente = async (data: DietaClienteFormData): Promise<DietaCliente | null> => {
    if (!empresaId) return null;

    try {
      const { data: newDieta, error } = await supabase
        .from('dieta_clientes')
        .insert({
          empresa_id: empresaId,
          ...data,
          status: 'ativa'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Dieta criada com sucesso!');
      await fetchDietasClientes();
      return newDieta as DietaCliente;
    } catch (error: any) {
      console.error('Erro ao criar dieta:', error);
      toast.error('Erro ao criar dieta');
      return null;
    }
  };

  const updateDietaCliente = async (id: string, data: Partial<DietaClienteFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_clientes')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Dieta atualizada!');
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar dieta:', error);
      toast.error('Erro ao atualizar dieta');
      return false;
    }
  };

  const deleteDietaCliente = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Dieta excluída!');
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir dieta:', error);
      toast.error('Erro ao excluir dieta');
      return false;
    }
  };

  const duplicateFromTemplate = async (templateId: string, clienteId: string): Promise<DietaCliente | null> => {
    if (!empresaId) return null;

    try {
      // Buscar template completo
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        toast.error('Template não encontrado');
        return null;
      }

      // Criar dieta do cliente
      const { data: newDieta, error: dietaError } = await supabase
        .from('dieta_clientes')
        .insert({
          empresa_id: empresaId,
          cliente_id: clienteId,
          template_id: templateId,
          nome: template.nome,
          descricao: template.descricao,
          objetivo: template.objetivo,
          calorias_total: template.calorias_total,
          proteinas_g: template.proteinas_g,
          carboidratos_g: template.carboidratos_g,
          gorduras_g: template.gorduras_g,
          status: 'ativa'
        })
        .select()
        .single();

      if (dietaError) throw dietaError;

      // Duplicar refeições
      for (const refeicao of template.refeicoes || []) {
        const { data: newRefeicao, error: refeicaoError } = await supabase
          .from('dieta_cliente_refeicoes')
          .insert({
            dieta_id: newDieta.id,
            nome: refeicao.nome,
            horario_sugerido: refeicao.horario_sugerido,
            ordem: refeicao.ordem,
            observacoes: refeicao.observacoes
          })
          .select()
          .single();

        if (refeicaoError) throw refeicaoError;

        // Duplicar alimentos
        for (const alimento of refeicao.alimentos || []) {
          const { error: alimentoError } = await supabase
            .from('dieta_cliente_alimentos')
            .insert({
              refeicao_id: newRefeicao.id,
              nome: alimento.nome,
              quantidade: alimento.quantidade,
              calorias: alimento.calorias,
              proteinas_g: alimento.proteinas_g,
              carboidratos_g: alimento.carboidratos_g,
              gorduras_g: alimento.gorduras_g,
              observacoes: alimento.observacoes,
              ordem: alimento.ordem
            });

          if (alimentoError) throw alimentoError;
        }
      }

      toast.success('Dieta criada a partir do template!');
      await fetchDietasClientes();
      return newDieta as DietaCliente;
    } catch (error: any) {
      console.error('Erro ao duplicar template:', error);
      toast.error('Erro ao criar dieta a partir do template');
      return null;
    }
  };

  // ============ REFEIÇÕES ============

  const addRefeicaoTemplate = async (templateId: string, data: RefeicaoFormData, ordem: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_template_refeicoes')
        .insert({
          template_id: templateId,
          ...data,
          ordem
        });

      if (error) throw error;
      
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar refeição:', error);
      toast.error('Erro ao adicionar refeição');
      return false;
    }
  };

  const addRefeicaoCliente = async (dietaId: string, data: RefeicaoFormData, ordem: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_cliente_refeicoes')
        .insert({
          dieta_id: dietaId,
          ...data,
          ordem
        });

      if (error) throw error;
      
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar refeição:', error);
      toast.error('Erro ao adicionar refeição');
      return false;
    }
  };

  const updateRefeicaoCliente = async (refeicaoId: string, data: Partial<RefeicaoFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_cliente_refeicoes')
        .update(data)
        .eq('id', refeicaoId);

      if (error) throw error;
      
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar refeição:', error);
      toast.error('Erro ao atualizar refeição');
      return false;
    }
  };

  const deleteRefeicaoCliente = async (refeicaoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_cliente_refeicoes')
        .delete()
        .eq('id', refeicaoId);

      if (error) throw error;
      
      toast.success('Refeição removida!');
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao remover refeição:', error);
      toast.error('Erro ao remover refeição');
      return false;
    }
  };

  const updateRefeicaoTemplate = async (refeicaoId: string, data: Partial<RefeicaoFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_template_refeicoes')
        .update(data)
        .eq('id', refeicaoId);

      if (error) throw error;
      
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar refeição:', error);
      toast.error('Erro ao atualizar refeição');
      return false;
    }
  };

  const deleteRefeicaoTemplate = async (refeicaoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_template_refeicoes')
        .delete()
        .eq('id', refeicaoId);

      if (error) throw error;
      
      toast.success('Refeição removida!');
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao remover refeição:', error);
      toast.error('Erro ao remover refeição');
      return false;
    }
  };

  // ============ ALIMENTOS ============

  const addAlimentoTemplate = async (refeicaoId: string, data: AlimentoFormData, ordem: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_template_alimentos')
        .insert({
          refeicao_id: refeicaoId,
          ...data,
          ordem
        });

      if (error) throw error;
      
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar alimento:', error);
      toast.error('Erro ao adicionar alimento');
      return false;
    }
  };

  const addAlimentoCliente = async (refeicaoId: string, data: AlimentoFormData, ordem: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_cliente_alimentos')
        .insert({
          refeicao_id: refeicaoId,
          ...data,
          ordem
        });

      if (error) throw error;
      
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar alimento:', error);
      toast.error('Erro ao adicionar alimento');
      return false;
    }
  };

  const updateAlimentoCliente = async (alimentoId: string, data: Partial<AlimentoFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_cliente_alimentos')
        .update(data)
        .eq('id', alimentoId);

      if (error) throw error;
      
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar alimento:', error);
      toast.error('Erro ao atualizar alimento');
      return false;
    }
  };

  const deleteAlimentoCliente = async (alimentoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_cliente_alimentos')
        .delete()
        .eq('id', alimentoId);

      if (error) throw error;
      
      toast.success('Alimento removido!');
      await fetchDietasClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao remover alimento:', error);
      toast.error('Erro ao remover alimento');
      return false;
    }
  };

  const updateAlimentoTemplate = async (alimentoId: string, data: Partial<AlimentoFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_template_alimentos')
        .update(data)
        .eq('id', alimentoId);

      if (error) throw error;
      
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar alimento:', error);
      toast.error('Erro ao atualizar alimento');
      return false;
    }
  };

  const deleteAlimentoTemplate = async (alimentoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dieta_template_alimentos')
        .delete()
        .eq('id', alimentoId);

      if (error) throw error;
      
      toast.success('Alimento removido!');
      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error('Erro ao remover alimento:', error);
      toast.error('Erro ao remover alimento');
      return false;
    }
  };

  // ============ HISTÓRICO ============

  const saveHistorico = async (dietaId: string, motivoAlteracao?: string): Promise<boolean> => {
    try {
      // Buscar dieta atual completa
      const dieta = dietasClientes.find(d => d.id === dietaId);
      if (!dieta) return false;

      // Buscar última versão
      const { data: lastVersion } = await supabase
        .from('dieta_historico')
        .select('versao')
        .eq('dieta_cliente_id', dietaId)
        .order('versao', { ascending: false })
        .limit(1)
        .single();

      const novaVersao = (lastVersion?.versao || 0) + 1;

      const { error } = await supabase
        .from('dieta_historico')
        .insert({
          dieta_cliente_id: dietaId,
          versao: novaVersao,
          dados_completos: dieta as any,
          motivo_alteracao: motivoAlteracao
        });

      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar histórico:', error);
      return false;
    }
  };

  const fetchHistorico = async (dietaId: string): Promise<DietaHistorico[]> => {
    try {
      const { data, error } = await supabase
        .from('dieta_historico')
        .select('*')
        .eq('dieta_cliente_id', dietaId)
        .order('versao', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        dados_completos: item.dados_completos as unknown as DietaCliente
      })) as DietaHistorico[];
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  };

  useEffect(() => {
    if (empresaId) {
      fetchTemplates();
      fetchDietasClientes();
    }
  }, [empresaId]);

  return {
    templates,
    dietasClientes,
    loading,
    // Templates
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // Dietas Clientes
    fetchDietasClientes,
    createDietaCliente,
    updateDietaCliente,
    deleteDietaCliente,
    duplicateFromTemplate,
    // Refeições
    addRefeicaoTemplate,
    addRefeicaoCliente,
    updateRefeicaoTemplate,
    updateRefeicaoCliente,
    deleteRefeicaoTemplate,
    deleteRefeicaoCliente,
    // Alimentos
    addAlimentoTemplate,
    addAlimentoCliente,
    updateAlimentoTemplate,
    updateAlimentoCliente,
    deleteAlimentoTemplate,
    deleteAlimentoCliente,
    // Histórico
    saveHistorico,
    fetchHistorico
  };
};
