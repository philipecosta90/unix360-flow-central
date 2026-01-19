import { useState, useEffect, useMemo } from "react";
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
import { RenewPlanButton } from "./RenewPlanButton";
import { SetInactiveButton } from "./SetInactiveButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePlanExpirationAlerts } from "@/hooks/usePlanExpirationAlerts";
import { formatDateDisplay } from "@/utils/dateUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Plus, Search, CalendarDays, AlertTriangle, ChevronDown, ChevronUp, Users, UserPlus, Upload, MessageCircle } from "lucide-react";
import { ImportClientsDialog } from "./ImportClientsDialog";
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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const openWhatsApp = (telefone: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!telefone) {
      toast({
        title: "Telefone não cadastrado",
        description: "Este cliente não possui número de telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }
    
    // Remove caracteres não numéricos e adiciona código do país se necessário
    let phoneNumber = telefone.replace(/\D/g, '');
    
    // Se não começar com código do país (55 para Brasil), adiciona
    if (!phoneNumber.startsWith('55') && phoneNumber.length <= 11) {
      phoneNumber = '55' + phoneNumber;
    }
    
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

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
  // Métricas de clientes
  const clientesAtivos = useMemo(() => {
    return clients.filter(c => c.status === 'ativo').length;
  }, [clients]);

  const clientesNovosMes = useMemo(() => {
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();
    
    return clients.filter(c => {
      const dataCreated = new Date(c.created_at);
      return dataCreated.getMonth() === mesAtual && 
             dataCreated.getFullYear() === anoAtual;
    }).length;
  }, [clients]);

  // Função para calcular status efetivo (considera vencimento do plano)
  const getEffectiveStatus = (client: Cliente): string => {
    // Se status já é inativo, manter
    if (client.status === 'inativo') return 'inativo';
    
    // Se não tem data de fim de plano, usar status original
    if (!client.data_fim_plano) return client.status;
    
    // Verificar se plano venceu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(client.data_fim_plano);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate < today) {
      return 'vencido'; // Status visual, não salvo no banco
    }
    
    return client.status;
  };

  const filteredClients = clients.filter(client => {
    if (!client) return false;
    const matchesSearch = client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Para filtro "vencido", usar status efetivo
    if (statusFilter === "vencido") {
      return matchesSearch && getEffectiveStatus(client) === 'vencido';
    }
    
    const matchesStatus = statusFilter === "todos" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Definir prioridade de status (menor número = maior prioridade)
    const statusPriority: Record<string, number> = {
      'vencido': 0, // Vencido tem maior prioridade (mais urgente)
      'ativo': 1,
      'lead': 2,
      'prospecto': 3,
      'inativo': 4
    };
    
    const effectiveStatusA = getEffectiveStatus(a);
    const effectiveStatusB = getEffectiveStatus(b);
    const priorityA = statusPriority[effectiveStatusA] || 99;
    const priorityB = statusPriority[effectiveStatusB] || 99;
    
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
      case "vencido":
        return "bg-red-100 text-red-800";
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
      case "vencido":
        return "Vencido";
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
  const handleAddClient = async (clientData: any, options?: { enviarBoasVindas?: boolean }): Promise<{ id: string } | void> => {
    if (!clientData || !userProfile?.empresa_id) return;
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          ...clientData,
          empresa_id: userProfile.empresa_id
        }])
        .select('id')
        .single();
      if (error) throw error;
      toast({
        title: "Cliente adicionado!",
        description: `${clientData.nome} foi adicionado com sucesso.`
      });

      // Enviar WhatsApp ANTES de fechar o drawer
      if (options?.enviarBoasVindas && clientData.telefone) {
        try {
          console.log('📱 Enviando mensagem de boas-vindas via WhatsApp...');
          const { data: whatsappData, error: whatsappError } = await supabase.functions.invoke('whatsapp-send-welcome', {
            body: {
              clienteNome: clientData.nome,
              clienteTelefone: clientData.telefone,
            },
          });

          if (whatsappError) {
            console.warn("Erro ao enviar WhatsApp:", whatsappError);
            toast({
              title: "WhatsApp: não enviado",
              description: whatsappError.message || "Não foi possível enviar a mensagem de boas-vindas.",
              variant: "destructive",
            });
          } else if (whatsappData?.success) {
            toast({
              title: "Mensagem enviada!",
              description: "Boas-vindas enviada via WhatsApp.",
            });
          } else {
            const msg = whatsappData?.message || "Não foi possível enviar a mensagem de boas-vindas.";
            console.log("WhatsApp (falha):", whatsappData);
            toast({
              title: "WhatsApp: não enviado",
              description: msg,
              variant: "destructive",
            });
          }
        } catch (whatsappErr) {
          console.warn("Não foi possível enviar WhatsApp:", whatsappErr);
          toast({
            title: "WhatsApp: não enviado",
            description: "Falha inesperada ao enviar a mensagem de boas-vindas.",
            variant: "destructive",
          });
        }
      }

      // Criar etapas de onboarding automaticamente
      const ONBOARDING_STEPS = [
        { ordem: 1, titulo: "Boas-vindas", descricao: "Mensagem de boas-vindas enviada ao cliente", concluido: !!options?.enviarBoasVindas },
        { ordem: 2, titulo: "Anamnese enviada", descricao: "Questionário de anamnese enviado", concluido: false },
        { ordem: 3, titulo: "Anamnese preenchida", descricao: "Cliente preencheu a anamnese", concluido: false },
        { ordem: 4, titulo: "Planejamento criado", descricao: "Dieta e treino do cliente elaborados", concluido: false },
        { ordem: 5, titulo: "Protocolo enviado", descricao: "Dieta e treino enviados ao cliente", concluido: false },
      ];

      try {
        await supabase.from('cs_onboarding').insert(
          ONBOARDING_STEPS.map(step => ({
            empresa_id: userProfile.empresa_id,
            cliente_id: data.id,
            titulo: step.titulo,
            descricao: step.descricao,
            ordem: step.ordem,
            concluido: step.concluido,
            data_conclusao: step.concluido ? new Date().toISOString() : null,
          }))
        );
        console.log('✅ Etapas de onboarding criadas para cliente:', data.id);
      } catch (onboardingError) {
        console.warn('⚠️ Erro ao criar etapas de onboarding:', onboardingError);
      }

      fetchClients();
      setShowAddDrawer(false);
      return { id: data.id };
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
      console.log('💾 Atualizando cliente (payload):', { id: editingClient.id, ...clientData });

      const { data, error } = await supabase
        .from('clientes')
        .update(clientData)
        .eq('id', editingClient.id)
        .select('id, nome, data_inicio_plano, data_fim_plano')
        .single();

      if (error) throw error;

      toast({
        title: "Cliente atualizado!",
        description: `${data?.nome || clientData.nome} foi atualizado com sucesso.`
      });

      console.log('✅ Cliente atualizado (retorno):', data);

      fetchClients();
      setEditingClient(null);
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o cliente.",
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
  return <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-500">Clientes</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Gerencie sua base de clientes</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={() => setShowImportDialog(true)} className="text-xs sm:text-sm px-2 sm:px-4">
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button onClick={() => setShowAddDrawer(true)} className="bg-[#43B26D] hover:bg-[#37A05B] text-xs sm:text-sm px-2 sm:px-4">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Cliente</span>
          </Button>
        </div>
      </div>

      {/* Métricas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Clientes Ativos</p>
                <p className="text-3xl font-bold text-green-700">{clientesAtivos}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Users className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Novos este mês</p>
                <p className="text-3xl font-bold text-blue-700">{clientesNovosMes}</p>
                <p className="text-xs text-blue-500">
                  {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <UserPlus className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
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
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Buscar clientes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value || "")} className="pl-10 text-sm" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => openWhatsApp(client.telefone, e)}
                          className="h-9 w-9 p-0 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(getEffectiveStatus(client))}>
                            {getStatusLabel(getEffectiveStatus(client))}
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
                               Plano vence: {formatDateDisplay(client.data_fim_plano)}
                             </span>
                             {(() => {
                               const today = new Date();
                               const endDate = new Date(client.data_fim_plano);
                               const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                               if (diffDays < 0) {
                                 // Plano já venceu
                                 return (
                                   <Badge variant="destructive" className="ml-2">
                                     {Math.abs(diffDays)} dias atrás
                                   </Badge>
                                 );
                               } else if (diffDays <= 30) {
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

                          <div className="pt-2 border-t space-y-2">
                            <span className="text-sm text-muted-foreground block">
                              Criado em: {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'}
                            </span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              <RenewPlanButton
                                clientId={client.id}
                                clientName={client.nome}
                                onSuccess={fetchClients}
                              />
                              {getEffectiveStatus(client) === 'vencido' && (
                                <SetInactiveButton
                                  clientId={client.id}
                                  clientName={client.nome}
                                  onSuccess={fetchClients}
                                />
                              )}
                              <Button variant="ghost" size="sm" onClick={e => {
                                e.stopPropagation();
                                setEditingClient(client);
                              }}>
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" onClick={e => {
                                e.stopPropagation();
                                handleViewDetails(client);
                              }}>
                                Detalhes
                              </Button>
                              <Button variant="ghost" size="sm" onClick={async e => {
                                e.stopPropagation();
                                await handleDeleteClient(client.id, client.nome);
                              }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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

      {/* Drawers e Dialogs */}
      <AddClientDrawer open={showAddDrawer} onClose={() => setShowAddDrawer(false)} onSave={handleAddClient} />

      {editingClient && <EditClientDrawer open={!!editingClient} onClose={() => setEditingClient(null)} onSave={handleEditClient} client={editingClient} />}

      <ImportClientsDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog} 
        onSuccess={fetchClients} 
      />
    </div>;
};