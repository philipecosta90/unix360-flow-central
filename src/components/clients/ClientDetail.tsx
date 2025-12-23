import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Calendar, Tag, Plus, MessageCircle, Activity, File, Download, Eye, Edit, Trash2, CheckCircle2, ClipboardList, RefreshCw } from "lucide-react";
import { AnamneseClienteTab } from "@/components/anamnese/AnamneseClienteTab";
import { RenewalTimeline } from "./RenewalTimeline";
import { InteractionDialog } from "./InteractionDialog";
import { EditInteractionDialog } from "./EditInteractionDialog";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { FinancialTransactionDialog } from "./FinancialTransactionDialog";
import { EditTransactionDialog } from "@/components/financial/EditTransactionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";

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

interface ClientDocument {
  id: string;
  nome: string;
  tipo_arquivo: string;
  tamanho: number;
  url_arquivo?: string;
  created_at: string;
}

export const ClientDetail = ({ client, onBack }: ClientDetailProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { deleteTransaction, updateTransaction } = useFinancialTransactions();
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [showEditInteractionDialog, setShowEditInteractionDialog] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [showEditTransactionDialog, setShowEditTransactionDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
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

  const fetchDocuments = async () => {
    if (!userProfile?.empresa_id) return;
    
    try {
      setLoadingDocuments(true);
      // Busca direta na tabela cliente_documentos
      const { data, error } = await supabase
        .from('cliente_documentos')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar documentos:', error);
        setDocuments([]);
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
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
        .eq('cliente_id', client.id)
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
    fetchDocuments();
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    // Por enquanto, usando um ícone genérico. Pode ser expandido para diferentes tipos
    return File;
  };

  const handlePreviewDocument = (doc: ClientDocument) => {
    if (!doc.url_arquivo) {
      toast({
        title: "Erro",
        description: "URL do documento não encontrada.",
        variant: "destructive",
      });
      return;
    }

    const extension = doc.nome.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      // Para imagens, abrir em nova aba com a imagem
      window.open(doc.url_arquivo, '_blank');
    } else if (extension === 'pdf') {
      // Para PDFs, abrir em nova aba
      window.open(doc.url_arquivo, '_blank');
    } else {
      // Para outros tipos, fazer download direto
      handleDownloadDocument(doc);
    }
  };

  const handleDownloadDocument = async (doc: ClientDocument) => {
    if (!doc.url_arquivo) {
      toast({
        title: "Erro",
        description: "URL do documento não encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Obter o arquivo do Storage do Supabase
      const filePath = doc.url_arquivo.split('/client-documents/')[1];
      if (!filePath) {
        throw new Error('Caminho do arquivo inválido');
      }

      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Criar blob e fazer download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: `Download de ${doc.nome} foi iniciado.`,
      });
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível fazer o download do documento.",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowEditTransactionDialog(true);
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setShowEditInteractionDialog(true);
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta interação?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cs_interacoes')
        .delete()
        .eq('id', interactionId);

      if (error) throw error;

      toast({
        title: "Interação excluída",
        description: "A interação foi excluída com sucesso.",
      });
      fetchInteractions();
    } catch (error) {
      console.error('Erro ao excluir interação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a interação.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta movimentação?")) {
      return;
    }

    try {
      await deleteTransaction.mutateAsync(transactionId);
      toast({
        title: "Movimentação excluída",
        description: "A movimentação foi excluída com sucesso.",
      });
      fetchTransactions(); // Refresh the transactions list
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a movimentação.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (transaction: any) => {
    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        tipo: transaction.tipo,
        descricao: transaction.descricao,
        valor: transaction.valor,
        categoria: transaction.categoria,
        data: transaction.data,
        a_receber: false,
        recorrente: transaction.recorrente ?? false,
        cliente_id: transaction.cliente_id,
      });
      toast({
        title: "Transação atualizada",
        description: "Transação marcada como recebida.",
      });
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao marcar como recebido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a transação.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <Button variant="outline" onClick={onBack} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Detalhes do Cliente</h1>
        </div>
      </div>

      {/* Client Header */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex-shrink-0">
                <AvatarFallback className="bg-[#43B26D] text-white text-sm sm:text-lg lg:text-2xl">
                  {client.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{client.nome}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-muted-foreground">
                  {client.email && (
                    <div className="flex items-center gap-1 min-w-0">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{client.email}</span>
                    </div>
                  )}
                  {client.telefone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{client.telefone}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
                  <Badge className={`${getStatusColor(client.status)} text-xs`}>
                    {getStatusLabel(client.status)}
                  </Badge>
                  {client.plano_contratado && (
                    <Badge variant="outline" className="text-xs">{client.plano_contratado}</Badge>
                  )}
                  {client.tags && client.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right space-y-2 w-full sm:w-auto flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Cliente desde</p>
                <p className="font-medium text-sm sm:text-base text-foreground">
                  {new Date(client.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {client.updated_at !== client.created_at && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">
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
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          <TabsTrigger value="informacoes" className="text-xs sm:text-sm py-2">
            <span className="hidden xs:inline">Informações</span>
            <span className="xs:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="renovacoes" className="text-xs sm:text-sm py-2">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
            <span className="hidden sm:inline">Plano</span>
          </TabsTrigger>
          <TabsTrigger value="interacoes" className="text-xs sm:text-sm py-2">
            <span className="hidden xs:inline">Histórico</span>
            <span className="xs:hidden">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs sm:text-sm py-2">
            <span className="hidden xs:inline">Documentos</span>
            <span className="xs:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="text-xs sm:text-sm py-2">
            <span className="hidden xs:inline">Financeiro</span>
            <span className="xs:hidden">$$</span>
          </TabsTrigger>
          <TabsTrigger value="anamnese" className="text-xs sm:text-sm py-2">
            <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
            <span className="hidden sm:inline">Anamnese</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg text-foreground">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Dados Pessoais</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-muted-foreground text-sm font-medium">Nome:</span>
                      <span className="font-medium text-sm break-words text-foreground">{client.nome}</span>
                    </div>
                    {client.email && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-muted-foreground text-sm font-medium">E-mail:</span>
                        <span className="font-medium text-sm break-all text-foreground">{client.email}</span>
                      </div>
                    )}
                    {client.telefone && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-muted-foreground text-sm font-medium">Telefone:</span>
                        <span className="font-medium text-sm text-foreground">{client.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Informações Comerciais</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-muted-foreground text-sm font-medium">Status:</span>
                      <Badge className={`${getStatusColor(client.status)} text-xs w-fit`}>
                        {getStatusLabel(client.status)}
                      </Badge>
                    </div>
                    {client.plano_contratado && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-muted-foreground text-sm font-medium">Plano:</span>
                        <span className="font-medium text-sm text-foreground">{client.plano_contratado}</span>
                      </div>
                    )}
                    {client.tags && client.tags.length > 0 && (
                      <div>
                        <span className="text-muted-foreground text-sm font-medium block mb-2">Tags:</span>
                        <div className="flex flex-wrap gap-1">
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
                  <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Observações</h4>
                  <div className="bg-muted p-3 sm:p-4 rounded-lg">
                    <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">{client.observacoes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renovacoes">
          <RenewalTimeline clientId={client.id} />
        </TabsContent>

        <TabsContent value="interacoes">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg text-foreground">Histórico de Interações</CardTitle>
              <Button 
                onClick={() => setShowInteractionDialog(true)}
                className="bg-[#43B26D] hover:bg-[#37A05B] text-sm px-3 py-2 w-fit"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Registrar Interação</span>
                <span className="xs:hidden">Nova Interação</span>
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
                          <div key={interacao.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                            <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                              <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2">
                                 <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{interacao.titulo}</h4>
                                 <div className="flex items-center gap-2">
                                   <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                                     {new Date(interacao.data_interacao).toLocaleDateString('pt-BR')}
                                   </span>
                                   <div className="flex gap-1">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => handleEditInteraction(interacao)}
                                       className="h-6 w-6 p-0 hover:bg-blue-100"
                                     >
                                       <Edit className="h-3 w-3 text-blue-600" />
                                     </Button>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => handleDeleteInteraction(interacao.id)}
                                       className="h-6 w-6 p-0 hover:bg-red-100"
                                     >
                                       <Trash2 className="h-3 w-3 text-red-600" />
                                     </Button>
                                   </div>
                                 </div>
                               </div>
                               
                               {interacao.descricao && (
                                 <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed break-words">{interacao.descricao}</p>
                               )}
                               
                               <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 mt-2">
                                 <span className="text-xs text-muted-foreground capitalize">
                                   {interacao.tipo === 'call' ? 'Ligação' :
                                    interacao.tipo === 'email' ? 'E-mail' :
                                    interacao.tipo === 'meeting' ? 'Reunião' :
                                    interacao.tipo === 'feedback' ? 'Feedback' : 'Outro'}
                                 </span>
                                 <span className="text-xs text-muted-foreground/70">
                                   {new Date(interacao.created_at).toLocaleString('pt-BR')}
                                 </span>
                              </div>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                 ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                      <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">Nenhuma interação registrada ainda</p>
                     <Button 
                       onClick={() => setShowInteractionDialog(true)}
                       className="bg-[#43B26D] hover:bg-[#37A05B] text-sm px-4 py-2"
                       size="sm"
                     >
                       <span className="hidden xs:inline">Registrar Interação</span>
                       <span className="xs:hidden">Nova Interação</span>
                     </Button>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg text-foreground">Documentos</CardTitle>
              <Button 
                onClick={() => setShowDocumentDialog(true)}
                className="bg-[#43B26D] hover:bg-[#37A05B] text-sm px-3 py-2 w-fit"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Adicionar Documento</span>
                <span className="xs:hidden">Adicionar</span>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <p>Carregando documentos...</p>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const FileIcon = getFileIcon(doc.nome);
                     return (
                        <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{doc.nome}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                {doc.tipo_arquivo} • {formatFileSize(doc.tamanho)} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                         <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handlePreviewDocument(doc)}
                             className="text-blue-600 hover:text-blue-800 flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                           >
                             <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                             <span className="hidden xs:inline">Visualizar</span>
                             <span className="xs:hidden">Ver</span>
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleDownloadDocument(doc)}
                             className="text-green-600 hover:text-green-800 flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                           >
                             <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                             <span className="hidden xs:inline">Download</span>
                             <span className="xs:hidden">Baixar</span>
                           </Button>
                         </div>
                       </div>
                     );
                  })}
                </div>
               ) : (
                  <div className="text-center py-6 sm:py-8">
                    <File className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">Nenhum documento encontrado</p>
                   <Button 
                     onClick={() => setShowDocumentDialog(true)}
                     className="bg-[#43B26D] hover:bg-[#37A05B] text-sm px-4 py-2"
                     size="sm"
                   >
                     <span className="hidden xs:inline">Adicionar Documento</span>
                     <span className="xs:hidden">Adicionar</span>
                   </Button>
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg text-foreground">Histórico Financeiro</CardTitle>
              <Button 
                onClick={() => setShowFinancialDialog(true)}
                className="bg-[#43B26D] hover:bg-[#37A05B] text-sm px-3 py-2 w-fit"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Adicionar Movimentação</span>
                <span className="xs:hidden">Adicionar</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingTransactions ? (
                  <p>Carregando movimentações...</p>
                ) : transactions.length > 0 ? (
                  <div className="space-y-4">
                     {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{transaction.descricao}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              {transaction.categoria} • {new Date(transaction.data).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="text-left sm:text-right flex-shrink-0">
                              <p className={`font-medium text-sm sm:text-base ${transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.tipo === 'entrada' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">{transaction.tipo === 'entrada' ? 'Receita' : 'Despesa'}</p>
                            </div>
                            <div className="flex gap-1">
                              {transaction.tipo === 'entrada' && transaction.a_receber && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(transaction)}
                                  className="h-8 w-8 p-0 hover:bg-green-100"
                                  title="Marcar como recebido"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTransaction(transaction)}
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                     ))}
                  </div>
                 ) : (
                    <div className="text-center py-6 sm:py-8">
                      <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">Nenhuma movimentação financeira registrada</p>
                     <Button 
                       onClick={() => setShowFinancialDialog(true)}
                       className="bg-[#43B26D] hover:bg-[#37A05B] text-sm px-4 py-2"
                       size="sm"
                     >
                       <span className="hidden xs:inline">Adicionar Movimentação</span>
                       <span className="xs:hidden">Adicionar</span>
                     </Button>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="anamnese">
          <AnamneseClienteTab
            clienteId={client.id}
            clienteNome={client.nome}
            clienteEmail={client.email}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InteractionDialog
        open={showInteractionDialog}
        onOpenChange={setShowInteractionDialog}
        clientId={client.id}
        onInteractionAdded={fetchInteractions}
      />

      <EditInteractionDialog
        open={showEditInteractionDialog}
        onOpenChange={setShowEditInteractionDialog}
        interaction={selectedInteraction}
        onInteractionUpdated={fetchInteractions}
      />

      <DocumentUploadDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        clientId={client.id}
        onDocumentAdded={fetchDocuments}
      />

      <FinancialTransactionDialog
        open={showFinancialDialog}
        onOpenChange={setShowFinancialDialog}
        clientId={client.id}
        onTransactionAdded={fetchTransactions}
      />

      {showEditTransactionDialog && selectedTransaction && (
        <EditTransactionDialog
          key={selectedTransaction.id}
          open={showEditTransactionDialog}
          onOpenChange={(open) => {
            setShowEditTransactionDialog(open);
            if (!open) setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onTransactionUpdated={fetchTransactions}
        />
      )}
    </div>
  );
};
