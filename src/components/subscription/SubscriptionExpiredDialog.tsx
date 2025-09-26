import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, X } from 'lucide-react';

export const SubscriptionExpiredDialog = () => {
  const { userProfile } = useAuth();
  const { subscriptionStatus } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [lastShownTime, setLastShownTime] = useState<number>(0);

  // Verificar se deve mostrar o pop-up
  const shouldShowDialog = () => {
    if (!userProfile || !subscriptionStatus) return false;
    
    // Mostrar apenas quando a assinatura NÃO está ativa
    return subscriptionStatus.status !== 'active';
  };

  // Verificar se já passou o tempo mínimo desde a última exibição (30 minutos)
  const canShowAgain = () => {
    const now = Date.now();
    return (now - lastShownTime) > (30 * 60 * 1000); // 30 minutos
  };

  useEffect(() => {
    if (shouldShowDialog() && canShowAgain() && !isOpen) {
      setIsOpen(true);
      setLastShownTime(Date.now());
    }
  }, [userProfile, subscriptionStatus, isOpen, lastShownTime]);

  // Mostrar automaticamente quando o usuário faz login
  useEffect(() => {
    if (userProfile && shouldShowDialog()) {
      const timer = setTimeout(() => {
        if (canShowAgain()) {
          setIsOpen(true);
          setLastShownTime(Date.now());
        }
      }, 2000); // 2 segundos após login
      
      return () => clearTimeout(timer);
    }
  }, [userProfile]);

  const handleClose = () => {
    setIsOpen(false);
    setLastShownTime(Date.now());
  };

  const handleRenew = () => {
    window.open('https://pay.cakto.com.br/chho9do_565429', '_blank');
    handleClose();
  };

  if (!shouldShowDialog()) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Plano Vencido
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Seu acesso está limitado
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-gray-700">
              {subscriptionStatus?.status === 'trial' 
                ? 'Seu período de teste expirou'
                : 'Sua assinatura encontra-se vencida'
              }
            </p>
            <p className="text-sm text-gray-600">
              Para continuar aproveitando todos os benefícios da plataforma, 
              renove sua assinatura agora mesmo.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRenew}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Renove sua assinatura agora
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="w-full"
            >
              Lembrar mais tarde
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Este aviso aparecerá periodicamente até a renovação
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};