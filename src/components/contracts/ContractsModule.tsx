import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractDetailDialog } from "./ContractDetailDialog";
import { AddContractDialog } from "./AddContractDialog";
import { EditContractDialog } from "./EditContractDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Eye, 
  Edit2, 
  Trash2,
  AlertCircle 
} from "lucide-react";

interface Contract {
  id: string;
  titulo: string;
  cliente_nome?: string;
  valor?: number;
  data_inicio: string;
  data_fim?: string;
  status: 'ativo' | 'inativo' | 'pendente' | 'cancelado';
  tipo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export const ContractsModule = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const fetchContracts = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contratos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os contratos.",
          variant: "destructive",
        });
        return;
      }

      // Convert Supabase data to Contract type with proper type assertion
      const contractsData: Contract[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'ativo' | 'inativo' | 'pendente' | 'cancelado'
      }));

      setContracts(contractsData);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contratos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [userProfile?.empresa_id]);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-100 text-green-800";
      case "pendente": return "bg-yellow-100 text-yellow-800";
      case "cancelado": return "bg-red-100 text-red-800";
      case "inativo": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo": return "Ativo";
      case "pendente": return "Pendente";
      case "cancelado": return "Cancelado";
      case "inativo": return "Inativo";
      default: return status;
    }
  };

  const handleAddContract = async (contractData: Omit<Contract, "id" | "created_at" | "updated_at">) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contratos')
        .insert({
          empresa_id: userProfile.empresa_id,
          titulo: contractData.titulo,
          cliente_nome: contractData.cliente_nome,
          valor: contractData.valor,
          data_inicio: contractData.data_inicio,
          data_fim: contractData.data_fim,
          status: contractData.status,
          tipo: contractData.tipo,
          observacoes: contractData.observacoes,
          created_by: userProfile.user_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar contrato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o contrato.",
          variant: "destructive",
        });
        return;
      }

      // Convert and add to state with proper type assertion
      const newContract: Contract = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | 'pendente' | 'cancelado'
      };

      setContracts(prev => [newContract, ...prev]);
      
      toast({
        title: "Contrato adicionado!",
        description: `${contractData.titulo} foi adicionado com sucesso.`,
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Erro ao adicionar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o contrato.",
        variant: "destructive",
      });
    }
  };

  const handleEditContract = async (contractData: Contract) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contratos')
        .update({
          titulo: contractData.titulo,
          cliente_nome: contractData.cliente_nome,
          valor: contractData.valor,
          data_inicio: contractData.data_inicio,
          data_fim: contractData.data_fim,
          status: contractData.status,
          tipo: contractData.tipo,
          observacoes: contractData.observacoes
        })
        .eq('id', contractData.id)
        .eq('empresa_id', userProfile.empresa_id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar contrato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o contrato.",
          variant: "destructive",
        });
        return;
      }

      // Convert and update state with proper type assertion
      const updatedContract: Contract = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | 'pendente' | 'cancelado'
      };

      setContracts(prev => 
        prev.map(c => c.id === contractData.id ? updatedContract : c)
      );
      
      toast({
        title: "Contrato atualizado!",
        description: `${contractData.titulo} foi atualizado com sucesso.`,
      });
      
      setShowEditDialog(false);
      setEditingContract(null);
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contrato.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', contractId)
        .eq('empresa_id', userProfile.empresa_id);

      if (error) {
        console.error('Erro ao excluir contrato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o contrato.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar a lista de contratos
      setContracts(prev => prev.filter(c => c.id !== contractId));
      
      toast({
        title: "Contrato excluído!",
        description: "O contrato foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus contratos e acordos</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-[#43B26D] hover:bg-[#37A05B]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar contratos..."
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
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
          <span className="ml-2 text-gray-600">Carregando contratos...</span>
        </div>
      ) : (
        <>
          {/* Lista de Contratos */}
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "todos" 
                    ? "Nenhum contrato encontrado com os filtros aplicados." 
                    : "Nenhum contrato cadastrado ainda."}
                </p>
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-[#43B26D] hover:bg-[#37A05B]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Contrato
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{contract.titulo}</CardTitle>
                        {contract.cliente_nome && (
                          <p className="text-sm text-gray-600 mt-1">{contract.cliente_nome}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(contract.status)}>
                        {getStatusLabel(contract.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Início:</span>
                        <span>{new Date(contract.data_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      {contract.data_fim && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Fim:</span>
                          <span>{new Date(contract.data_fim).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      
                      {contract.valor && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Valor:</span>
                          <span className="font-medium">
                            R$ {contract.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between pt-3 border-t">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedContract(contract)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingContract(contract);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteContract(contract.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      {selectedContract && (
        <ContractDetailDialog
          contract={selectedContract}
          open={!!selectedContract}
          onOpenChange={() => setSelectedContract(null)}
        />
      )}

      <AddContractDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddContract}
      />

      {editingContract && (
        <EditContractDialog
          contract={editingContract}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSubmit={handleEditContract}
        />
      )}
    </div>
  );
};
