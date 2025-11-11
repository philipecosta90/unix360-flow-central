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
        <CardContent className="p-3">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
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

  // Mostrar botão de assinatura apenas quando NÃO tem assinatura ativa
  const shouldShowSubscribeButton = () => {
    return subscriptionStatus.status !== 'active';
  };

  return (
    <Card className={`${showExpiredWarning ? 'border-red-200 bg-red-50' : showTrialWarning ? 'border-orange-200 bg-orange-50' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status Info - Lado Esquerdo */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">Status:</span>
            </div>
            <Badge className={`${getStatusColor()} text-white text-xs`}>
              {getStatusText()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Plano: {subscriptionStatus.plan}
            </span>
          </div>

          {/* Warnings e Botão - Lado Direito */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Warning Compacto */}
            {showTrialWarning && (
              <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                <span>Trial expira em {subscriptionStatus.daysRemaining} dias</span>
              </div>
            )}
            
            {showExpiredWarning && (
              <div className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                <span>Assinatura expirada - apenas visualização</span>
              </div>
            )}

            {/* Botão de Assinatura */}
            {shouldShowSubscribeButton() && (
              <Button 
                onClick={handleSubscribe}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                size="sm"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                ASSINE JÁ
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};