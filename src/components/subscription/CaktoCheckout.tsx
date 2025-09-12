import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 75.00,
    features: [
      'CRM completo',
      'Gestão financeira',
      'Customer Success',
      'Até 5 usuários',
      'Suporte por email'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 150.00,
    popular: true,
    features: [
      'Tudo do plano Básico',
      'Usuários ilimitados',
      'Relatórios avançados',
      'Integrações personalizadas',
      'Suporte prioritário'
    ]
  }
];

export const CaktoCheckout = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    if (!userProfile?.empresa_id || !userProfile.nome) {
      toast({
        title: "Erro",
        description: "Dados do usuário não encontrados",
        variant: "destructive"
      });
      return;
    }

    setLoading(planId);

    try {
      // Create checkout URL with Cakto
      const checkoutBaseUrl = "https://checkout.cakto.com.br"; // This should come from CAKTO_CHECKOUT_BASE_URL env
      const params = new URLSearchParams({
        planId,
        empresaId: userProfile.empresa_id,
        email: userProfile.nome, // Assuming nome contains email, adjust if needed
        returnUrl: window.location.origin + '/subscription/success',
        cancelUrl: window.location.origin + '/subscription/cancel'
      });

      const checkoutUrl = `${checkoutBaseUrl}?${params.toString()}`;
      
      // Redirect to Cakto checkout
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar checkout. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Escolha seu plano</h2>
        <p className="text-muted-foreground mt-2">
          Selecione o plano ideal para sua empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="px-3 py-1">
                  Mais Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold">
                R$ {plan.price.toFixed(2)}
                <span className="text-base font-normal text-muted-foreground">/mês</span>
              </div>
              <CardDescription>
                Acesso completo a todas as funcionalidades
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {loading === plan.id ? "Processando..." : "Assine já"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>• Cobrança mensal automática</p>
        <p>• Cancele a qualquer momento</p>
        <p>• Suporte especializado incluído</p>
      </div>
    </div>
  );
};