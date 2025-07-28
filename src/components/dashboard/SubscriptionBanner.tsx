import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Crown, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentForm } from "@/components/subscription/PaymentForm";
import { useState } from "react";

export const SubscriptionBanner = () => {
  const { 
    subscription, 
    isTrialActive, 
    isTrialExpired, 
    getDaysLeftInTrial, 
    canUpgrade,
    needsUpgrade 
  } = useSubscription();
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!subscription || subscription.status === 'active') {
    return null;
  }

  const handleUpgradeSuccess = () => {
    setShowPaymentForm(false);
    window.location.reload(); // Recarrega para atualizar o status
  };

  return (
    <>
      <Card className={`border-l-4 ${
        needsUpgrade 
          ? 'border-l-red-500 bg-red-50' 
          : 'border-l-blue-500 bg-blue-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {needsUpgrade ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Crown className="h-5 w-5 text-blue-600" />
              )}
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${
                    needsUpgrade ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {subscription.status === 'trial' ? 'Trial Gratuito' : 'Assinatura Suspensa'}
                  </h3>
                  <Badge variant={subscription.status === 'trial' ? 'secondary' : 'destructive'}>
                    {subscription.status === 'trial' ? 'Trial' : 'Suspensa'}
                  </Badge>
                </div>
                
                <div className={`text-sm ${
                  needsUpgrade ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {subscription.status === 'trial' && isTrialActive && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {getDaysLeftInTrial} dias restantes - Expira em{' '}
                        {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  {subscription.status === 'trial' && isTrialExpired && (
                    <span>
                      Seu trial expirou. Assine agora para continuar usando todas as funcionalidades.
                    </span>
                  )}
                  
                  {subscription.status === 'suspended' && (
                    <span>
                      Sua assinatura está suspensa. Regularize o pagamento para reativar o acesso.
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {canUpgrade && (
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => setShowPaymentForm(true)}
                  className={
                    needsUpgrade 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                >
                  {needsUpgrade ? 'Reativar Agora' : 'Assinar Agora'}
                </Button>
                
                {!needsUpgrade && (
                  <span className="text-xs text-center text-blue-600">
                    R$ 75,00/mês
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showPaymentForm && subscription && (
        <PaymentForm
          subscription={subscription}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </>
  );
};