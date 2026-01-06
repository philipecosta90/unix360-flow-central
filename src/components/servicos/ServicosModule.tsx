import { useState } from "react";
import { Plus, Package, Filter, BarChart3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServicos } from "@/hooks/useServicos";
import { ServicoCard } from "./ServicoCard";
import { AddServicoDialog } from "./AddServicoDialog";
import { EditServicoDialog } from "./EditServicoDialog";
import { ServicosReport } from "./ServicosReport";
import type { Servico } from "@/hooks/useServicos";

export const ServicosModule = () => {
  const { servicos, isLoading, deleteServico } = useServicos();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("ativos");

  const filteredServicos = servicos.filter(servico => {
    const matchesSearch = servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === "todos" || servico.tipo === filterTipo;
    
    const matchesStatus = filterStatus === "todos" || 
      (filterStatus === "ativos" && servico.ativo) ||
      (filterStatus === "inativos" && !servico.ativo);

    return matchesSearch && matchesTipo && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      await deleteServico.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Serviços
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus planos e serviços para facilitar os lançamentos financeiros
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatório de Vendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="avulso">Avulso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services Grid */}
          {filteredServicos.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                {servicos.length === 0 ? "Nenhum serviço cadastrado" : "Nenhum serviço encontrado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {servicos.length === 0 
                  ? "Crie seu primeiro serviço para facilitar os lançamentos"
                  : "Tente ajustar os filtros de busca"
                }
              </p>
              {servicos.length === 0 && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Serviço
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServicos.map((servico) => (
                <ServicoCard
                  key={servico.id}
                  servico={servico}
                  onEdit={() => setEditingServico(servico)}
                  onDelete={() => handleDelete(servico.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relatorio">
          <ServicosReport />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddServicoDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
      />
      
      {editingServico && (
        <EditServicoDialog
          open={!!editingServico}
          onOpenChange={(open) => !open && setEditingServico(null)}
          servico={editingServico}
        />
      )}
    </div>
  );
};
