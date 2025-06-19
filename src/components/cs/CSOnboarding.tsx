
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface CSOnboardingProps {
  selectedClient: string | null;
}

export const CSOnboarding = ({ selectedClient }: CSOnboardingProps) => {
  const { useClientOnboarding, useCSData, createOnboardingStep, updateOnboardingStep } = useCustomerSuccess();
  const { data: csData } = useCSData();
  const { data: onboardingSteps, isLoading } = useClientOnboarding(selectedClient || "");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStep, setNewStep] = useState({
    titulo: "",
    descricao: "",
    ordem: 1
  });

  const handleCreateStep = async () => {
    if (!selectedClient || !newStep.titulo) {
      toast.error("Selecione um cliente e preencha o título");
      return;
    }

    try {
      await createOnboardingStep.mutateAsync({
        cliente_id: selectedClient,
        titulo: newStep.titulo,
        descricao: newStep.descricao,
        ordem: newStep.ordem
      });
      
      setNewStep({ titulo: "", descricao: "", ordem: 1 });
      setIsDialogOpen(false);
      toast.success("Passo de onboarding criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar passo de onboarding");
    }
  };

  const handleToggleStep = async (stepId: string, concluido: boolean) => {
    try {
      await updateOnboardingStep.mutateAsync({
        id: stepId,
        concluido,
        data_conclusao: concluido ? new Date().toISOString() : null
      });
      
      toast.success(concluido ? "Passo concluído!" : "Passo marcado como pendente");
    } catch (error) {
      toast.error("Erro ao atualizar passo");
    }
  };

  const selectedClientData = csData?.clientes?.find(c => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Onboarding do Cliente</h2>
          {selectedClientData && (
            <p className="text-gray-600 mt-1">Cliente: {selectedClientData.nome}</p>
          )}
        </div>
        
        {selectedClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Passo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Passo do Onboarding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={newStep.titulo}
                    onChange={(e) => setNewStep({ ...newStep, titulo: e.target.value })}
                    placeholder="Ex: Configurar acesso ao sistema"
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={newStep.descricao}
                    onChange={(e) => setNewStep({ ...newStep, descricao: e.target.value })}
                    placeholder="Detalhes do passo..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    min="1"
                    value={newStep.ordem}
                    onChange={(e) => setNewStep({ ...newStep, ordem: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <Button onClick={handleCreateStep} disabled={createOnboardingStep.isPending}>
                  {createOnboardingStep.isPending ? "Criando..." : "Criar Passo"}
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
              Selecione um cliente na aba "Clientes" para visualizar e gerenciar o onboarding
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Progresso do Onboarding</CardTitle>
            {onboardingSteps && onboardingSteps.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${(onboardingSteps.filter(s => s.concluido).length / onboardingSteps.length) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {onboardingSteps.filter(s => s.concluido).length} / {onboardingSteps.length}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p>Carregando passos do onboarding...</p>
              ) : onboardingSteps && onboardingSteps.length > 0 ? (
                onboardingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-start space-x-4 p-4 border rounded-lg ${
                      step.concluido ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={step.concluido}
                      onCheckedChange={(checked) => handleToggleStep(step.id, !!checked)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {step.concluido ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <h4 className={`font-medium ${step.concluido ? 'text-green-800' : 'text-gray-900'}`}>
                          {step.titulo}
                        </h4>
                      </div>
                      
                      {step.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{step.descricao}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Ordem: {step.ordem}</span>
                        {step.data_conclusao && (
                          <span>
                            Concluído em: {new Date(step.data_conclusao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum passo de onboarding configurado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Clique em "Novo Passo" para começar
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
