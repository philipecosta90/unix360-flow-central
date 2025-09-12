import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreateSubscriptionDialog } from "./CreateSubscriptionDialog";
import { SubscriptionActionsDropdown } from "./SubscriptionActionsDropdown";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const AdminSubscriptionsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('subscriptions')
        .select(`
          id, status, monthly_value, trial_start_date, trial_end_date,
          current_period_start, current_period_end, 
          updated_at, created_at, empresa_id,
          empresas(nome, email)
        `)
        .order('updated_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search term if provided
      if (searchTerm) {
        return data?.filter(sub => 
          sub.empresas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.empresas?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];
      }

      return data || [];
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
      trial: { label: "Trial", variant: "secondary" },
      active: { label: "Ativo", variant: "default" },
      suspended: { label: "Suspenso", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" }
    };

    const config = statusMap[status] || { label: status, variant: "outline" as BadgeVariant };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysLeft = (endDate: string | null) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return <div className="p-4">Carregando assinaturas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinaturas do Sistema
          </div>
          <CreateSubscriptionDialog onSuccess={() => refetch()} />
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Buscar por empresa ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Dias Restantes</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.empresas?.nome || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.empresas?.email || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {subscription.status === 'trial' ? (
                        <>
                          <div>Trial até:</div>
                          <div>{formatDate(subscription.trial_end_date)}</div>
                        </>
                      ) : subscription.current_period_end ? (
                        <>
                          <div>Fim: {formatDate(subscription.current_period_end)}</div>
                        </>
                      ) : (
                        '-'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {subscription.status === 'trial' && subscription.trial_end_date ? (
                      <span className="text-sm">
                        {getDaysLeft(subscription.trial_end_date)} dias
                      </span>
                    ) : subscription.current_period_end ? (
                      <span className="text-sm">
                        {getDaysLeft(subscription.current_period_end)} dias
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      R$ {subscription.monthly_value.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(subscription.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/subscription?empresa_id=${subscription.empresa_id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <SubscriptionActionsDropdown 
                        subscription={subscription} 
                        onSuccess={() => refetch()} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!subscriptions || subscriptions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Nenhuma assinatura encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};