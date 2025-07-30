import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, DollarSign, Edit, Pause, XCircle, Trash2, RefreshCw } from "lucide-react";

type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

interface SubscriptionWithCompany {
  id: string;
  status: SubscriptionStatus;
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
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionWithCompany | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    if (diffDays <= 0) {
      return <Badge variant="destructive">Trial Expirado</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="secondary">{diffDays} dia{diffDays !== 1 ? 's' : ''} restante{diffDays !== 1 ? 's' : ''}</Badge>;
    } else {
      return <Badge variant="outline">{diffDays} dias restantes</Badge>;
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: SubscriptionStatus) => {
    setActionLoading(subscriptionId);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      await loadSubscriptions();
      toast({
        title: "Sucesso",
        description: `Assinatura ${newStatus === 'suspended' ? 'suspensa' : 
                     newStatus === 'active' ? 'reativada' : 
                     newStatus === 'cancelled' ? 'cancelada' : 'atualizada'} com sucesso.`
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da assinatura",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta assinatura? Esta ação não pode ser desfeita.')) {
      return;
    }

    setActionLoading(subscriptionId);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      await loadSubscriptions();
      toast({
        title: "Sucesso",
        description: "Assinatura excluída com sucesso."
      });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir assinatura",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (subscription: SubscriptionWithCompany) => {
    setEditingSubscription(subscription);
    setIsEditModalOpen(true);
  };

  const saveSubscriptionChanges = async () => {
    if (!editingSubscription) return;

    setActionLoading(editingSubscription.id);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: editingSubscription.status as SubscriptionStatus,
          monthly_value: editingSubscription.monthly_value,
          trial_end_date: editingSubscription.trial_end_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSubscription.id);

      if (error) throw error;

      await loadSubscriptions();
      setIsEditModalOpen(false);
      setEditingSubscription(null);
      toast({
        title: "Sucesso",
        description: "Assinatura atualizada com sucesso."
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar assinatura",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const checkExpiredTrials = async () => {
    setActionLoading('check-trials');
    try {
      // Invocar edge function para verificar trials expirados
      const { error } = await supabase.functions.invoke('check-expired-trials');
      
      if (error) throw error;

      await loadSubscriptions();
      toast({
        title: "Verificação concluída",
        description: "Trials expirados foram verificados e atualizados."
      });
    } catch (error) {
      console.error('Error checking expired trials:', error);
      toast({
        title: "Erro",
        description: "Falha ao verificar trials expirados",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
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
            <div className="text-2xl font-bold text-orange-600">{stats.suspended}</div>
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Gerenciar Assinaturas
            </div>
            <Button
              onClick={checkExpiredTrials}
              disabled={actionLoading === 'check-trials'}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading === 'check-trials' ? 'animate-spin' : ''}`} />
              Verificar Trials Expirados
            </Button>
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
                  <div className="space-y-1 flex-1">
                    <div className="font-medium">{subscription.empresas.nome}</div>
                    <div className="text-sm text-muted-foreground">{subscription.empresas.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Criada em: {new Date(subscription.trial_start_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-2">
                      <div className="flex gap-2">
                        {getStatusBadge(subscription.status)}
                        {getTrialStatus(subscription)}
                      </div>
                      <div className="text-sm font-medium">R$ {subscription.monthly_value.toFixed(2)}/mês</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(subscription)}
                        disabled={actionLoading === subscription.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {subscription.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubscriptionStatus(subscription.id, 'suspended')}
                          disabled={actionLoading === subscription.id}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {subscription.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubscriptionStatus(subscription.id, 'active')}
                          disabled={actionLoading === subscription.id}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(subscription.status === 'trial' || subscription.status === 'suspended') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubscriptionStatus(subscription.id, 'cancelled')}
                          disabled={actionLoading === subscription.id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSubscription(subscription.id)}
                        disabled={actionLoading === subscription.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Assinatura</DialogTitle>
          </DialogHeader>
          {editingSubscription && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  Empresa
                </Label>
                <Input
                  id="company"
                  value={editingSubscription.empresas.nome}
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={editingSubscription.status}
                  onValueChange={(value: SubscriptionStatus) => 
                    setEditingSubscription(prev => prev ? {...prev, status: value} : null)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Valor Mensal
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={editingSubscription.monthly_value}
                  onChange={(e) => 
                    setEditingSubscription(prev => prev ? 
                      {...prev, monthly_value: parseFloat(e.target.value) || 0} : null
                    )
                  }
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trialEnd" className="text-right">
                  Fim do Trial
                </Label>
                <Input
                  id="trialEnd"
                  type="datetime-local"
                  value={new Date(editingSubscription.trial_end_date).toISOString().slice(0, 16)}
                  onChange={(e) => 
                    setEditingSubscription(prev => prev ? 
                      {...prev, trial_end_date: new Date(e.target.value).toISOString()} : null
                    )
                  }
                  className="col-span-3"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={saveSubscriptionChanges}
                  disabled={actionLoading === editingSubscription.id}
                >
                  {actionLoading === editingSubscription.id ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};