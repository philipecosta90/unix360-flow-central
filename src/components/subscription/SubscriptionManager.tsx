import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, DollarSign, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { buildCheckoutUrl, getPlans } from "@/utils/checkoutUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SubscriptionManager = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { 
    subscription, 
    isLoading: loading, 
    isTrialActive,
    isTrialExpired,
    getDaysLeftInTrial,
    needsUpgrade,
    refetch,
  } = useSubscription();

  const plans = getPlans();

  // Ativação administrativa pontual para a empresa Mamateam
  useEffect(() => {
    const TARGET_EMPRESA = "60f94a7d-a9c3-4984-968a-a702bb4bda2e";
    const flagKey = `manual-activation-${TARGET_EMPRESA}`;

    const run = async () => {
      try {
        // Evita chamadas repetidas na mesma sessão
        if (sessionStorage.getItem(flagKey)) return;

        const { data: isSA, error: saErr } = await supabase.rpc("is_super_admin");
        if (saErr || !isSA) return; // apenas super admin

        const { error } = await supabase.functions.invoke("admin-activate-subscription", {
          body: { empresa_id: TARGET_EMPRESA },
        });
        if (error) throw error;

        sessionStorage.setItem(flagKey, "1");
        toast({ title: "Assinatura ativada", description: "Acesso liberado para Mamateam." });
        refetch();
      } catch (e) {
        console.error("Falha ao ativar assinatura manualmente", e);
      }
    };

    run();
  }, [refetch, toast]);

  const goCheckout = () => {
    if (!userProfile?.empresa_id || !userProfile.empresas?.email) {
      toast({
        title: "Erro",
        description: "Dados da empresa não encontrados",
        variant: "destructive"
      });
      return;
    }

    const href = buildCheckoutUrl({
      empresaId: userProfile.empresa_id,
      email: userProfile.empresas.email
    });
    
    if (!href) {
      toast({
        title: "Erro",
        description: "Configuração de checkout ausente",
        variant: "destructive"
      });
      return;
    }
    
    window.location.href = href;
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
              Escolha seu Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {plans.map((plan) => (
                <div key={plan.id} className="border border-primary shadow-md rounded-lg p-6 max-w-md">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-4">
                    R$ {plan.price.toFixed(2)}
                    <span className="text-base font-normal text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    type="button"
                    onClick={goCheckout}
                    className="w-full"
                  >
                    Assinar Agora
                  </Button>
                </div>
              ))}
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
                onClick={goCheckout}
                className="w-full"
              >
                Renovar Agora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};