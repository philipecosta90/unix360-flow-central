import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, DollarSign, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SubscriptionManager = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { 
    subscription, 
    isLoading: loading, 
    isTrialActive,
    isTrialExpired,
    getDaysLeftInTrial,
    needsUpgrade,
    refetch,
  } = useSubscription();


  const handleStripeCheckout = async () => {
    if (!userProfile) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout');
      
      if (error) {
        throw error;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plano de Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="border border-primary shadow-md rounded-lg p-6 max-w-md">
                <div className="text-center mb-4">
                  <Badge className="mb-2">Recomendado</Badge>
                  <h3 className="text-xl font-semibold">Plano Starter</h3>
                </div>
                <div className="text-3xl font-bold mb-4 text-center">
                  R$ 87,00
                  <span className="text-base font-normal text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    CRM completo com pipeline de vendas
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Gestão financeira e contratos
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Customer Success e NPS
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Relatórios e dashboards
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Usuários ilimitados
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Suporte premium
                  </li>
                </ul>
                <Button 
                  type="button"
                  onClick={handleStripeCheckout}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Assinar Agora'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
                type="button"
                onClick={handleStripeCheckout}
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Renovar Agora'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};