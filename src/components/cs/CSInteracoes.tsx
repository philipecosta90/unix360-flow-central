
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, Calendar, MessageCircle, Activity } from "lucide-react";
import { toast } from "sonner";

interface CSInteracoesProps {
  selectedClient: string | null;
}

export const CSInteracoes = ({ selectedClient }: CSInteracoesProps) => {
  const { useClientInteracoes, useCSData, createInteracao } = useCustomerSuccess();
  const { data: csData } = useCSData();
  const { data: interacoes, isLoading } = useClientInteracoes(selectedClient || "");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInteracao, setNewInteracao] = useState({
    tipo: "",
    titulo: "",
    descricao: "",
    data_interacao: new Date().toISOString().split('T')[0]
  });

  const handleCreateInteracao = async () => {
    if (!selectedClient || !newInteracao.tipo || !newInteracao.titulo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createInteracao.mutateAsync({
        cliente_id: selectedClient,
        tipo: newInteracao.tipo,
        titulo: newInteracao.titulo,
        descricao: newInteracao.descricao,
        data_interacao: new Date(newInteracao.data_interacao).toISOString()
      });
      
      setNewInteracao({
        tipo: "",
        titulo: "",
        descricao: "",
        data_interacao: new Date().toISOString().split('T')[0]
      });
      setIsDialogOpen(false);
      toast.success("Interação registrada com sucesso!");
    } catch (error) {
      toast.error("Erro ao registrar interação");
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

  const selectedClientData = csData?.clientes?.find(c => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interações com Cliente</h2>
          {selectedClientData && (
            <p className="text-gray-600 mt-1">Cliente: {selectedClientData.nome}</p>
          )}
        </div>
        
        {selectedClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Interação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nova Interação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Interação *</Label>
                  <Select value={newInteracao.tipo} onValueChange={(value) => setNewInteracao({ ...newInteracao, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={newInteracao.titulo}
                    onChange={(e) => setNewInteracao({ ...newInteracao, titulo: e.target.value })}
                    placeholder="Ex: Follow-up semanal"
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={newInteracao.descricao}
                    onChange={(e) => setNewInteracao({ ...newInteracao, descricao: e.target.value })}
                    placeholder="Detalhes da interação..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="data">Data da Interação</Label>
                  <Input
                    id="data"
                    type="date"
                    value={newInteracao.data_interacao}
                    onChange={(e) => setNewInteracao({ ...newInteracao, data_interacao: e.target.value })}
                  />
                </div>
                
                <Button onClick={handleCreateInteracao} disabled={createInteracao.isPending}>
                  {createInteracao.isPending ? "Registrando..." : "Registrar Interação"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!selectedClient ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-center">
              Selecione um cliente na aba "Clientes" para visualizar e registrar interações
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Interações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p>Carregando interações...</p>
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
                  <p className="text-gray-500">Nenhuma interação registrada</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Clique em "Nova Interação" para começar
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
