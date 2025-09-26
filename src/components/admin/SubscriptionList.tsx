import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionCard } from "./SubscriptionCard";
import { Loader2 } from "lucide-react";

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

interface SubscriptionListProps {
  searchTerm: string;
  statusFilter: string;
  planFilter: string;
}

export const SubscriptionList = ({ searchTerm, statusFilter, planFilter }: SubscriptionListProps) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('perfis')
        .select(`
          id,
          nome,
          sobrenome,
          email,
          subscription_status,
          subscription_plan,
          trial_start_date,
          trial_end_date,
          data_de_assinatura_ativa,
          data_de_expiracao_da_assinatura_ativa,
          ativo,
          empresas:empresa_id (
            nome
          ),
          assinaturas_cakto (
            status,
            data_de_ativacao,
            data_de_expiracao
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar assinaturas:', error);
        return;
      }

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch = 
      subscription.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscription.empresas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || subscription.subscription_status === statusFilter;
    const matchesPlan = planFilter === 'todos' || subscription.subscription_plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (filteredSubscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredSubscriptions.map((subscription) => (
        <SubscriptionCard 
          key={subscription.id} 
          subscription={subscription}
          onUpdate={fetchSubscriptions}
        />
      ))}
    </div>
  );
};