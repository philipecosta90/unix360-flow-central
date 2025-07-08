import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CreditCard, DollarSign } from "lucide-react";
import { PaymentForm } from "./PaymentForm";

interface Subscription {
  id: string;
  status: string;
  trial_start_date: string;
  trial_end_date: string;
  monthly_value: number;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date: string | null;
  payment_method: string | null;
}

export const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // Carregar assinatura
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      setSubscription(subscriptionData);

      // Carregar faturas se houver assinatura
      if (subscriptionData) {
        const { data: invoicesData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .eq('subscription_id', subscriptionData.id)
          .order('due_date', { ascending: false });

        if (invError) throw invError;
        setInvoices(invoicesData || []);
      }

    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados da assinatura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const getInvoiceStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      confirmed: { label: "Pago", variant: "default" as const },
      overdue: { label: "Vencido", variant: "destructive" as const },
      cancelled: { label: "Cancelado", variant: "outline" as const }
    };

    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isTrialExpired = () => {
    if (!subscription) return false;
    return new Date() > new Date(subscription.trial_end_date);
  };

  const getDaysLeftInTrial = () => {
    if (!subscription) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_end_date);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (!subscription) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Nenhuma assinatura encontrada.
            </p>
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

          {subscription.status === 'trial' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Trial gratuito:</strong> {getDaysLeftInTrial()} dias restantes
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Seu trial expira em {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {(subscription.status === 'trial' && isTrialExpired()) || subscription.status === 'suspended' && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 mb-3">
                {subscription.status === 'suspended' 
                  ? 'Sua assinatura está suspensa. Regularize o pagamento para continuar usando o sistema.'
                  : 'Seu trial expirou. Cadastre uma forma de pagamento para continuar usando o sistema.'
                }
              </p>
              <Button onClick={() => setShowPaymentForm(true)} className="w-full">
                Cadastrar Forma de Pagamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Histórico de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma fatura encontrada.
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        Vencimento: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {invoice.payment_date && (
                      <div className="text-xs text-muted-foreground">
                        Pago em: {new Date(invoice.payment_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {invoice.payment_method && (
                      <div className="text-xs text-muted-foreground">
                        Método: {invoice.payment_method}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-semibold">R$ {invoice.amount.toFixed(2)}</div>
                    {getInvoiceStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      {showPaymentForm && (
        <PaymentForm
          subscription={subscription}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={() => {
            setShowPaymentForm(false);
            loadSubscriptionData();
          }}
        />
      )}
    </div>
  );
};