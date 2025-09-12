import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Crown, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const SubscriptionBanner = () => {
  const { 
    subscription, 
    isActiveOrTrial, 
    daysLeft, 
    status,
    needsUpgrade 
  } = useSubscription();

  if (!subscription || subscription.status === 'active') {
    return null;
  }

  return (
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
                {subscription.status === 'trial' && isActiveOrTrial && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {daysLeft} dias restantes - Expira em{' '}
                      {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                
                {subscription.status === 'trial' && !isActiveOrTrial && (
                  <span>
                    Seu trial expirou. Entre em contato com o suporte para ativar sua assinatura.
                  </span>
                )}
                
                {subscription.status === 'suspended' && (
                  <span>
                    Sua assinatura está suspensa. Entre em contato com o suporte para reativar.
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {needsUpgrade && (
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => window.location.href = '/subscription'}
                className="bg-primary hover:bg-primary/90"
              >
                Ver Planos
              </Button>
              
              <span className="text-xs text-center text-gray-600">
                Escolha seu plano ideal
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};