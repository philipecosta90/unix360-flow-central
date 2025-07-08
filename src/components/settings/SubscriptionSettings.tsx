import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";

export const SubscriptionSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Assinatura e Pagamento</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie sua assinatura, formas de pagamento e histórico de faturas.
        </p>
      </div>
      <SubscriptionManager />
    </div>
  );
};