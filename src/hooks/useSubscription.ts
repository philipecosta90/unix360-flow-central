import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Pick<
  Database['public']['Tables']['subscriptions']['Row'],
  'id' | 'status' | 'trial_start_date' | 'trial_end_date' | 'monthly_value' | 'current_period_start' | 'current_period_end'
>;

export const useSubscription = () => {
  const { userProfile } = useAuth();
  
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', userProfile?.empresa_id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!userProfile?.empresa_id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, status, trial_start_date, trial_end_date, monthly_value, current_period_start, current_period_end')
        .eq('empresa_id', userProfile.empresa_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!userProfile?.empresa_id,
  });

  const isTrialActive = () => {
    if (!subscription || subscription.status !== 'trial') return false;
    return new Date() <= new Date(subscription.trial_end_date);
  };

  const isTrialExpired = () => {
    if (!subscription || subscription.status !== 'trial') return false;
    return new Date() > new Date(subscription.trial_end_date);
  };

  const getDaysLeftInTrial = () => {
    if (!subscription || subscription.status !== 'trial') return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_end_date);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  // Auto-check for expired trials every hour
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (subscription && subscription.status === 'trial' && isTrialExpired()) {
        try {
          await supabase.functions.invoke('check-expired-trials');
          refetch(); // Refresh subscription data
        } catch (error) {
          console.error('Failed to check trial status:', error);
        }
      }
    };

    // Check immediately and then every hour
    checkTrialStatus();
    const interval = setInterval(checkTrialStatus, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [subscription, isTrialExpired, refetch]);

  const canUpgrade = () => {
    return subscription && (
      subscription.status === 'trial' || 
      subscription.status === 'suspended'
    );
  };

  const needsUpgrade = () => {
    return subscription && (
      (subscription.status === 'trial' && isTrialExpired()) ||
      subscription.status === 'suspended'
    );
  };

  const isActiveOrTrial = () => {
    if (!subscription) return false;
    
    if (subscription.status === 'active') return true;
    
    if (subscription.status === 'trial') {
      // Check if trial is still valid using current_period_end if available, fallback to trial_end_date
      const endDate = subscription.current_period_end || subscription.trial_end_date;
      return new Date() <= new Date(endDate);
    }
    
    return false;
  };

  const getDaysLeft = () => {
    if (!subscription) return 0;
    
    let endDate: string | null = null;
    
    if (subscription.status === 'trial') {
      endDate = subscription.current_period_end || subscription.trial_end_date;
    } else if (subscription.status === 'active' && subscription.current_period_end) {
      endDate = subscription.current_period_end;
    }
    
    if (!endDate) return 0;
    
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  return {
    subscription,
    isLoading,
    refetch,
    isTrialActive: isTrialActive(),
    isTrialExpired: isTrialExpired(),
    getDaysLeftInTrial: getDaysLeftInTrial(),
    canUpgrade: canUpgrade(),
    needsUpgrade: needsUpgrade(),
    isActiveOrTrial: isActiveOrTrial(),
    daysLeft: getDaysLeft(),
    status: subscription?.status || null
  };
};