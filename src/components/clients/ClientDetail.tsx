
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Calendar, Tag, Plus, MessageCircle, Activity, File } from "lucide-react";
import { InteractionDialog } from "./InteractionDialog";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { FinancialTransactionDialog } from "./FinancialTransactionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

interface ClientDetailProps {
  client: Cliente;
  onBack: () => void;
}

interface Interaction {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  data_interacao: string;
  created_at: string;
}

export const ClientDetail = ({ client, onBack }: ClientDetailProps) => {
  const { userProfile } = useAuth();
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [documents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchInteractions = async () => {
    if (!userProfile?.empresa_id) return;
    
    try {
      setLoadingInteractions(true);
      const { data, error } = await supabase
        .from('cs_interacoes')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('cliente_id', client.id)
        .order('data_interacao', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const fetchTransactions = async () => {
    if (!userProfile?.empresa_id) return;
    
    try {
      setLoadingTransactions(true);
      const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .ilike('descricao', `%${client.id}%`)
        .order('data', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
    fetchTransactions();
  }, [client.id, userProfile?.empresa_id]);

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

  const getInteractionIcon = (tipo: string) => {
    switch (tipo) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      case 'feedback': return MessageCircle;
      default: return Activity;
    }
  };

  const getInteractionColor = (tipo: string) => {
    switch (tipo) {
      case 'call': return 'text-blue-600 bg-blue-100';
      case 'email': return 'text-green-600 bg-green-100';
      case 'meeting': return 'text-purple-600 bg-purple-100';
      case 'feedback': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Cliente</h1>
        </div>
      </div>

      {/* Client Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-[#43B26D] text-white text-2xl">
                {client.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{client.nome}</h2>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                {client.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.telefone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{client.telefone}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className={getStatusColor(client.status)}>
                  {getStatusLabel(client.status)}
                </Badge>
                {client.plano_contratado && (
                  <Badge variant="outline">{client.plano_contratado}</Badge>
                )}
                {client.tags && client.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-sm text-gray-600">Cliente desde</p>
                <p className="font-medium">
                  {new Date(client.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {client.updated_at !== client.created_at && (
                <div>
                  <p className="text-sm text-gray-600">Última atualização</p>
                  <p className="font-medium">
                    {new Date(client.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Tabs */}
      <Tabs defaultValue="informacoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="interacoes">Histórico</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Dados Pessoais</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium">{client.nome}</span>
                    </div>
                    {client.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">E-mail:</span>
                        <span className="font-medium">{client.email}</span>
                      </div>
                    )}
                    {client.telefone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telefone:</span>
                        <span className="font-medium">{client.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Informações Comerciais</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(client.status)}>
                        {getStatusLabel(client.status)}
                      </Badge>
                    </div>
                    {client.plano_contratado && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plano:</span>
                        <span className="font-medium">{client.plano_contratado}</span>
                      </div>
                    )}
                    {client.tags && client.tags.length > 0 && (
                      <div>
                        <span className="text-gray-600">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {client.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {client.observacoes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Observações</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{client.observacoes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interacoes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Interações</CardTitle>
              <Button 
                onClick={() => setShowInteractionDialog(true)}
                className="bg-[#43B26D] hover:bg-[#37A05B]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Interação
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingInteractions ? (
                  <p>Carregando interações...</p>
                ) : interactions.length > 0 ? (
                  <div className="space-y-4">
                    {interactions.map((interacao) => {
                      const IconComponent = getInteractionIcon(interacao.tipo);
                      const colorClass = getInteractionColor(interacao.tipo);
                      
                      return (
                        <div key={interacao.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <div className={`p-2 rounded-full ${colorClass}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{interacao.titulo}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(interacao.data_interacao).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            {interacao.descricao && (
                              <p className="text-sm text-gray-600 mt-1">{interacao.descricao}</p>
                            )}
                            
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500 capitalize">
                                {interacao.tipo === 'call' ? 'Ligação' :
                                 interacao.tipo === 'email' ? 'E-mail' :
                                 interacao.tipo === 'meeting' ? 'Reunião' :
                                 interacao.tipo === 'feedback' ? 'Feedback' : 'Outro'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(interacao.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma interação registrada ainda</p>
                    <Button 
                      onClick={() => setShowInteractionDialog(true)}
                      className="bg-[#43B26D] hover:bg-[#37A05B]"
                    >
                      Registrar Interação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos</CardTitle>
              <Button 
                onClick={() => setShowDocumentDialog(true)}
                className="bg-[#43B26D] hover:bg-[#37A05B]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Documento
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <File className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum documento encontrado</p>
                  <Button 
                    onClick={() => setShowDocumentDialog(true)}
                    className="bg-[#43B26D] hover:bg-[#37A05B]"
                  >
                    Adicionar Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico Financeiro</CardTitle>
              <Button 
                onClick={() => setShowFinancialDialog(true)}
                className="bg-[#43B26D] hover:bg-[#37A05B]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Movimentação
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingTransactions ? (
                  <p>Carregando movimentações...</p>
                ) : transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{transaction.descricao}</h4>
                          <p className="text-sm text-gray-600">
                            {transaction.categoria} • {new Date(transaction.data).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.tipo === 'receita' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{transaction.tipo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Nenhuma movimentação financeira registrada</p>
                    <Button 
                      onClick={() => setShowFinancialDialog(true)}
                      className="bg-[#43B26D] hover:bg-[#37A05B]"
                    >
                      Adicionar Movimentação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InteractionDialog
        open={showInteractionDialog}
        onOpenChange={setShowInteractionDialog}
        clientId={client.id}
        onInteractionAdded={fetchInteractions}
      />

      <DocumentUploadDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        clientId={client.id}
        onDocumentAdded={() => {}}
      />

      <FinancialTransactionDialog
        open={showFinancialDialog}
        onOpenChange={setShowFinancialDialog}
        clientId={client.id}
        onTransactionAdded={fetchTransactions}
      />
    </div>
  );
};
