import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Calendar, Building, User, Mail } from "lucide-react";
import { useState } from "react";
import { SubscriptionEditDialog } from "./SubscriptionEditDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionData {
  id: string;
  nome: string;
  sobrenome?: string;
  email: string;
  subscription_status: string;
  subscription_plan?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  data_de_assinatura_ativa?: string;
  data_de_expiracao_da_assinatura_ativa?: string;
  ativo: boolean;
  empresas?: {
    nome: string;
  };
  assinaturas_cakto?: {
    status: string;
    data_de_ativacao?: string;
    data_de_expiracao?: string;
  }[];
}

interface SubscriptionCardProps {
  subscription: SubscriptionData;
  onUpdate: () => void;
}

export const SubscriptionCard = ({ subscription, onUpdate }: SubscriptionCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'expired': return 'destructive';
      case 'canceled': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'trial': return 'Trial';
      case 'expired': return 'Expirado';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };

  const getPlanLabel = (plan?: string) => {
    switch (plan) {
      case 'free': return 'Gratuito';
      case 'basic': return 'Básico';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return plan || 'N/A';
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getDaysRemaining = () => {
    const endDate = subscription.subscription_status === 'trial' 
      ? subscription.trial_end_date
      : subscription.data_de_expiracao_da_assinatura_ativa;
    
    if (!endDate) return null;
    
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {subscription.nome} {subscription.sobrenome}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusBadgeVariant(subscription.subscription_status)}>
                {getStatusLabel(subscription.subscription_status)}
              </Badge>
              <Badge variant="outline">
                {getPlanLabel(subscription.subscription_plan)}
              </Badge>
              {!subscription.ativo && (
                <Badge variant="destructive">Usuário Inativo</Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>ID: {subscription.id.slice(0, 8)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{subscription.email}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{subscription.empresas?.nome || 'N/A'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {subscription.subscription_status === 'trial' ? 'Trial até' : 'Expira em'}: {' '}
                {formatDate(
                  subscription.subscription_status === 'trial' 
                    ? subscription.trial_end_date
                    : subscription.data_de_expiracao_da_assinatura_ativa
                )}
              </span>
            </div>
          </div>

          {daysRemaining !== null && (
            <div className="pt-2 border-t">
              <span className={`text-sm font-medium ${
                daysRemaining <= 3 ? 'text-destructive' : 
                daysRemaining <= 7 ? 'text-warning' : 'text-success'
              }`}>
                {daysRemaining > 0 
                  ? `${daysRemaining} dias restantes`
                  : `Expirou há ${Math.abs(daysRemaining)} dias`
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionEditDialog 
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        subscription={subscription}
        onUpdate={onUpdate}
      />
    </>
  );
};