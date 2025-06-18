
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CRMProspect {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa_cliente: string;
  cargo: string;
  stage: string;
  valor_estimado: number;
  origem: string;
  tags: string[];
  responsavel_id: string;
  proximo_followup: string;
  observacoes: string;
  created_at: string;
}

interface CRMFilters {
  search: string;
  tags: string[];
  responsavel: string;
  stage: string;
}

export const useCRMProspects = (filters: CRMFilters) => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['crm-prospects', userProfile?.empresa_id, filters],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      let query = supabase
        .from('crm_prospects')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id);

      // Apply filters
      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,empresa_cliente.ilike.%${filters.search}%`);
      }
      
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      
      if (filters.responsavel) {
        query = query.eq('responsavel_id', filters.responsavel);
      }

      if (filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMProspect[];
    },
    enabled: !!userProfile?.empresa_id,
  });
};
