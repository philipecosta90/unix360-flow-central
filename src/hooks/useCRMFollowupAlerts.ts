
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface CRMProspect {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  stage: string;
  proximo_followup: string;
  created_at: string;
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
  days_since_creation: number;
  days_since_last_activity: number;
}

export const useCRMFollowupAlerts = () => {
  const { userProfile } = useAuth();

  const query = useQuery({
    queryKey: ['crm-followup-alerts', userProfile?.empresa_id],
    queryFn: async (): Promise<FollowupAlert[]> => {
      if (!userProfile?.empresa_id) return [];

      const today = new Date().toISOString().split('T')[0];
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Query 1: Get all prospects for the company including created_at
      const { data: prospects, error: prospectsError } = await supabase
        .from('crm_prospects')
        .select('id, nome, email, telefone, stage, proximo_followup, created_at')
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
        const lastActivityDate = lastActivitiesMap.get(prospect.id);
        
        // Calculate days since creation
        const createdDate = new Date(prospect.created_at);
        const currentDate = new Date();
        const daysSinceCreation = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate days since last activity (or creation if no activities)
        const referenceDate = lastActivityDate ? new Date(lastActivityDate) : createdDate;
        const daysSinceLastActivity = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Consider inactive only if it's been more than 14 days since creation AND no recent activity
        // OR has activities but none in the last 14 days and was created more than 14 days ago
        const isInactive = daysSinceCreation > 14 && !hasRecentActivity;
        
        // Only include prospects that meet at least one criteria
        if (isOverdueFollowup || isInactive) {
          alerts.push({
            id: prospect.id,
            nome: prospect.nome,
            stage: prospect.stage,
            email: prospect.email || '',
            telefone: prospect.telefone || '',
            proximo_followup: prospect.proximo_followup,
            last_activity_date: lastActivityDate || null,
            is_overdue_followup: !!isOverdueFollowup,
            is_inactive: isInactive,
            is_critical: !!isOverdueFollowup && isInactive,
            days_since_creation: daysSinceCreation,
            days_since_last_activity: daysSinceLastActivity
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

  // Set up real-time subscriptions for prospects and activities
  useEffect(() => {
    if (!userProfile?.empresa_id) return;

    const prospectsChannelName = `crm-prospects-changes-${userProfile.empresa_id}`;
    supabase.getChannels().forEach((ch) => {
      if ((ch as any).topic === prospectsChannelName) supabase.removeChannel(ch);
    });

    const prospectsChannel = supabase
      .channel(prospectsChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_prospects',
          filter: `empresa_id=eq.${userProfile.empresa_id}`
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    const activitiesChannelName = `crm-activities-changes-${userProfile.empresa_id}`;
    supabase.getChannels().forEach((ch) => {
      if ((ch as any).topic === activitiesChannelName) supabase.removeChannel(ch);
    });

    const activitiesChannel = supabase
      .channel(activitiesChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_atividades'
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(prospectsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [userProfile?.empresa_id]);

  return query;
};
