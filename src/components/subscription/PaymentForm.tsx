import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  subscription: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentForm = ({ subscription, onClose, onSuccess }: PaymentFormProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'PIX' | 'BOLETO'>('PIX');
  const [loading, setLoading] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
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
          subscriptionId: subscription.id,
          selectedMethod: selectedMethod
        }
      });

      if (subscriptionError) {
        throw subscriptionError;
      }

      // Show payment instructions
      setPaymentInstructions(subscriptionData.payment);
      
      toast({
        title: "Cobrança gerada com sucesso!",
        description: `Instruções de pagamento via ${selectedMethod} foram geradas. O acesso será ativado após a confirmação do pagamento.`,
      });

    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Forma de Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!paymentInstructions && (
            <>
              {/* Seleção do Método de Pagamento */}
              <div className="space-y-3">
                <Label>Forma de Pagamento</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                      selectedMethod === 'PIX' ? 'border-primary bg-primary/10' : 'border-muted'
                    }`}
                    onClick={() => setSelectedMethod('PIX')}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">📱</span>
                      <span className="text-sm font-medium">PIX</span>
                      <span className="text-xs text-muted-foreground">Instantâneo</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                      selectedMethod === 'BOLETO' ? 'border-primary bg-primary/10' : 'border-muted'
                    }`}
                    onClick={() => setSelectedMethod('BOLETO')}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">🏦</span>
                      <span className="text-sm font-medium">Boleto</span>
                      <span className="text-xs text-muted-foreground">1-3 dias úteis</span>
                    </div>
                  </div>
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
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium text-sm">Resumo do Pedido</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plano UniX360</span>
                    <span>R$ 75,00/mês</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Método:</span>
                    <span>{selectedMethod === 'PIX' ? 'PIX' : 'Boleto Bancário'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {paymentInstructions && (
            <div className="rounded-lg border bg-background p-4 space-y-4">
              <h4 className="font-medium text-sm text-success">🎉 Cobrança Gerada!</h4>
              
              {selectedMethod === 'PIX' && paymentInstructions.pix_qr_code && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código PIX:</p>
                  <div className="flex flex-col gap-2">
                    <textarea 
                      readOnly 
                      value={paymentInstructions.pix_copy_paste} 
                      className="resize-none rounded border p-2 text-xs font-mono"
                      rows={3}
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(paymentInstructions.pix_copy_paste);
                        toast({ title: "Código PIX copiado!" });
                      }}
                    >
                      Copiar código PIX
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedMethod === 'BOLETO' && paymentInstructions.boleto_url && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Clique no botão abaixo para abrir seu boleto:</p>
                  <Button 
                    onClick={() => window.open(paymentInstructions.boleto_url, '_blank')}
                    className="w-full"
                  >
                    Abrir Boleto
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground border-t pt-3">
                ⏱️ Seu acesso será ativado automaticamente após a confirmação do pagamento.
              </div>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {paymentInstructions ? 'Fechar' : 'Cancelar'}
          </Button>
          {!paymentInstructions && (
            <Button 
              onClick={handleSubmit} 
              disabled={!formValid || loading}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processando...
                </>
              ) : (
                'Finalizar Pagamento'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};