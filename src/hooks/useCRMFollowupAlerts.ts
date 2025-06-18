
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CRMProspect {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  stage: string;
  proximo_followup: string;
}

interface CRMActivity {
  prospect_id: string;
  data_atividade: string;
}

interface FollowupAlert {
  id: string;
  nome: string;
  stage: string;
  email: string;
  telefone: string;
  proximo_followup: string | null;
  last_activity_date: string | null;
  is_overdue_followup: boolean;
  is_inactive: boolean;
  is_critical: boolean; // Both conditions true
}

export const useCRMFollowupAlerts = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['crm-followup-alerts', userProfile?.empresa_id],
    queryFn: async (): Promise<FollowupAlert[]> => {
      if (!userProfile?.empresa_id) return [];

      const today = new Date().toISOString().split('T')[0];
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Query 1: Get all prospects for the company
      const { data: prospects, error: prospectsError } = await supabase
        .from('crm_prospects')
        .select('id, nome, email, telefone, stage, proximo_followup')
        .eq('empresa_id', userProfile.empresa_id);

      if (prospectsError) throw prospectsError;

      // Query 2: Get recent activities for all prospects
      const prospectIds = prospects?.map(p => p.id) || [];
      
      let recentActivities: CRMActivity[] = [];
      if (prospectIds.length > 0) {
        const { data: activities, error: activitiesError } = await supabase
          .from('crm_atividades')
          .select('prospect_id, data_atividade')
          .in('prospect_id', prospectIds)
          .gte('data_atividade', fourteenDaysAgo)
          .order('data_atividade', { ascending: false });

        if (activitiesError) throw activitiesError;
        recentActivities = activities || [];
      }

      // Query 3: Get last activity date for each prospect
      const lastActivitiesMap = new Map<string, string>();
      if (prospectIds.length > 0) {
        const { data: lastActivities, error: lastActivitiesError } = await supabase
          .from('crm_atividades')
          .select('prospect_id, data_atividade')
          .in('prospect_id', prospectIds)
          .order('data_atividade', { ascending: false });

        if (lastActivitiesError) throw lastActivitiesError;
        
        // Group by prospect_id and get the most recent activity
        (lastActivities || []).forEach(activity => {
          if (!lastActivitiesMap.has(activity.prospect_id)) {
            lastActivitiesMap.set(activity.prospect_id, activity.data_atividade);
          }
        });
      }

      // Create activity map for quick lookup
      const recentActivityMap = new Map<string, boolean>();
      recentActivities.forEach(activity => {
        recentActivityMap.set(activity.prospect_id, true);
      });

      // Process prospects and create alerts
      const alerts: FollowupAlert[] = [];

      prospects?.forEach(prospect => {
        const isOverdueFollowup = prospect.proximo_followup && prospect.proximo_followup < today;
        const hasRecentActivity = recentActivityMap.has(prospect.id);
        const isInactive = !hasRecentActivity;
        
        // Only include prospects that meet at least one criteria
        if (isOverdueFollowup || isInactive) {
          alerts.push({
            id: prospect.id,
            nome: prospect.nome,
            stage: prospect.stage,
            email: prospect.email || '',
            telefone: prospect.telefone || '',
            proximo_followup: prospect.proximo_followup,
            last_activity_date: lastActivitiesMap.get(prospect.id) || null,
            is_overdue_followup: !!isOverdueFollowup,
            is_inactive: isInactive,
            is_critical: !!isOverdueFollowup && isInactive
          });
        }
      });

      // Sort by critical alerts first, then by follow-up date
      return alerts.sort((a, b) => {
        if (a.is_critical && !b.is_critical) return -1;
        if (!a.is_critical && b.is_critical) return 1;
        
        if (a.proximo_followup && b.proximo_followup) {
          return a.proximo_followup.localeCompare(b.proximo_followup);
        }
        
        return a.nome.localeCompare(b.nome);
      });
    },
    enabled: !!userProfile?.empresa_id,
  });
};
