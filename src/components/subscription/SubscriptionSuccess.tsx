import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export const SubscriptionSuccess = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const navigate = useNavigate();
  const { subscription, refetch } = useSubscription();

  useEffect(() => {
    // Check subscription status periodically
    const checkStatus = async () => {
      await refetch();
      
      // If subscription is active, show success
      if (subscription?.status === 'active') {
        setStatus('success');
        return;
      }

      // Continue checking for up to 2 minutes
      const timeout = setTimeout(() => {
        setStatus('error');
      }, 120000); // 2 minutes

      return () => clearTimeout(timeout);
    };

    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    checkStatus();

    return () => clearInterval(interval);
  }, [subscription, refetch]);

  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'processing' && (
            <>
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Processando Pagamento</CardTitle>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Pagamento Aprovado!</CardTitle>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-red-800">Aguardando Confirmação</CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {status === 'processing' && (
            <div>
              <p className="text-muted-foreground mb-4">
                Aguarde enquanto confirmamos seu pagamento via Stripe. A ativação acontece automaticamente em alguns segundos.
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <p className="text-green-700 mb-4">
                Sua assinatura foi ativada com sucesso via Stripe! Você já pode usar todas as funcionalidades do sistema.
              </p>
              <Button onClick={handleGoToDashboard} className="w-full">
                Ir para o Dashboard
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div>
              <p className="text-muted-foreground mb-4">
                Pagamento processado via Stripe. A ativação pode levar alguns minutos. Você receberá uma confirmação quando for aprovado.
              </p>
              <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
                Voltar ao Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};