import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

interface MetricsData {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  canceledSubscriptions: number;
  expiringSoon: number;
}

export const SubscriptionMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os perfis
      const { data: profiles, error } = await supabase
        .from('perfis')
        .select('subscription_status, trial_end_date, data_de_expiracao_da_assinatura_ativa');

      if (error) {
        console.error('Erro ao buscar métricas:', error);
        return;
      }

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const totalSubscriptions = profiles?.length || 0;
      const activeSubscriptions = profiles?.filter(p => p.subscription_status === 'active').length || 0;
      const trialSubscriptions = profiles?.filter(p => p.subscription_status === 'trial').length || 0;
      const expiredSubscriptions = profiles?.filter(p => p.subscription_status === 'expired').length || 0;
      const canceledSubscriptions = profiles?.filter(p => p.subscription_status === 'canceled').length || 0;

      // Calcular assinaturas que expiram em breve
      const expiringSoon = profiles?.filter(p => {
        const endDate = p.subscription_status === 'trial' 
          ? p.trial_end_date 
          : p.data_de_expiracao_da_assinatura_ativa;
        
        if (!endDate) return false;
        
        const expiryDate = new Date(endDate);
        return expiryDate > now && expiryDate <= sevenDaysFromNow;
      }).length || 0;

      setMetrics({
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        canceledSubscriptions,
        expiringSoon
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar métricas</p>
      </div>
    );
  }

  const conversionRate = metrics.totalSubscriptions > 0 
    ? ((metrics.activeSubscriptions / metrics.totalSubscriptions) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Assinaturas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalSubscriptions}</div>
          <p className="text-xs text-muted-foreground">Todas as assinaturas no sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{metrics.activeSubscriptions}</div>
          <p className="text-xs text-muted-foreground">
            {((metrics.activeSubscriptions / metrics.totalSubscriptions) * 100 || 0).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trials Ativos</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{metrics.trialSubscriptions}</div>
          <p className="text-xs text-muted-foreground">Usuários em período de teste</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expirando em Breve</CardTitle>
          <TrendingUp className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{metrics.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">Trial para ativo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inativos</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">
            {metrics.expiredSubscriptions + metrics.canceledSubscriptions}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.expiredSubscriptions} expirados, {metrics.canceledSubscriptions} cancelados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};