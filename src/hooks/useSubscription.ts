import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Subscription {
  id: string;
  status: string;
  trial_start_date: string;
  trial_end_date: string;
  monthly_value: number;
  current_period_start: string | null;
  current_period_end: string | null;
}

export const useSubscription = () => {
  const { userProfile } = useAuth();
  
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', userProfile?.empresa_id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!userProfile?.empresa_id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .single();

      if (error && error.code !== 'PGRST116') {
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

  return {
    subscription,
    isLoading,
    refetch,
    isTrialActive: isTrialActive(),
    isTrialExpired: isTrialExpired(),
    getDaysLeftInTrial: getDaysLeftInTrial(),
    canUpgrade: canUpgrade(),
    needsUpgrade: needsUpgrade()
  };
};