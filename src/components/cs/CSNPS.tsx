
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface CSNPSProps {
  selectedClient: string | null;
}

export const CSNPS = ({ selectedClient }: CSNPSProps) => {
  const { useClientNPS, useCSData, createNPS } = useCustomerSuccess();
  const { data: csData } = useCSData();
  const { data: npsData, isLoading } = useClientNPS(selectedClient || "");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNPS, setNewNPS] = useState({
    nota: 0,
    comentario: ""
  });

  const handleCreateNPS = async () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }

    try {
      await createNPS.mutateAsync({
        cliente_id: selectedClient,
        nota: newNPS.nota,
        comentario: newNPS.comentario
      });
      
      setNewNPS({ nota: 0, comentario: "" });
      setIsDialogOpen(false);
      toast.success("NPS registrado com sucesso!");
    } catch (error) {
      toast.error("Erro ao registrar NPS");
    }
  };

  const getNPSCategory = (nota: number) => {
    if (nota >= 9) return { label: "Promotor", color: "text-green-600 bg-green-100", icon: TrendingUp };
    if (nota >= 7) return { label: "Neutro", color: "text-yellow-600 bg-yellow-100", icon: Minus };
    return { label: "Detrator", color: "text-red-600 bg-red-100", icon: TrendingDown };
  };

  const calculateNPSAverage = () => {
    if (!npsData || npsData.length === 0) return 0;
    return npsData.reduce((acc, curr) => acc + curr.nota, 0) / npsData.length;
  };

  const selectedClientData = csData?.clientes?.find(c => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Net Promoter Score (NPS)</h2>
          {selectedClientData && (
            <p className="text-gray-600 mt-1">Cliente: {selectedClientData.nome}</p>
          )}
        </div>
        
        {selectedClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo NPS
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nova Avaliação NPS</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nota (0-10) *</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    O quanto você recomendaria nossa empresa para um amigo ou colega?
                  </p>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewNPS({ ...newNPS, nota: num })}
                        className={`w-8 h-8 rounded-full border text-sm font-medium transition-colors ${
                          newNPS.nota === num
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {newNPS.nota > 0 && (
                    <div className="mt-2">
                      {(() => {
                        const category = getNPSCategory(newNPS.nota);
                        return (
                          <span className={`text-sm px-2 py-1 rounded-full ${category.color}`}>
                            {category.label}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="comentario">Comentário</Label>
                  <Textarea
                    id="comentario"
                    value={newNPS.comentario}
                    onChange={(e) => setNewNPS({ ...newNPS, comentario: e.target.value })}
                    placeholder="Comentários adicionais sobre a avaliação..."
                  />
                </div>
                
                <Button onClick={handleCreateNPS} disabled={createNPS.isPending || newNPS.nota === 0}>
                  {createNPS.isPending ? "Registrando..." : "Registrar NPS"}
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
              Selecione um cliente na aba "Clientes" para visualizar e registrar avaliações NPS
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumo NPS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Resumo NPS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {calculateNPSAverage().toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-500">Média Geral</p>
                </div>
                
                {npsData && npsData.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total de Avaliações:</span>
                      <span className="font-medium">{npsData.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Promotores:</span>
                      <span className="font-medium text-green-600">
                        {npsData.filter(n => n.nota >= 9).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Neutros:</span>
                      <span className="font-medium text-yellow-600">
                        {npsData.filter(n => n.nota >= 7 && n.nota <= 8).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Detratores:</span>
                      <span className="font-medium text-red-600">
                        {npsData.filter(n => n.nota <= 6).length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico NPS */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Histórico de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <p>Carregando avaliações...</p>
                ) : npsData && npsData.length > 0 ? (
                  npsData.map((nps) => {
                    const category = getNPSCategory(nps.nota);
                    const CategoryIcon = category.icon;
                    
                    return (
                      <div key={nps.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className={`p-2 rounded-full ${category.color}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-900">{nps.nota}</span>
                              <span className={`text-sm px-2 py-1 rounded-full ${category.color}`}>
                                {category.label}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(nps.data_resposta).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          {nps.comentario && (
                            <p className="text-sm text-gray-600 mt-2">{nps.comentario}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma avaliação NPS registrada</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Clique em "Novo NPS" para começar
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
