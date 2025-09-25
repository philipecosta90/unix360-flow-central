import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
  action?: string; // Descrição da ação que está sendo bloqueada
}

export const SubscriptionGuard = ({ children, action = "esta ação" }: SubscriptionGuardProps) => {
  const { subscriptionStatus, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscriptionStatus?.canMakeChanges) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium">Assinatura necessária</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você precisa de uma assinatura ativa para {action}.
              {subscriptionStatus?.status === 'trial' 
                ? ` Seu trial expira em ${subscriptionStatus.daysRemaining} dias.`
                : ' Seu trial expirou ou sua assinatura não está ativa.'
              }
            </p>
          </div>
          <Button 
            onClick={() => window.open('https://pay.cakto.com.br/chho9do_565429', '_blank')}
            className="ml-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="sm"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Assinar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};