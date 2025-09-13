
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

      // Se não há stages, criar os padrões
      if (!stages || stages.length === 0) {
        console.log('📝 Criando stages padrão...');
        
        const defaultStages = [
          { nome: 'INBOX', ordem: 1, cor: '#6B7280' },
          { nome: 'LEAD', ordem: 2, cor: '#3B82F6' },
          { nome: 'QUALIFICAÇÃO', ordem: 3, cor: '#F59E0B' },
          { nome: 'CONTATO INICIAL', ordem: 4, cor: '#F97316' },
          { nome: 'PROPOSTA ENVIADA', ordem: 5, cor: '#8B5CF6' },
          { nome: 'NEGOCIAÇÃO', ordem: 6, cor: '#EC4899' },
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

        console.log('✅ Stages padrão criados:', newStages);
        stages = newStages;
      }

      console.log('✅ Stages carregados:', stages);
      return stages as CRMStage[];
    },
    enabled: !!userProfile?.empresa_id,
  });
};
