import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PlanExpiration {
  clientId: string;
  clientName: string;
  planEndDate: string;
  daysUntilExpiration: number;
}

export const usePlanExpirationAlerts = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [expiringPlans, setExpiringPlans] = useState<PlanExpiration[]>([]);

  const checkPlanExpirations = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      const today = new Date();
      const warningDate = new Date();
      warningDate.setDate(today.getDate() + 30); // 30 dias de antecedência

      const { data: clients, error } = await supabase
        .from('clientes')
        .select('id, nome, data_fim_plano')
        .eq('empresa_id', userProfile.empresa_id)
        .not('data_fim_plano', 'is', null)
        .lte('data_fim_plano', warningDate.toISOString().split('T')[0]);

      if (error) throw error;

      const expirations: PlanExpiration[] = [];

      clients?.forEach(client => {
        if (client.data_fim_plano) {
          const endDate = new Date(client.data_fim_plano);
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= 30) {
            expirations.push({
              clientId: client.id,
              clientName: client.nome,
              planEndDate: client.data_fim_plano,
              daysUntilExpiration: diffDays
            });
          }
        }
      });

      setExpiringPlans(expirations);

      // Mostrar notificações para planos que vencem em até 7 dias
      expirations.forEach(expiration => {
        if (expiration.daysUntilExpiration <= 7 && expiration.daysUntilExpiration >= 0) {
          const message = expiration.daysUntilExpiration === 0 
            ? `O plano do cliente ${expiration.clientName} vence hoje!`
            : `O plano do cliente ${expiration.clientName} vence em ${expiration.daysUntilExpiration} dias`;
          
          toast({
            title: "⚠️ Plano próximo ao vencimento",
            description: message,
            variant: expiration.daysUntilExpiration <= 3 ? "destructive" : "default",
          });
        }
      });

    } catch (error) {
      console.error('Erro ao verificar vencimentos:', error);
    }
  };

  useEffect(() => {
    checkPlanExpirations();
    
    // Verificar a cada 4 horas
    const interval = setInterval(checkPlanExpirations, 4 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userProfile?.empresa_id]);

  return {
    expiringPlans,
    checkPlanExpirations
  };
};