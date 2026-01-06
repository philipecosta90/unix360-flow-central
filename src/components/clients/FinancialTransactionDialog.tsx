import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useServicos } from "@/hooks/useServicos";
import { toLocalISODate } from "@/utils/dateUtils";
import { Package } from "lucide-react";

interface FinancialTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onTransactionAdded: () => void;
}

export const FinancialTransactionDialog = ({ open, onOpenChange, clientId, onTransactionAdded }: FinancialTransactionDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { servicosAtivos } = useServicos();
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState<string>("");
  const [formData, setFormData] = useState({
    tipo: "",
    categoria: "",
    descricao: "",
    valor: "",
    data: toLocalISODate(),
    aReceber: false,
    recorrente: false,
    servico_id: "none"
  });

  // Buscar nome do cliente quando o dialog abrir
  useEffect(() => {
    const fetchClientName = async () => {
      if (!open || !clientId || !userProfile?.empresa_id) return;
      
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('nome')
          .eq('id', clientId)
          .eq('empresa_id', userProfile.empresa_id)
          .single();

        if (error) throw error;
        if (data) {
          setClientName(data.nome);
        }
      } catch (error) {
        console.error('Erro ao buscar nome do cliente:', error);
      }
    };

    fetchClientName();
  }, [open, clientId, userProfile?.empresa_id]);

  const handleServicoChange = (servicoId: string) => {
    if (servicoId === 'none') {
      setFormData(prev => ({ ...prev, servico_id: 'none' }));
      return;
    }

    const servico = servicosAtivos.find(s => s.id === servicoId);
    if (servico) {
      setFormData(prev => ({
        ...prev,
        servico_id: servicoId,
        descricao: servico.nome,
        valor: servico.valor.toString(),
        categoria: servico.categoria.toLowerCase(),
        tipo: 'receita',
        recorrente: servico.tipo !== 'avulso',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.empresa_id || !formData.tipo || !formData.categoria || !formData.descricao || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Usar os valores corretos para o tipo conforme o check constraint do banco
      const tipoCorreto = formData.tipo === "receita" ? "entrada" : "saida";
      
      // Incluir o nome do cliente na descrição se disponível
      const descricaoCompleta = clientName 
        ? `${formData.descricao} - Cliente: ${clientName}`
        : formData.descricao;
      
       const { error } = await supabase
         .from('financeiro_lancamentos')
         .insert([{
           empresa_id: userProfile.empresa_id,
           tipo: tipoCorreto,
           categoria: formData.categoria,
           descricao: descricaoCompleta,
           valor: parseFloat(formData.valor),
           data: formData.data,
           a_receber: formData.aReceber,
           recorrente: formData.recorrente,
           created_by: userProfile.id,
           cliente_id: clientId,
           servico_id: formData.servico_id !== 'none' ? formData.servico_id : null
         }]);

      if (error) {
        console.error('Erro ao registrar movimentação:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Movimentação financeira registrada com sucesso!",
      });

      setFormData({
        tipo: "",
        categoria: "",
        descricao: "",
        valor: "",
        data: toLocalISODate(),
        aReceber: false,
        recorrente: false,
        servico_id: "none"
      });
      onOpenChange(false);
      onTransactionAdded();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a movimentação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Movimentação Financeira</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Serviço */}
          {servicosAtivos.length > 0 && (
            <div>
              <Label htmlFor="servico" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Serviço (Opcional)
              </Label>
              <Select value={formData.servico_id} onValueChange={handleServicoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (preenchimento manual)</SelectItem>
                  {servicosAtivos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id}>
                      {servico.nome} - R$ {servico.valor.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Ao selecionar um serviço, os campos serão preenchidos automaticamente
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serviços">Serviços</SelectItem>
                <SelectItem value="produtos">Produtos</SelectItem>
                <SelectItem value="consultoria">Consultoria</SelectItem>
                <SelectItem value="aulas">Aulas</SelectItem>
                <SelectItem value="eventos">Eventos</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da movimentação"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0,00"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="a-receber" className="text-sm font-medium">
                A receber
              </Label>
              <Switch
                id="a-receber"
                checked={formData.aReceber}
                onCheckedChange={(checked) => setFormData({ ...formData, aReceber: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="recorrente" className="text-sm font-medium">
                Recorrente mensal
              </Label>
              <Switch
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked })}
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? "Registrando..." : "Registrar Movimentação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
