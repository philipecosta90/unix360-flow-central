
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CRMStage {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
}

export const useCRMStages = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['crm-stages', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      return data as CRMStage[];
    },
    enabled: !!userProfile?.empresa_id,
  });
};
