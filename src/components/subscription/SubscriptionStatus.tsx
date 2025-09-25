import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Clock, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';

const CAKTO_PAYMENT_URL = 'https://pay.cakto.com.br/chho9do_565429';

export const SubscriptionStatus = () => {
  const { subscriptionStatus, loading } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const handleSubscribe = () => {
    window.open(CAKTO_PAYMENT_URL, '_blank');
  };

  const getStatusIcon = () => {
    switch (subscriptionStatus.status) {
      case 'trial':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expired':
      case 'canceled':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    switch (subscriptionStatus.status) {
      case 'trial':
        return 'bg-orange-500';
      case 'active':
        return 'bg-green-500';
      case 'expired':
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (subscriptionStatus.status) {
      case 'trial':
        return `Trial - ${subscriptionStatus.daysRemaining} dias restantes`;
      case 'active':
        return 'Assinatura Ativa';
      case 'expired':
        return 'Assinatura Expirada';
      case 'canceled':
        return 'Assinatura Cancelada';
      default:
        return 'Status Desconhecido';
    }
  };

  const showTrialWarning = subscriptionStatus.status === 'trial' && subscriptionStatus.daysRemaining <= 3;
  const showExpiredWarning = subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'canceled';

  return (
    <Card className={`${showExpiredWarning ? 'border-red-200 bg-red-50' : showTrialWarning ? 'border-orange-200 bg-orange-50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          Status da Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge className={`${getStatusColor()} text-white`}>
              {getStatusText()}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              Plano: {subscriptionStatus.plan}
            </p>
          </div>
        </div>

        {subscriptionStatus.status === 'trial' && (
          <div className="space-y-2">
            <p className="text-sm">
              Você está no período de trial gratuito de 7 dias.
            </p>
            {subscriptionStatus.trialEndDate && (
              <p className="text-xs text-muted-foreground">
                Trial expira em: {subscriptionStatus.trialEndDate.toLocaleDateString('pt-BR')}
              </p>
            )}
            {showTrialWarning && (
              <div className="bg-orange-100 border border-orange-300 rounded-md p-3">
                <p className="text-sm text-orange-800 font-medium">
                  ⚠️ Seu trial expira em {subscriptionStatus.daysRemaining} dias!
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Assine agora para continuar usando todas as funcionalidades.
                </p>
              </div>
            )}
          </div>
        )}

        {showExpiredWarning && (
          <div className="bg-red-100 border border-red-300 rounded-md p-3">
            <p className="text-sm text-red-800 font-medium">
              🚫 Sua assinatura expirou!
            </p>
            <p className="text-xs text-red-700 mt-1">
              Você pode visualizar os dados, mas não pode fazer alterações. Assine para reativar todas as funcionalidades.
            </p>
          </div>
        )}

        <Button 
          onClick={handleSubscribe}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          size="lg"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          ASSINE JÁ
        </Button>
      </CardContent>
    </Card>
  );
};