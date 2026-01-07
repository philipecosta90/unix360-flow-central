import { useState, useEffect } from "react";
import { parseISO, addMonths, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAnamnese } from "@/hooks/useAnamnese";
import { useServicos } from "@/hooks/useServicos";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";

import { logger } from "@/utils/logger";
import { X, ClipboardList, MessageCircle, CreditCard } from "lucide-react";

interface AddClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (clientData: any, options?: { enviarBoasVindas?: boolean }) => Promise<{ id: string } | void>;
}

export const AddClientDrawer = ({ open, onClose, onSave }: AddClientDrawerProps) => {
  const { toast } = useToast();
  
  const { templates, fetchTemplates, sendAnamnese } = useAnamnese();
  const { servicosAtivos, isLoading: loadingServicos } = useServicos();
  const { createTransaction } = useFinancialTransactions({});
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    tags: "",
    observacoes: "",
    data_nascimento: "",
  });
  
  // Serviço e plano
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<string>("");
  const [dataInicioPlano, setDataInicioPlano] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dataFimPlano, setDataFimPlano] = useState<string>("");
  
  // Pagamento
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [statusPagamento, setStatusPagamento] = useState<string>("pago");
  const [dataPagamento, setDataPagamento] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [numeroParcelas, setNumeroParcelas] = useState<number>(3);
  
  // Anamnese e boas-vindas
  const [enviarAnamnese, setEnviarAnamnese] = useState(false);
  const [enviarBoasVindas, setEnviarBoasVindas] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Calcular preview das parcelas
  const calcularParcelas = () => {
    if (!servicoSelecionado || formaPagamento !== "pix_parcelado") return [];
    
    const valorTotal = servicoSelecionado.valor;
    const valorParcela = Math.floor((valorTotal / numeroParcelas) * 100) / 100;
    const valorUltimaParcela = Math.round((valorTotal - (valorParcela * (numeroParcelas - 1))) * 100) / 100;
    
    return Array.from({ length: numeroParcelas }, (_, i) => {
      const dataParcela = addMonths(parseISO(dataPagamento), i);
      const isPrimeiraParcela = i === 0;
      const isUltimaParcela = i === numeroParcelas - 1;
      
      return {
        numero: i + 1,
        valor: isUltimaParcela ? valorUltimaParcela : valorParcela,
        data: format(dataParcela, "dd/MM/yyyy"),
        dataISO: format(dataParcela, "yyyy-MM-dd"),
        status: isPrimeiraParcela ? (statusPagamento === "pago" ? "Pago" : "A Receber") : "A Receber",
        aReceber: isPrimeiraParcela ? statusPagamento === "a_receber" : true,
      };
    });
  };

  const parcelasPreview = calcularParcelas();

  // Serviço selecionado
  const servicoSelecionado = servicosAtivos?.find(s => s.id === servicoSelecionadoId);

  // Log de montagem do componente
  useEffect(() => {
    logger.ui('AddClientDrawer', 'Component MOUNTED');
    return () => logger.ui('AddClientDrawer', 'Component UNMOUNTED');
  }, []);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Calcular data de término automaticamente quando serviço ou data de início mudar
  useEffect(() => {
    if (servicoSelecionado && dataInicioPlano) {
      const duracaoMeses = servicoSelecionado.duracao_meses || 1;
      const dataInicio = parseISO(dataInicioPlano);
      const dataFim = addMonths(dataInicio, duracaoMeses);
      setDataFimPlano(format(dataFim, "yyyy-MM-dd"));
    }
  }, [servicoSelecionado, dataInicioPlano]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!servicoSelecionadoId) {
      toast({
        title: "Erro",
        description: "Selecione um serviço para o cliente.",
        variant: "destructive",
      });
      return;
    }

    if (enviarAnamnese && !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "O e-mail é obrigatório para enviar a anamnese.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const clientData = {
        nome: formData.nome.trim(),
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim() || null,
        status: "ativo" as const, // Sempre ativo ao cadastrar
        plano_contratado: servicoSelecionado?.nome || null,
        observacoes: formData.observacoes.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        data_inicio_plano: dataInicioPlano || null,
        data_fim_plano: dataFimPlano || null,
        data_nascimento: formData.data_nascimento || null
      };

      // Passa a flag de enviarBoasVindas para o ClientsModule
      const result = await onSave(clientData, { 
        enviarBoasVindas: enviarBoasVindas && !!formData.telefone 
      });
      
      // Criar lançamento(s) financeiro(s) se cliente foi criado com sucesso
      if (result && 'id' in result && servicoSelecionado) {
        if (formaPagamento === "pix_parcelado") {
          // Criar múltiplas parcelas
          const parcelas = calcularParcelas();
          for (const parcela of parcelas) {
            await createTransaction.mutateAsync({
              tipo: "entrada",
              descricao: `Contratação: ${servicoSelecionado.nome} - ${formData.nome.trim()} (${parcela.numero}/${numeroParcelas})`,
              valor: parcela.valor,
              categoria: servicoSelecionado.categoria || "Serviços",
              data: parcela.dataISO,
              a_receber: parcela.aReceber,
              recorrente: false,
              cliente_id: result.id,
              servico_id: servicoSelecionado.id,
            });
          }
        } else {
          // Criar apenas 1 lançamento
          await createTransaction.mutateAsync({
            tipo: "entrada",
            descricao: `Contratação: ${servicoSelecionado.nome} - ${formData.nome.trim()}`,
            valor: servicoSelecionado.valor,
            categoria: servicoSelecionado.categoria || "Serviços",
            data: dataPagamento,
            a_receber: statusPagamento === "a_receber",
            recorrente: servicoSelecionado.tipo === "recorrente",
            cliente_id: result.id,
            servico_id: servicoSelecionado.id,
          });
        }
      }
      
      // Se cliente foi criado e deve enviar anamnese
      if (enviarAnamnese && result && 'id' in result && selectedTemplateId && formData.email) {
        await sendAnamnese(
          result.id,
          selectedTemplateId,
          formData.nome.trim(),
          formData.email.trim()
        );
      }
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      tags: "",
      observacoes: "",
      data_nascimento: "",
    });
    setServicoSelecionadoId("");
    setDataInicioPlano(format(new Date(), "yyyy-MM-dd"));
    setDataFimPlano("");
    setFormaPagamento("pix");
    setStatusPagamento("pago");
    setDataPagamento(format(new Date(), "yyyy-MM-dd"));
    setNumeroParcelas(3);
    setEnviarAnamnese(false);
    setEnviarBoasVindas(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        logger.ui('AddClientDrawer', 'Drawer onOpenChange', { nextOpen });
        if (!nextOpen) handleClose();
      }}
      modal={false}
    >
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>Adicionar Novo Cliente</DrawerTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </DrawerHeader>
        
        <form id="add-client-form" onSubmit={handleSubmit} className="flex-1 overflow-auto px-6">
          <div className="space-y-4 pb-6">
            {/* Dados Pessoais */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail {enviarAnamnese && "*"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <PhoneInput
                  id="telefone"
                  value={formData.telefone}
                  onChange={(value) => setFormData({...formData, telefone: value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
              />
            </div>

            {/* Serviço Contratado */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <Label className="font-medium">Serviço Contratado *</Label>
              </div>

              <div className="space-y-2">
                <Select 
                  value={servicoSelecionadoId} 
                  onValueChange={setServicoSelecionadoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingServicos ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : servicosAtivos && servicosAtivos.length > 0 ? (
                      servicosAtivos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id}>
                          {servico.nome} - R$ {servico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Nenhum serviço cadastrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {(!servicosAtivos || servicosAtivos.length === 0) && !loadingServicos && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum serviço cadastrado. Crie um no módulo Serviços.
                  </p>
                )}
              </div>

              {servicoSelecionado && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Valor</Label>
                      <p className="font-medium text-lg">
                        R$ {servicoSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Duração</Label>
                      <p className="font-medium">
                        {servicoSelecionado.duracao_meses || 1} {(servicoSelecionado.duracao_meses || 1) === 1 ? 'mês' : 'meses'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_inicio_plano">Data de Início</Label>
                      <Input
                        id="data_inicio_plano"
                        type="date"
                        value={dataInicioPlano}
                        onChange={(e) => setDataInicioPlano(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_fim_plano">Data de Término</Label>
                      <Input
                        id="data_fim_plano"
                        type="date"
                        value={dataFimPlano}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pagamento */}
            {servicoSelecionado && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <Label className="font-medium">Dados do Pagamento</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
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

                  <div className="space-y-2">
                    <Label>{formaPagamento === "pix_parcelado" ? "Status da 1ª Parcela" : "Status do Pagamento"}</Label>
                    <Select value={statusPagamento} onValueChange={setStatusPagamento}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="a_receber">A Receber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_pagamento">{formaPagamento === "pix_parcelado" ? "Data da 1ª Parcela" : "Data do Pagamento"}</Label>
                    <Input
                      id="data_pagamento"
                      type="date"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                    />
                  </div>
                </div>

                {/* Preview das parcelas */}
                {formaPagamento === "pix_parcelado" && parcelasPreview.length > 0 && (
                  <div className="mt-4 p-3 bg-background rounded-md border">
                    <Label className="text-xs text-muted-foreground mb-2 block">Preview das parcelas:</Label>
                    <div className="space-y-1">
                      {parcelasPreview.map((parcela) => (
                        <div key={parcela.numero} className="flex justify-between text-sm">
                          <span>• {parcela.numero}ª parcela: R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {parcela.data}</span>
                          <span className={parcela.status === "Pago" ? "text-green-600 font-medium" : "text-amber-600"}>
                            ({parcela.status})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="VIP, Mentor, Coaching, etc..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Informações adicionais sobre o cliente..."
                rows={3}
              />
            </div>

            {/* Seção de WhatsApp Boas-Vindas */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="enviarBoasVindas"
                  checked={enviarBoasVindas}
                  onCheckedChange={(checked) => setEnviarBoasVindas(checked === true)}
                />
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <Label htmlFor="enviarBoasVindas" className="cursor-pointer font-medium">
                    Enviar mensagem de boas-vindas via WhatsApp
                  </Label>
                </div>
              </div>
              {enviarBoasVindas && !formData.telefone && (
                <p className="text-xs text-muted-foreground mt-2 pl-6">
                  Preencha o telefone para enviar a mensagem.
                </p>
              )}
            </div>

            {/* Seção de Anamnese */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="enviarAnamnese"
                  checked={enviarAnamnese}
                  onCheckedChange={(checked) => setEnviarAnamnese(checked === true)}
                />
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#43B26D]" />
                  <Label htmlFor="enviarAnamnese" className="cursor-pointer font-medium">
                    Enviar questionário de anamnese após cadastro
                  </Label>
                </div>
              </div>
              
              {enviarAnamnese && templates.length > 0 && (
                <div className="mt-3 pl-6">
                  <Label className="text-sm text-muted-foreground">Template</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {enviarAnamnese && templates.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2 pl-6">
                  Nenhum template disponível. Crie um na aba Anamnese.
                </p>
              )}
            </div>
          </div>
        </form>

        <DrawerFooter className="flex flex-row justify-end space-x-2 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            form="add-client-form"
            disabled={loading}
            className="bg-[#43B26D] hover:bg-[#37A05B]"
          >
            {loading ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
