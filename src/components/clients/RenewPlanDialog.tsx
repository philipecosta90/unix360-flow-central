import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useServicos } from "@/hooks/useServicos";
import { useQueryClient } from "@tanstack/react-query";
import { format, addDays, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Calendar, DollarSign } from "lucide-react";

interface RenewPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

interface ParcelaEditavel {
  numero: number;
  valor: number;
  data: string;
  aReceber: boolean;
}

const RENEWAL_OPTIONS = [
  { label: "30 dias", days: 30 },
  { label: "60 dias", days: 60 },
  { label: "90 dias", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 ano", days: 365 },
];

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "pix_parcelado", label: "Pix Parcelado" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
];

export const RenewPlanDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: RenewPlanDialogProps) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const { servicosAtivos } = useServicos();

  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");
  const [registerPayment, setRegisterPayment] = useState(false);

  // Datas editáveis
  const [dataInicioRenovacao, setDataInicioRenovacao] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dataFimRenovacao, setDataFimRenovacao] = useState<string>("");
  const [dataFimEditadaManualmente, setDataFimEditadaManualmente] = useState(false);

  // Payment fields
  const [servicoId, setServicoId] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [aReceber, setAReceber] = useState(true);
  const [numeroParcelas, setNumeroParcelas] = useState<number>(2);
  const [parcelasEditaveis, setParcelasEditaveis] = useState<ParcelaEditavel[]>([]);

  const selectedDays = parseInt(selectedPeriod) || 30;
  
  // Calcular data fim automaticamente quando data início ou período mudar
  useEffect(() => {
    if (dataInicioRenovacao && !dataFimEditadaManualmente) {
      const dataInicio = parseISO(dataInicioRenovacao);
      const novaDataFim = addDays(dataInicio, selectedDays);
      setDataFimRenovacao(format(novaDataFim, "yyyy-MM-dd"));
    }
  }, [dataInicioRenovacao, selectedDays, dataFimEditadaManualmente]);

  // Initialize parcelas when payment method or value changes
  useEffect(() => {
    if (formaPagamento === "pix_parcelado" && valor) {
      const valorTotal = parseFloat(valor) || 0;
      const valorParcela = valorTotal / numeroParcelas;
      const novasParcelas: ParcelaEditavel[] = [];
      const dataBase = dataInicioRenovacao ? parseISO(dataInicioRenovacao) : new Date();

      for (let i = 0; i < numeroParcelas; i++) {
        const dataParcela = addMonths(dataBase, i);
        novasParcelas.push({
          numero: i + 1,
          valor: Math.round(valorParcela * 100) / 100,
          data: format(dataParcela, "yyyy-MM-dd"),
          aReceber: i === 0 ? aReceber : true,
        });
      }
      setParcelasEditaveis(novasParcelas);
    }
  }, [formaPagamento, valor, numeroParcelas, aReceber, dataInicioRenovacao]);

  // Update first parcela aReceber when main switch changes
  useEffect(() => {
    if (parcelasEditaveis.length > 0) {
      setParcelasEditaveis((prev) =>
        prev.map((p, idx) => (idx === 0 ? { ...p, aReceber } : p))
      );
    }
  }, [aReceber]);

  // Pre-fill value when service is selected
  const handleServicoChange = (id: string) => {
    setServicoId(id);
    if (id) {
      const servico = servicosAtivos?.find((s) => s.id === id);
      if (servico) {
        setValor(servico.valor.toString());
      }
    }
  };

  const handleParcelaValorChange = (index: number, novoValor: string) => {
    setParcelasEditaveis((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, valor: parseFloat(novoValor) || 0 } : p
      )
    );
  };

  const handleParcelaDataChange = (index: number, novaData: string) => {
    setParcelasEditaveis((prev) =>
      prev.map((p, i) => (i === index ? { ...p, data: novaData } : p))
    );
  };

  const resetForm = () => {
    setSelectedPeriod("30");
    setDataInicioRenovacao(format(new Date(), "yyyy-MM-dd"));
    setDataFimRenovacao("");
    setDataFimEditadaManualmente(false);
    setRegisterPayment(false);
    setServicoId("");
    setValor("");
    setFormaPagamento("pix");
    setAReceber(true);
    setNumeroParcelas(2);
    setParcelasEditaveis([]);
  };

  const handleSubmit = async () => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Perfil não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (registerPayment && !valor) {
      toast({
        title: "Erro",
        description: "Informe o valor do pagamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dataInicio = dataInicioRenovacao;
      const dataFim = dataFimRenovacao;
      const periodLabel = RENEWAL_OPTIONS.find(
        (o) => o.days === selectedDays
      )?.label || `${selectedDays} dias`;

      // 1. Update client
      const { error: updateError } = await supabase
        .from("clientes")
        .update({
          data_inicio_plano: dataInicio,
          data_fim_plano: dataFim,
          status: "ativo",
        })
        .eq("id", clientId);

      if (updateError) throw updateError;

      // 2. Register renewal history
      const { error: historyError } = await supabase
        .from("historico_renovacoes")
        .insert({
          cliente_id: clientId,
          empresa_id: userProfile.empresa_id,
          data_inicio_plano: dataInicio,
          data_fim_plano: dataFim,
          periodo_dias: selectedDays,
          periodo_label: periodLabel,
          renovado_por: userProfile.id,
        });

      if (historyError) {
        console.error("Erro ao registrar histórico:", historyError);
      }

      // 3. Register financial transaction if enabled
      if (registerPayment && valor) {
        const valorNumerico = parseFloat(valor);
        const servicoNome = servicoId
          ? servicosAtivos?.find((s) => s.id === servicoId)?.nome
          : null;
        const descricao = `Renovação: ${servicoNome || periodLabel} - ${clientName}`;

        if (formaPagamento === "pix_parcelado" && parcelasEditaveis.length > 0) {
          // Insert multiple parcels
          for (const parcela of parcelasEditaveis) {
            const { error: finError } = await supabase
              .from("financeiro_lancamentos")
              .insert({
                empresa_id: userProfile.empresa_id,
                tipo: "entrada",
                categoria: "serviços",
                descricao: `${descricao} (${parcela.numero}/${parcelasEditaveis.length})`,
                valor: parcela.valor,
                data: parcela.data,
                a_receber: parcela.aReceber,
                cliente_id: clientId,
                servico_id: servicoId || null,
                created_by: userProfile.id,
              });

            if (finError) {
              console.error("Erro ao registrar parcela:", finError);
            }
          }
        } else {
          // Single transaction
          const { error: finError } = await supabase
            .from("financeiro_lancamentos")
            .insert({
              empresa_id: userProfile.empresa_id,
              tipo: "entrada",
              categoria: "serviços",
              descricao,
              valor: valorNumerico,
              data: dataInicio,
              a_receber: aReceber,
              cliente_id: clientId,
              servico_id: servicoId || null,
              created_by: userProfile.id,
            });

          if (finError) {
            console.error("Erro ao registrar lançamento:", finError);
          }
        }

        // Invalidate financial queries
        queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
        queryClient.invalidateQueries({ queryKey: ["all-financial-transactions"] });
      }

      toast({
        title: "Plano renovado!",
        description: `${clientName} agora tem plano até ${format(parseISO(dataFim), "dd/MM/yyyy")} (${periodLabel}).${registerPayment ? " Pagamento registrado." : ""}`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao renovar plano:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível renovar o plano.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Renovar Plano - {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period Selection */}
          <div className="space-y-2">
            <Label>Período de Renovação *</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {RENEWAL_OPTIONS.map((option) => (
                  <SelectItem key={option.days} value={option.days.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Datas Editáveis */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              📅 Datas do Plano
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Data de Início</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicioRenovacao}
                  onChange={(e) => {
                    setDataInicioRenovacao(e.target.value);
                    setDataFimEditadaManualmente(false);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-fim">Data de Término</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFimRenovacao}
                  min={dataInicioRenovacao}
                  onChange={(e) => {
                    setDataFimRenovacao(e.target.value);
                    setDataFimEditadaManualmente(true);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment Toggle */}
          <div className="flex items-center justify-between py-2 border-t">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="register-payment" className="font-medium">
                Registrar pagamento
              </Label>
            </div>
            <Switch
              id="register-payment"
              checked={registerPayment}
              onCheckedChange={setRegisterPayment}
            />
          </div>

          {/* Payment Fields */}
          {registerPayment && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              {/* Service */}
              <div className="space-y-2">
                <Label>Serviço (opcional)</Label>
                <Select value={servicoId} onValueChange={handleServicoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicosAtivos?.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome} - R$ {servico.valor.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value and Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pix Parcelado */}
              {formaPagamento === "pix_parcelado" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Número de Parcelas</Label>
                    <Select
                      value={numeroParcelas.toString()}
                      onValueChange={(v) => setNumeroParcelas(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {parcelasEditaveis.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Editar Parcelas
                      </Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {parcelasEditaveis.map((parcela, index) => (
                          <div
                            key={parcela.numero}
                            className="grid grid-cols-3 gap-2 items-center text-sm"
                          >
                            <span className="text-muted-foreground">
                              {parcela.numero}ª
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={parcela.valor}
                              onChange={(e) =>
                                handleParcelaValorChange(index, e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                            <Input
                              type="date"
                              value={parcela.data}
                              onChange={(e) =>
                                handleParcelaDataChange(index, e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Status */}
              <div className="flex items-center justify-between">
                <Label>Status do pagamento</Label>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={!aReceber}
                      onChange={() => setAReceber(false)}
                      className="w-4 h-4"
                    />
                    Pago
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={aReceber}
                      onChange={() => setAReceber(true)}
                      className="w-4 h-4"
                    />
                    A Receber
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Renovar Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
