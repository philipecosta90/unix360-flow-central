
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CRMStage {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  ativo: boolean;
}

export const useCRMStages = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['crm-stages', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      console.log('🔍 Buscando stages do CRM...');
      
      let { data: stages, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar stages:', error);
        throw error;
      }

      // Se não há stages, criar os padrões incluindo "Fechado"
      if (!stages || stages.length === 0) {
        console.log('📝 Criando stages padrão incluindo Fechado...');
        
        const defaultStages = [
          { nome: 'Lead', ordem: 1, cor: '#3B82F6' },
          { nome: 'Qualificado', ordem: 2, cor: '#F59E0B' },
          { nome: 'Proposta', ordem: 3, cor: '#F97316' },
          { nome: 'Negociação', ordem: 4, cor: '#8B5CF6' },
          { nome: 'Fechado', ordem: 5, cor: '#10B981' },
        ];

        const stagesToInsert = defaultStages.map(stage => ({
          ...stage,
          empresa_id: userProfile.empresa_id,
          ativo: true
        }));

        const { data: newStages, error: insertError } = await supabase
          .from('crm_stages')
          .insert(stagesToInsert)
          .select('*');

        if (insertError) {
          console.error('❌ Erro ao criar stages padrão:', insertError);
          throw insertError;
        }

        console.log('✅ Stages padrão criados com Fechado:', newStages);
        stages = newStages;
      }

      // Verificar se a etapa "Fechado" existe, se não, criar
      const temFechado = stages.some(stage => stage.nome.toLowerCase() === 'fechado');
      if (!temFechado) {
        console.log('📝 Adicionando stage Fechado...');
        
        const maxOrdem = Math.max(...stages.map(s => s.ordem), 0);
        const { data: fechadoStage, error: fechadoError } = await supabase
          .from('crm_stages')
          .insert({
            nome: 'Fechado',
            ordem: maxOrdem + 1,
            cor: '#10B981',
            empresa_id: userProfile.empresa_id,
            ativo: true
          })
          .select('*')
          .single();

        if (fechadoError) {
          console.error('❌ Erro ao criar stage Fechado:', fechadoError);
        } else {
          stages.push(fechadoStage);
          console.log('✅ Stage Fechado adicionado:', fechadoStage);
        }
      }

      console.log('✅ Stages carregados (incluindo Fechado):', stages);
      return stages as CRMStage[];
    },
    enabled: !!userProfile?.empresa_id,
  });
};
