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
  const [selectedMethod, setSelectedMethod] = useState<'CREDIT_CARD' | 'BOLETO' | 'PIX'>('PIX');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: ''
  });
  const [formValid, setFormValid] = useState(false);
  const { toast } = useToast();

  // Validação do formulário
  const validateForm = () => {
    const isValid = formData.name.trim() !== '' && 
                   formData.email.trim() !== '' && 
                   formData.cpfCnpj.trim() !== '' && 
                   formData.phone.trim() !== '';
    setFormValid(isValid);
    return isValid;
  };

  // Atualizar validação quando dados mudarem
  const updateFormData = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Revalidar formulário
    const isValid = newFormData.name.trim() !== '' && 
                   newFormData.email.trim() !== '' && 
                   newFormData.cpfCnpj.trim() !== '' && 
                   newFormData.phone.trim() !== '';
    setFormValid(isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se já existe assinatura ativa para este e-mail
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id, status, asaas_customer_id')
        .eq('empresa_id', subscription.empresa_id)
        .single();

      if (existingSubscription?.asaas_customer_id && existingSubscription.status === 'active') {
        throw new Error('Já existe uma assinatura ativa para esta empresa.');
      }

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
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Seu nome completo"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={(e) => updateFormData('cpfCnpj', e.target.value)}
                placeholder="000.000.000-00"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                required
                className="w-full"
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

          {/* Botões de Ação - Sempre visíveis */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formValid} 
              className="flex-1 font-semibold"
              style={{ minHeight: '40px' }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : (
                "Finalizar Pagamento"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};