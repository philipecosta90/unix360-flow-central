import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientDetail } from "./ClientDetail";
import { AddClientDrawer } from "./AddClientDrawer";
import { EditClientDrawer } from "./EditClientDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePlanExpirationAlerts } from "@/hooks/usePlanExpirationAlerts";
import { Loader2, Plus, Search, CalendarDays, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  status: 'ativo' | 'inativo' | 'lead' | 'prospecto';
  plano_contratado?: string;
  observacoes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  data_inicio_plano?: string;
  data_fim_plano?: string;
}
export const ClientsModule = () => {
  const {
    userProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const { expiringPlans } = usePlanExpirationAlerts();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [showAllExpiringPlans, setShowAllExpiringPlans] = useState(false);
  const fetchClients = async () => {
    if (!userProfile?.empresa_id) return;
    try {
      setLoading(true);
      console.log('🔍 Buscando clientes para empresa:', userProfile.empresa_id);
      const {
        data,
        error
      } = await supabase.from('clientes').select('*').eq('empresa_id', userProfile.empresa_id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      console.log('✅ Clientes carregados:', data?.length || 0);
      setClients(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClients();
  }, [userProfile?.empresa_id]);
  const filteredClients = clients.filter(client => {
    if (!client) return false;
    const matchesSearch = client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Definir prioridade de status (menor número = maior prioridade)
    const statusPriority: Record<string, number> = {
      'ativo': 1,
      'lead': 2,
      'prospecto': 3,
      'inativo': 4
    };
    
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;
    
    // Primeiro ordenar por prioridade de status
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Se mesma prioridade, ordenar alfabeticamente por nome
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800";
      case "lead":
        return "bg-blue-100 text-blue-800";
      case "prospecto":
        return "bg-yellow-100 text-yellow-800";
      case "inativo":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "lead":
        return "Lead";
      case "prospecto":
        return "Prospecto";
      case "inativo":
        return "Inativo";
      default:
        return status;
    }
  };
  const handleAddClient = async (clientData: any) => {
    if (!clientData || !userProfile?.empresa_id) return;
    try {
      const {
        error
      } = await supabase.from('clientes').insert([{
        ...clientData,
        empresa_id: userProfile.empresa_id
      }]);
      if (error) throw error;
      toast({
        title: "Cliente adicionado!",
        description: `${clientData.nome} foi adicionado com sucesso.`
      });
      fetchClients();
      setShowAddDrawer(false);
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente.",
        variant: "destructive"
      });
    }
  };
  const handleEditClient = async (clientData: any) => {
    if (!editingClient || !clientData) return;
    try {
      const {
        error
      } = await supabase.from('clientes').update(clientData).eq('id', editingClient.id);
      if (error) throw error;
      toast({
        title: "Cliente atualizado!",
        description: `${clientData.nome} foi atualizado com sucesso.`
      });
      fetchClients();
      setEditingClient(null);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${clientName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      console.log('🗑️ Excluindo cliente:', clientId, clientName);
      const {
        error
      } = await supabase.from('clientes').delete().eq('id', clientId);
      if (error) {
        console.error('❌ Erro do Supabase ao excluir cliente:', error);
        throw error;
      }
      console.log('✅ Cliente excluído com sucesso, atualizando lista...');
      toast({
        title: "Cliente removido",
        description: `${clientName} foi removido com sucesso.`
      });

      // Atualizar a lista imediatamente
      await fetchClients();
    } catch (error) {
      console.error('❌ Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive"
      });
    }
  };
  const handleViewDetails = (client: Cliente) => {
    if (!client) return;
    console.log('👁️ Visualizando detalhes do cliente:', client.nome);
    setSelectedClient(client);
  };

  // Se um cliente está selecionado, mostrar a tela de detalhes
  if (selectedClient) {
    return <ClientDetail client={selectedClient} onBack={() => {
      console.log('⬅️ Voltando da visualização de detalhes');
      setSelectedClient(null);
    }} />;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-500">Clientes</h1>
          <p className="text-gray-600 mt-2">Gerencie sua base de clientes</p>
        </div>
        <Button onClick={() => setShowAddDrawer(true)} className="bg-[#43B26D] hover:bg-[#37A05B]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Alertas de Vencimento */}
      {expiringPlans.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="font-medium mb-2">Planos próximos ao vencimento:</div>
            <div className="space-y-1">
              {(showAllExpiringPlans ? expiringPlans : expiringPlans.slice(0, 3)).map((plan) => (
                <div key={plan.clientId} className="text-sm">
                  • {plan.clientName} - {plan.daysUntilExpiration === 0 ? 'Vence hoje' : `${plan.daysUntilExpiration} dias`}
                </div>
              ))}
              {expiringPlans.length > 3 && (
                <button
                  onClick={() => setShowAllExpiringPlans(!showAllExpiringPlans)}
                  className="text-sm font-medium text-orange-700 hover:text-orange-900 flex items-center gap-1 mt-2 transition-colors"
                >
                  {showAllExpiringPlans ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      E mais {expiringPlans.length - 3} clientes...
                    </>
                  )}
                </button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Buscar clientes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value || "")} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospecto">Prospecto</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading ? <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#43B26D]" />
          <span className="ml-2 text-gray-600">Carregando clientes...</span>
        </div> : <>
          {/* Lista de Clientes */}
          {filteredClients.length === 0 ? <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "todos" ? "Nenhum cliente encontrado com os filtros aplicados." : "Nenhum cliente cadastrado ainda."}
                </p>
                <Button onClick={() => setShowAddDrawer(true)} className="bg-[#43B26D] hover:bg-[#37A05B]">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Cliente
                </Button>
              </CardContent>
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map(client => {
          if (!client || !client.id) return null;
          return <Card key={client.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-[#43B26D] text-white">
                            {client.nome ? client.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : 'CL'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{client.nome || 'Nome não informado'}</CardTitle>
                          {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(client.status)}>
                            {getStatusLabel(client.status)}
                          </Badge>
                          {client.plano_contratado && <span className="text-sm text-gray-600">{client.plano_contratado}</span>}
                        </div>
                        
                        {client.tags && Array.isArray(client.tags) && client.tags.length > 0 && <div className="flex flex-wrap gap-1">
                            {client.tags.map((tag, index) => <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>)}
                          </div>}

                         {client.data_fim_plano && (
                           <div className="flex items-center gap-2 text-sm">
                             <CalendarDays className="w-4 h-4 text-muted-foreground" />
                             <span className="text-muted-foreground">
                               Plano vence: {new Date(client.data_fim_plano).toLocaleDateString('pt-BR')}
                             </span>
                             {(() => {
                               const today = new Date();
                               const endDate = new Date(client.data_fim_plano);
                               const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                               if (diffDays <= 30 && diffDays >= 0) {
                                 return (
                                   <Badge variant={diffDays <= 7 ? "destructive" : "secondary"} className="ml-2">
                                     {diffDays === 0 ? "Vence hoje" : `${diffDays} dias`}
                                   </Badge>
                                 );
                               }
                               return null;
                             })()}
                           </div>
                         )}

                         <div className="flex items-center justify-between pt-2 border-t">
                           <span className="text-sm text-gray-600">
                             Criado em: {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'}
                           </span>
                           <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={e => {
                      e.stopPropagation();
                      console.log('✏️ Editando cliente:', client.nome);
                      setEditingClient(client);
                    }}>
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={e => {
                      e.stopPropagation();
                      console.log('👁️ Botão Ver detalhes clicado para:', client.nome);
                      handleViewDetails(client);
                    }}>
                              Ver detalhes
                            </Button>
                            <Button variant="ghost" size="sm" onClick={async e => {
                      e.stopPropagation();
                      await handleDeleteClient(client.id, client.nome);
                    }} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>;
        })}
            </div>}
        </>}

      {/* Drawers */}
      <AddClientDrawer open={showAddDrawer} onClose={() => setShowAddDrawer(false)} onSave={handleAddClient} />

      {editingClient && <EditClientDrawer open={!!editingClient} onClose={() => setEditingClient(null)} onSave={handleEditClient} client={editingClient} />}
    </div>;
};