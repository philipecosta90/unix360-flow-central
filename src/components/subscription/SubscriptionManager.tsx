import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, DollarSign, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { CaktoCheckout } from "./CaktoCheckout";

export const SubscriptionManager = () => {
  const { 
    subscription, 
    isLoading: loading, 
    isTrialActive,
    isTrialExpired,
    getDaysLeftInTrial,
    needsUpgrade
  } = useSubscription();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      trial: { label: "Trial", variant: "secondary" as const },
      active: { label: "Ativo", variant: "default" as const },
      suspended: { label: "Suspenso", variant: "destructive" as const },
      cancelled: { label: "Cancelado", variant: "outline" as const }
    };

    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCurrentPeriodDaysLeft = () => {
    if (!subscription?.current_period_end) return 0;
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const diffTime = periodEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <CaktoCheckout />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Minha Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            {getStatusBadge(subscription.status)}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Valor Mensal:</span>
            <span className="font-semibold">R$ {subscription.monthly_value.toFixed(2)}</span>
          </div>

          {subscription.status === 'active' && subscription.current_period_end && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800 font-semibold">
                  Assinatura Ativa
                </p>
              </div>
              <p className="text-xs text-green-600">
                Próxima cobrança em {getCurrentPeriodDaysLeft()} dias ({new Date(subscription.current_period_end).toLocaleDateString('pt-BR')})
              </p>
            </div>
          )}

          {subscription.status === 'trial' && isTrialActive && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Trial gratuito:</strong> {getDaysLeftInTrial} dias restantes
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Seu trial expira em {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {needsUpgrade && (
            <div className="p-4 bg-red-50 rounded-lg space-y-3">
              <p className="text-sm text-red-800">
                {subscription.status === 'suspended' 
                  ? 'Sua assinatura está suspensa. Renove para reativar o acesso.'
                  : 'Seu trial expirou. Assine agora para continuar usando o sistema.'
                }
              </p>
              <Button 
                onClick={() => window.location.href = '/subscription'}
                className="w-full"
              >
                Ver Planos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};