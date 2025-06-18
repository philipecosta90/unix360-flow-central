
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ConversionData {
  stage: string;
  count: number;
  percentage: number;
}

interface CRMConversionData {
  conversionRate: number;
  totalProspects: number;
  closedProspects: number;
  stageData: ConversionData[];
}

export const useCRMConversion = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['crm-conversion', userProfile?.empresa_id],
    queryFn: async (): Promise<CRMConversionData> => {
      if (!userProfile?.empresa_id) {
        return {
          conversionRate: 0,
          totalProspects: 0,
          closedProspects: 0,
          stageData: []
        };
      }

      // Fetch all prospects for the company
      const { data: prospects, error } = await supabase
        .from('crm_prospects')
        .select('stage')
        .eq('empresa_id', userProfile.empresa_id);

      if (error) throw error;

      const totalProspects = prospects?.length || 0;
      const closedProspects = prospects?.filter(p => p.stage === 'fechado').length || 0;
      const conversionRate = totalProspects > 0 ? (closedProspects / totalProspects) * 100 : 0;

      // Group prospects by stage and calculate percentages
      const stageGroups = prospects?.reduce((acc, prospect) => {
        const stage = prospect.stage || 'unknown';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Define stage order for funnel
      const stageOrder = ['lead', 'contatado', 'proposta enviada', 'negociação', 'fechado'];
      
      const stageData: ConversionData[] = stageOrder.map(stage => {
        const count = stageGroups?.[stage] || 0;
        const percentage = totalProspects > 0 ? (count / totalProspects) * 100 : 0;
        return {
          stage: stage.charAt(0).toUpperCase() + stage.slice(1),
          count,
          percentage
        };
      });

      // Add any additional stages not in the predefined order
      Object.entries(stageGroups || {}).forEach(([stage, count]) => {
        if (!stageOrder.includes(stage.toLowerCase())) {
          const percentage = totalProspects > 0 ? (count / totalProspects) * 100 : 0;
          stageData.push({
            stage: stage.charAt(0).toUpperCase() + stage.slice(1),
            count,
            percentage
          });
        }
      });

      return {
        conversionRate,
        totalProspects,
        closedProspects,
        stageData: stageData.filter(stage => stage.count > 0)
      };
    },
    enabled: !!userProfile?.empresa_id,
  });
};
