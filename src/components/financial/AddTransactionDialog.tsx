import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { useClients } from "@/hooks/useClients";
import { useServicos } from "@/hooks/useServicos";
import { toast } from "sonner";
import { toLocalISODate } from "@/utils/dateUtils";
import { Package, CreditCard } from "lucide-react";
import { addMonths, parseISO, format } from "date-fns";

interface ParcelaEditavel {
  numero: number;
  valor: string;
  dataISO: string;
  aReceber: boolean;
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTransactionDialog = ({ open, onOpenChange }: AddTransactionDialogProps) => {
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [numeroParcelas, setNumeroParcelas] = useState<number>(3);
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    valor: '',
    categoria: '',
    data: toLocalISODate(),
    a_receber: false,
    recorrente: false,
    cliente_id: 'none',
    servico_id: 'none',
  });

  const { createTransaction } = useFinancialTransactions();
  const { data: clientes = [] } = useClients();
  const { servicosAtivos } = useServicos();

  const [parcelasEditaveis, setParcelasEditaveis] = useState<ParcelaEditavel[]>([]);

  // Inicializar parcelas quando mudar forma de pagamento, valor, data ou número de parcelas
  useEffect(() => {
    if (formaPagamento !== "pix_parcelado" || !formData.valor || !formData.data) {
      setParcelasEditaveis([]);
      return;
    }
    
    const valorTotal = parseFloat(formData.valor);
    if (isNaN(valorTotal) || valorTotal <= 0) {
      setParcelasEditaveis([]);
      return;
    }
    
    const valorParcela = Math.floor((valorTotal / numeroParcelas) * 100) / 100;
    const valorUltimaParcela = Math.round((valorTotal - (valorParcela * (numeroParcelas - 1))) * 100) / 100;
    
    const novasParcelas = Array.from({ length: numeroParcelas }, (_, i) => {
      const dataParcela = addMonths(parseISO(formData.data), i);
      const isPrimeiraParcela = i === 0;
      const isUltimaParcela = i === numeroParcelas - 1;
      
      return {
        numero: i + 1,
        valor: (isUltimaParcela ? valorUltimaParcela : valorParcela).toFixed(2),
        dataISO: format(dataParcela, "yyyy-MM-dd"),
        aReceber: isPrimeiraParcela ? formData.a_receber : true,
      };
    });
    
    setParcelasEditaveis(novasParcelas);
  }, [formaPagamento, formData.valor, formData.data, numeroParcelas]);

  // Sincronizar status da 1ª parcela com o switch
  useEffect(() => {
    if (parcelasEditaveis.length > 0) {
      setParcelasEditaveis(prev => 
        prev.map((p, i) => i === 0 ? { ...p, aReceber: formData.a_receber } : p)
      );
    }
  }, [formData.a_receber]);

  const handleParcelaValorChange = (index: number, novoValor: string) => {
    setParcelasEditaveis(prev => 
      prev.map((p, i) => i === index ? { ...p, valor: novoValor } : p)
    );
  };

  const handleParcelaDataChange = (index: number, novaData: string) => {
    setParcelasEditaveis(prev => 
      prev.map((p, i) => i === index ? { ...p, dataISO: novaData } : p)
    );
  };

  const totalParcelas = parcelasEditaveis.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);

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
        categoria: servico.categoria,
        tipo: 'entrada',
        recorrente: servico.tipo !== 'avulso',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.categoria) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (formaPagamento === "pix_parcelado" && parcelasEditaveis.length > 0) {
        // Criar múltiplas parcelas com valores editados
        for (const parcela of parcelasEditaveis) {
          await createTransaction.mutateAsync({
            tipo: formData.tipo,
            descricao: `${formData.descricao} (${parcela.numero}/${numeroParcelas})`,
            valor: parseFloat(parcela.valor),
            categoria: formData.categoria,
            data: parcela.dataISO,
            a_receber: parcela.aReceber,
            recorrente: false,
            cliente_id: formData.cliente_id !== 'none' ? formData.cliente_id : undefined,
            servico_id: formData.servico_id !== 'none' ? formData.servico_id : undefined,
          });
        }
        toast.success(`${numeroParcelas} parcelas criadas com sucesso!`);
      } else {
        // Criar apenas 1 lançamento
        await createTransaction.mutateAsync({
          tipo: formData.tipo,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          categoria: formData.categoria,
          data: formData.data,
          a_receber: formData.a_receber,
          recorrente: formData.recorrente,
          cliente_id: formData.cliente_id !== 'none' ? formData.cliente_id : undefined,
          servico_id: formData.servico_id !== 'none' ? formData.servico_id : undefined,
        });
        toast.success("Transação criada com sucesso!");
      }
      
      onOpenChange(false);
      setFormData({
        tipo: 'entrada',
        descricao: '',
        valor: '',
        categoria: '',
        data: toLocalISODate(),
        a_receber: false,
        recorrente: false,
        cliente_id: 'none',
        servico_id: 'none',
      });
      setFormaPagamento("pix");
      setNumeroParcelas(3);
      setParcelasEditaveis([]);
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast.error("Erro ao criar transação");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Serviço */}
          {servicosAtivos.length > 0 && (
            <div className="space-y-2">
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
              <p className="text-xs text-muted-foreground">
                Ao selecionar um serviço, os campos serão preenchidos automaticamente
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => setFormData({...formData, tipo: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Receita</SelectItem>
                <SelectItem value="saida">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descrição da transação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Produtos">Produtos</SelectItem>
                <SelectItem value="Consultoria">Consultoria</SelectItem>
                <SelectItem value="Aulas">Aulas</SelectItem>
                <SelectItem value="Eventos">Eventos</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente (Opcional)</Label>
            <Select value={formData.cliente_id} onValueChange={(value) => setFormData({...formData, cliente_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="forma-pagamento" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Forma de Pagamento
            </Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="pix_parcelado">Pix Parcelado</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número de Parcelas - só aparece com Pix Parcelado */}
          {formaPagamento === "pix_parcelado" && (
            <div className="space-y-2">
              <Label>Número de Parcelas</Label>
              <Select value={numeroParcelas.toString()} onValueChange={(v) => setNumeroParcelas(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="3">3x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="6">6x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Parcelas Editáveis */}
          {formaPagamento === "pix_parcelado" && parcelasEditaveis.length > 0 && (
            <div className="p-3 bg-muted rounded-md border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Parcelas (editáveis):
                </Label>
                <span className="text-xs font-medium">
                  Total: R$ {totalParcelas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              {parcelasEditaveis.map((parcela, index) => (
                <div key={parcela.numero} className="grid grid-cols-[32px_120px_1fr_70px] gap-2 items-center">
                  <span className="text-sm font-medium">{parcela.numero}x</span>
                  
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={parcela.valor}
                      onChange={(e) => handleParcelaValorChange(index, e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  
                  <Input
                    type="date"
                    value={parcela.dataISO}
                    onChange={(e) => handleParcelaDataChange(index, e.target.value)}
                    className="h-9"
                  />
                  
                  <span className={`text-xs text-right ${
                    index === 0 && !formData.a_receber ? "text-green-600 font-medium" : "text-amber-600"
                  }`}>
                    {index === 0 && !formData.a_receber ? "Pago" : "A Receber"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="a_receber"
              checked={formaPagamento === "pix_parcelado" ? !formData.a_receber : formData.a_receber}
              onCheckedChange={(checked) => setFormData({...formData, a_receber: formaPagamento === "pix_parcelado" ? !checked : checked})}
            />
            <Label htmlFor="a_receber">
              {formaPagamento === "pix_parcelado" ? "1ª parcela paga" : "A receber"}
            </Label>
          </div>

          {formaPagamento !== "pix_parcelado" && (
            <div className="flex items-center space-x-2">
              <Switch
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData({...formData, recorrente: checked})}
              />
              <Label htmlFor="recorrente">Recorrente mensal</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={createTransaction.isPending}
            >
              {createTransaction.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
