
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientDetail } from "./ClientDetail";
import { AddClientModal } from "./AddClientModal";

export const ClientsModule = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [clients] = useState([
    {
      id: 1,
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      status: "Ativo",
      plan: "Premium",
      onboardingProgress: 100,
      tags: ["VIP", "Mentor"],
      lastContact: "2024-01-15",
      revenue: 2500
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "(11) 88888-8888",
      status: "Lead",
      plan: "Básico",
      onboardingProgress: 60,
      tags: ["Quente"],
      lastContact: "2024-01-14",
      revenue: 0
    },
    {
      id: 3,
      name: "Pedro Costa",
      email: "pedro@email.com",
      phone: "(11) 77777-7777",
      status: "Inativo",
      plan: "Premium",
      onboardingProgress: 100,
      tags: ["Coaching"],
      lastContact: "2023-12-20",
      revenue: 5000
    }
  ]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-100 text-green-800";
      case "Lead": return "bg-blue-100 text-blue-800";
      case "Inativo": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (selectedClient) {
    return (
      <ClientDetail 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
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
          onClick={() => setShowAddModal(true)}
          className="bg-[#43B26D] hover:bg-[#37A05B]"
        >
          + Novo Cliente
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-[#43B26D] text-white">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                  <span className="text-sm text-gray-600">{client.plan}</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {client.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Onboarding</span>
                    <span>{client.onboardingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#43B26D] h-2 rounded-full"
                      style={{ width: `${client.onboardingProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    Último contato: {new Date(client.lastContact).toLocaleDateString('pt-BR')}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedClient(client)}
                  >
                    Ver mais
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddModal && (
        <AddClientModal 
          onClose={() => setShowAddModal(false)}
          onSave={(clientData) => {
            console.log("Novo cliente:", clientData);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};
