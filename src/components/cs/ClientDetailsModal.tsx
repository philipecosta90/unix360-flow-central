
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mail, 
  Phone, 
  Calendar, 
  Tag, 
  Activity, 
  MessageCircle,
  User,
  Clock
} from "lucide-react";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";

interface ClientDetailsModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientDetailsModal = ({ clientId, isOpen, onClose }: ClientDetailsModalProps) => {
  const { useCSData, useClientInteracoes } = useCustomerSuccess();
  const { data: csData } = useCSData();
  const { data: interacoes, isLoading: loadingInteracoes } = useClientInteracoes(clientId || "");

  const client = csData?.clientes?.find(c => c.id === clientId);
  
  if (!client) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-[#43B26D] text-white">
                {client.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xl">{client.nome}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(client.status)}>
                  {getStatusLabel(client.status)}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="informacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="informacoes">Informações</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-gray-900">{client.nome}</p>
                  </div>
                  
                  {client.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">E-mail</label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{client.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {client.telefone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{client.telefone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(client.status)}>
                        {getStatusLabel(client.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  {client.plano_contratado && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Plano</label>
                      <p className="text-gray-900">{client.plano_contratado}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cliente desde</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {client.tags && client.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {client.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {client.observacoes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Observações</label>
                    <div className="bg-gray-50 p-3 rounded-lg mt-1">
                      <p className="text-gray-700 whitespace-pre-wrap">{client.observacoes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Histórico de Interações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInteracoes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#43B26D]"></div>
                  </div>
                ) : interacoes && interacoes.length > 0 ? (
                  <div className="space-y-4">
                    {interacoes.map((interacao) => {
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
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                {new Date(interacao.data_interacao).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            
                            {interacao.descricao && (
                              <p className="text-sm text-gray-600 mt-1">{interacao.descricao}</p>
                            )}
                            
                            <span className="text-xs text-gray-500 capitalize mt-2 inline-block">
                              {interacao.tipo === 'call' ? 'Ligação' :
                               interacao.tipo === 'email' ? 'E-mail' :
                               interacao.tipo === 'meeting' ? 'Reunião' :
                               interacao.tipo === 'feedback' ? 'Feedback' : 'Outro'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma interação registrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
