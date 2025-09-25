import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired' | 'canceled';
  plan: string;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  activeSubscriptionStartDate: Date | null;
  activeSubscriptionEndDate: Date | null;
  daysRemaining: number;
  activeSubscriptionDaysRemaining: number;
  hasActiveSubscription: boolean;
  canMakeChanges: boolean;
}

export const useSubscription = () => {
  const { userProfile } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateDaysRemaining = (trialEndDate: Date | null): number => {
    if (!trialEndDate) return 0;
    const now = new Date();
    const diff = trialEndDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const fetchSubscriptionStatus = async () => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    try {
    const { data, error } = await supabase
      .from('perfis')
      .select('subscription_status, subscription_plan, trial_start_date, trial_end_date, data_de_assinatura_ativa, data_de_expiracao_da_assinatura_ativa')
      .eq('user_id', userProfile.user_id)
      .single();

      if (error) {
        console.error('Erro ao buscar status da assinatura:', error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar o status da assinatura.",
          variant: "destructive",
        });
        return;
      }

    const trialEndDate = data.trial_end_date ? new Date(data.trial_end_date) : null;
    const trialStartDate = data.trial_start_date ? new Date(data.trial_start_date) : null;
    const activeSubscriptionStartDate = data.data_de_assinatura_ativa ? new Date(data.data_de_assinatura_ativa) : null;
    const activeSubscriptionEndDate = data.data_de_expiracao_da_assinatura_ativa ? new Date(data.data_de_expiracao_da_assinatura_ativa) : null;
    
    const daysRemaining = calculateDaysRemaining(trialEndDate);
    const activeSubscriptionDaysRemaining = calculateDaysRemaining(activeSubscriptionEndDate);
    const now = new Date();
    
    const hasActiveSubscription = 
      (data.subscription_status === 'active' && activeSubscriptionEndDate && activeSubscriptionEndDate > now) || 
      (data.subscription_status === 'trial' && trialEndDate && trialEndDate > now);

    const canMakeChanges = hasActiveSubscription;

    setSubscriptionStatus({
      status: data.subscription_status as 'trial' | 'active' | 'expired' | 'canceled',
      plan: data.subscription_plan || 'free',
      trialStartDate,
      trialEndDate,
      activeSubscriptionStartDate,
      activeSubscriptionEndDate,
      daysRemaining,
      activeSubscriptionDaysRemaining,
      hasActiveSubscription,
      canMakeChanges,
    });
    } catch (error) {
      console.error('Erro inesperado ao verificar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [userProfile]);

  // Monitorar mudanças em tempo real
  useEffect(() => {
    if (!userProfile) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perfis',
          filter: `user_id=eq.${userProfile.user_id}`,
        },
        () => {
          fetchSubscriptionStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assinaturas_cakto',
          filter: `perfil_id=eq.${userProfile.id}`,
        },
        () => {
          fetchSubscriptionStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  const refreshSubscriptionStatus = () => {
    fetchSubscriptionStatus();
  };

  return {
    subscriptionStatus,
    loading,
    refreshSubscriptionStatus,
  };
};