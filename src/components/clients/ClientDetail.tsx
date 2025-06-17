
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface ClientDetailProps {
  client: any;
  onBack: () => void;
}

export const ClientDetail = ({ client, onBack }: ClientDetailProps) => {
  const onboardingTasks = [
    { id: 1, task: "Dados pessoais coletados", completed: true },
    { id: 2, task: "Contrato assinado", completed: true },
    { id: 3, task: "Primeira reunião realizada", completed: true },
    { id: 4, task: "Plano de trabalho definido", completed: false },
    { id: 5, task: "Materiais entregues", completed: false }
  ];

  const interactions = [
    { date: "2024-01-15", type: "Email", description: "Follow-up mensal enviado", status: "Enviado" },
    { date: "2024-01-10", type: "Reunião", description: "Reunião de acompanhamento", status: "Concluído" },
    { date: "2024-01-05", type: "Whatsapp", description: "Lembrete de pagamento", status: "Lido" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Voltar
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
                {client.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
              <p className="text-gray-600">{client.email}</p>
              <p className="text-gray-600">{client.phone}</p>
              <div className="flex gap-2 mt-2">
                <Badge className={
                  client.status === "Ativo" ? "bg-green-100 text-green-800" :
                  client.status === "Lead" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }>
                  {client.status}
                </Badge>
                <Badge variant="outline">{client.plan}</Badge>
                {client.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-[#43B26D]">
                R$ {client.revenue.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Tabs */}
      <Tabs defaultValue="onboarding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="interactions">Interações</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding">
          <Card>
            <CardHeader>
              <CardTitle>Progresso do Onboarding</CardTitle>
              <Progress value={client.onboardingProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                {client.onboardingProgress}% concluído
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      task.completed ? 'bg-[#43B26D]' : 'bg-gray-300'
                    }`}></div>
                    <span className={task.completed ? 'text-gray-900' : 'text-gray-500'}>
                      {task.task}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Interações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.map((interaction, index) => (
                  <div key={index} className="border-l-4 border-[#43B26D] pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{interaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {interaction.type} • {new Date(interaction.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="outline">{interaction.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum documento encontrado</p>
                <Button className="mt-4 bg-[#43B26D] hover:bg-[#37A05B]">
                  Adicionar Documento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span>Plano Premium - Janeiro 2024</span>
                  <span className="text-[#43B26D] font-medium">R$ 2.500</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Consultoria adicional</span>
                  <span className="text-[#43B26D] font-medium">R$ 1.200</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
