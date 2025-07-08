import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, DollarSign } from "lucide-react";

interface SubscriptionWithCompany {
  id: string;
  status: string;
  trial_start_date: string;
  trial_end_date: string;
  monthly_value: number;
  current_period_start: string | null;
  current_period_end: string | null;
  empresa_id: string;
  empresas: {
    nome: string;
    email: string;
  };
}

export const SubscriptionAdminView = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCompany[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [searchTerm, subscriptions]);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          empresas!inner (
            nome,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar assinaturas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    if (!searchTerm) {
      setFilteredSubscriptions(subscriptions);
      return;
    }

    const filtered = subscriptions.filter(sub =>
      sub.empresas.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.empresas.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubscriptions(filtered);
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

  const getTrialStatus = (subscription: SubscriptionWithCompany) => {
    if (subscription.status !== 'trial') return null;
    
    const now = new Date();
    const trialEnd = new Date(subscription.trial_end_date);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return <Badge variant="destructive">Trial Expirado</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="secondary">{diffDays} dias restantes</Badge>;
    } else {
      return <Badge variant="outline">{diffDays} dias restantes</Badge>;
    }
  };

  const getStats = () => {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active').length;
    const trial = subscriptions.filter(s => s.status === 'trial').length;
    const suspended = subscriptions.filter(s => s.status === 'suspended').length;
    const cancelled = subscriptions.filter(s => s.status === 'cancelled').length;
    const revenue = active * 75; // R$ 75 por assinatura ativa

    return { total, active, trial, suspended, cancelled, revenue };
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Ativas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.trial}</div>
            <div className="text-sm text-muted-foreground">Trial</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <div className="text-sm text-muted-foreground">Suspensas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
            <div className="text-sm text-muted-foreground">Canceladas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">R$ {stats.revenue}</div>
            <div className="text-sm text-muted-foreground">Receita/mês</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gerenciar Assinaturas
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {searchTerm ? "Nenhuma assinatura encontrada." : "Nenhuma assinatura cadastrada."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{subscription.empresas.nome}</div>
                    <div className="text-sm text-muted-foreground">{subscription.empresas.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Criada em: {new Date(subscription.trial_start_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex gap-2">
                      {getStatusBadge(subscription.status)}
                      {getTrialStatus(subscription)}
                    </div>
                    <div className="text-sm font-medium">R$ {subscription.monthly_value.toFixed(2)}/mês</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};