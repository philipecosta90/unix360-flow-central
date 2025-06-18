
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CRMDashboardData {
  totalProspects: number;
  totalLeads: number;
  totalNegotiation: number;
  totalClosed: number;
  totalEstimatedValue: number;
  prospectsByStage: { stage: string; count: number; value: number }[];
}

export const useCRMDashboard = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['crm-dashboard', userProfile?.empresa_id],
    queryFn: async (): Promise<CRMDashboardData> => {
      if (!userProfile?.empresa_id) {
        return {
          totalProspects: 0,
          totalLeads: 0,
          totalNegotiation: 0,
          totalClosed: 0,
          totalEstimatedValue: 0,
          prospectsByStage: []
        };
      }

      // Fetch all prospects for the company
      const { data: prospects, error } = await supabase
        .from('crm_prospects')
        .select('stage, valor_estimado')
        .eq('empresa_id', userProfile.empresa_id);

      if (error) throw error;

      const totalProspects = prospects?.length || 0;
      const totalLeads = prospects?.filter(p => p.stage === 'lead').length || 0;
      const totalNegotiation = prospects?.filter(p => p.stage === 'negociação').length || 0;
      const totalClosed = prospects?.filter(p => p.stage === 'fechado').length || 0;
      const totalEstimatedValue = prospects?.reduce((sum, p) => sum + (p.valor_estimado || 0), 0) || 0;

      // Group prospects by stage for chart
      const stageGroups = prospects?.reduce((acc, prospect) => {
        const stage = prospect.stage || 'unknown';
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0 };
        }
        acc[stage].count++;
        acc[stage].value += prospect.valor_estimado || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const prospectsByStage = Object.entries(stageGroups || {}).map(([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value
      }));

      return {
        totalProspects,
        totalLeads,
        totalNegotiation,
        totalClosed,
        totalEstimatedValue,
        prospectsByStage
      };
    },
    enabled: !!userProfile?.empresa_id,
  });
};
