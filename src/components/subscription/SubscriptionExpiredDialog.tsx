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
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';

export const SubscriptionExpiredDialog = () => {
  const { userProfile } = useAuth();
  const { subscriptionStatus, refreshSubscriptionStatus, loading } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Verificar se o plano está expirado
  const isExpired = subscriptionStatus?.status === 'expired' || 
    (subscriptionStatus && !subscriptionStatus.hasActiveSubscription && subscriptionStatus.status !== 'trial');

  // Abrir dialog automaticamente quando plano expirar
  useEffect(() => {
    if (userProfile && !loading && isExpired) {
      setIsOpen(true);
    } else if (!isExpired) {
      setIsOpen(false);
    }
  }, [userProfile, isExpired, loading]);

  const handleRenew = () => {
    window.open('https://pay.cakto.com.br/chho9do_565429', '_blank');
  };

  const handleCheckRenewal = async () => {
    setIsChecking(true);
    await refreshSubscriptionStatus();
    // Aguardar um pouco para dar feedback visual
    setTimeout(() => {
      setIsChecking(false);
    }, 2000);
  };

  // Não renderizar se não estiver expirado
  if (!isExpired || !userProfile) {
    return null;
  }

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                Acesso Bloqueado
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Seu plano expirou
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-foreground">
              Sua assinatura expirou e o acesso à plataforma está temporariamente bloqueado.
            </p>
            <p className="text-sm text-muted-foreground">
              Para continuar utilizando todos os recursos, renove sua assinatura agora.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRenew}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Renovar Assinatura
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleCheckRenewal}
              disabled={isChecking}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? "Verificando..." : "Já Renovei - Verificar"}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-md">
            Após realizar o pagamento, clique em "Já Renovei - Verificar" para liberar seu acesso.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
