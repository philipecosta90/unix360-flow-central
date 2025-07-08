import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, FileText, Smartphone } from "lucide-react";

interface PaymentFormProps {
  subscription: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentForm = ({ subscription, onClose, onSuccess }: PaymentFormProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'CREDIT_CARD' | 'BOLETO' | 'PIX'>('CREDIT_CARD');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar cliente no Asaas
      const { data: customerData, error: customerError } = await supabase.functions.invoke('asaas-create-customer', {
        body: formData
      });

      if (customerError) throw customerError;

      // 2. Criar assinatura no Asaas
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('asaas-create-subscription', {
        body: {
          customerId: customerData.customer.id,
          subscriptionId: subscription.id
        }
      });

      if (subscriptionError) throw subscriptionError;

      toast({
        title: "Sucesso!",
        description: "Forma de pagamento cadastrada com sucesso.",
      });

      onSuccess();

    } catch (error) {
      console.error('Error setting up payment:', error);
      toast({
        title: "Erro",
        description: "Falha ao cadastrar forma de pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'CREDIT_CARD' as const,
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Pagamento automático mensal'
    },
    {
      id: 'BOLETO' as const,
      name: 'Boleto Bancário',
      icon: FileText,
      description: 'Boleto gerado mensalmente'
    },
    {
      id: 'PIX' as const,
      name: 'PIX',
      icon: Smartphone,
      description: 'Pagamento via PIX'
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Forma de Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Método de Pagamento */}
          <div className="space-y-3">
            <Label>Forma de Pagamento</Label>
            <div className="grid gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-colors ${
                      selectedMethod === method.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-xs text-muted-foreground">{method.description}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Resumo */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Plano:</span>
                <span>UniX360 Mensal</span>
              </div>
              <div className="flex justify-between">
                <span>Valor:</span>
                <span className="font-semibold">R$ 75,00/mês</span>
              </div>
              <div className="flex justify-between">
                <span>Método:</span>
                <span>{paymentMethods.find(m => m.id === selectedMethod)?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};