
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDetail } from "./ClientDetail";
import { AddClientDrawer } from "./AddClientDrawer";
import { EditClientDrawer } from "./EditClientDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search } from "lucide-react";

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
}

export const ClientsModule = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const fetchClients = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      setLoading(true);
      console.log('🔍 Buscando clientes para empresa:', userProfile.empresa_id);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('✅ Clientes carregados:', data?.length || 0);
      setClients(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [userProfile?.empresa_id]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-100 text-green-800";
      case "lead": return "bg-blue-100 text-blue-800";
      case "prospecto": return "bg-yellow-100 text-yellow-800";
      case "inativo": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo": return "Ativo";
      case "lead": return "Lead";
      case "prospecto": return "Prospecto";
      case "inativo": return "Inativo";
      default: return status;
    }
  };

  const handleAddClient = async (clientData: any) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .insert([{
          ...clientData,
          empresa_id: userProfile?.empresa_id,
        }]);

      if (error) throw error;

      toast({
        title: "Cliente adicionado!",
        description: `${clientData.nome} foi adicionado com sucesso.`,
      });
      
      fetchClients();
      setShowAddDrawer(false);
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (clientData: any) => {
    if (!editingClient) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .update(clientData)
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado!",
        description: `${clientData.nome} foi atualizado com sucesso.`,
      });
      
      fetchClients();
      setEditingClient(null);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (client: Cliente) => {
    console.log('👁️ Visualizando detalhes do cliente:', client.nome);
    setSelectedClient(client);
  };

  if (selectedClient) {
    return (
      <ClientDetail 
        client={selectedClient} 
        onBack={() => {
          console.log('⬅️ Voltando da visualização de detalhes');
          setSelectedClient(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-2">Gerencie sua base de clientes</p>
        </div>
        <Button 
          onClick={() => setShowAddDrawer(true)}
          className="bg-[#43B26D] hover:bg-[#37A05B]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#43B26D]" />
          <span className="ml-2 text-gray-600">Carregando clientes...</span>
        </div>
      ) : (
        <>
          {/* Lista de Clientes */}
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "todos" 
                    ? "Nenhum cliente encontrado com os filtros aplicados." 
                    : "Nenhum cliente cadastrado ainda."}
                </p>
                <Button 
                  onClick={() => setShowAddDrawer(true)}
                  className="bg-[#43B26D] hover:bg-[#37A05B]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-[#43B26D] text-white">
                          {client.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{client.nome}</CardTitle>
                        {client.email && (
                          <p className="text-sm text-gray-600">{client.email}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(client.status)}>
                          {getStatusLabel(client.status)}
                        </Badge>
                        {client.plano_contratado && (
                          <span className="text-sm text-gray-600">{client.plano_contratado}</span>
                        )}
                      </div>
                      
                      {client.tags && client.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {client.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">
                          Criado em: {new Date(client.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('✏️ Editando cliente:', client.nome);
                              setEditingClient(client);
                            }}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(client);
                            }}
                          >
                            Ver mais
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Drawers */}
      <AddClientDrawer 
        open={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        onSave={handleAddClient}
      />

      {editingClient && (
        <EditClientDrawer 
          open={!!editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleEditClient}
          client={editingClient}
        />
      )}
    </div>
  );
};
