import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntlPhoneInput } from "@/components/ui/intl-phone-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { X, MapPin, CreditCard, Info } from "lucide-react";
import { parseISO, addMonths, format } from "date-fns";
import { useServicos } from "@/hooks/useServicos";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

import { ClientAvatarUpload } from "./ClientAvatarUpload";

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  status: 'ativo' | 'inativo' | 'lead' | 'prospecto';
  plano_contratado?: string;
  observacoes?: string;
  tags?: string[];
  data_inicio_plano?: string;
  data_fim_plano?: string;
  data_nascimento?: string;
  cpf_cnpj?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  foto_url?: string;
}

interface EditClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
  client: Cliente;
}

export const EditClientDrawer = ({ open, onClose, onSave, client }: EditClientDrawerProps) => {
  const { toast } = useToast();
  const { servicosAtivos } = useServicos();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    status: "lead" as 'ativo' | 'inativo' | 'lead' | 'prospecto',
    plano_contratado: "",
    tags: "",
    observacoes: "",
    data_nascimento: "",
    cpf_cnpj: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    foto_url: "",
  });
  const [dataInicioPlano, setDataInicioPlano] = useState<string>("");
  const [dataFimPlano, setDataFimPlano] = useState<string>("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<string>("");
  
  // Estados para dados de pagamento
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [statusPagamento, setStatusPagamento] = useState<string>("pago");
  const [dataPagamento, setDataPagamento] = useState<string>("");
  
  // Estados para Pix Parcelado
  const [numeroParcelas, setNumeroParcelas] = useState<number>(2);
  const [parcelasInfo, setParcelasInfo] = useState<Array<{
    id?: string; // ID da transação no banco
    numero: number;
    valor: number;
    data: string;
    status: string;
  }>>([]);
  const [parcelasOriginais, setParcelasOriginais] = useState<Array<{
    id: string;
    valor: number;
    data: string;
    status: string;
  }>>([]);
  
  // Ref para controlar qual cliente já foi inicializado - evita reinicializações indesejadas
  const lastInitializedClientIdRef = useRef<string | null>(null);
  // Ref para rastrear se o usuário editou manualmente a data de término
  const userEditedEndDateRef = useRef(false);

  const servicoSelecionado = servicosAtivos?.find(s => s.id === servicoSelecionadoId);

  // Log de montagem do componente
  useEffect(() => {
    logger.ui('EditClientDrawer', 'Component MOUNTED', { clientId: client?.id });
    return () => logger.ui('EditClientDrawer', 'Component UNMOUNTED');
  }, []);

  // Effect 1: Inicializa o formulário APENAS quando o drawer abre com um novo cliente
  // NÃO depende de servicosAtivos para evitar reset das datas
  useEffect(() => {
    if (open && client && client.id !== lastInitializedClientIdRef.current) {
      logger.info('📝 EditClientDrawer - Inicializando formulário para cliente:', {
        id: client.id,
        nome: client.nome,
        data_inicio_plano: client.data_inicio_plano,
        data_fim_plano: client.data_fim_plano,
      });

      setFormData({
        nome: client.nome || "",
        email: client.email || "",
        telefone: client.telefone || "",
        status: client.status,
        plano_contratado: client.plano_contratado || "",
        tags: client.tags ? client.tags.join(', ') : "",
        observacoes: client.observacoes || "",
        data_nascimento: client.data_nascimento || "",
        cpf_cnpj: client.cpf_cnpj || "",
        cep: client.cep || "",
        logradouro: client.logradouro || "",
        numero: client.numero || "",
        complemento: client.complemento || "",
        bairro: client.bairro || "",
        cidade: client.cidade || "",
        estado: client.estado || "",
        foto_url: client.foto_url || "",
      });
      setDataInicioPlano(client.data_inicio_plano || "");
      setDataFimPlano(client.data_fim_plano || "");
      
      lastInitializedClientIdRef.current = client.id;
      userEditedEndDateRef.current = false;
      
      // Buscar dados de pagamento do cliente (transações financeiras)
      const fetchPaymentData = async () => {
        try {
          const { data: transacoes } = await supabase
            .from('financeiro_lancamentos')
            .select('*')
            .eq('cliente_id', client.id)
            .eq('tipo', 'entrada')
            .order('data', { ascending: true });
          
          if (transacoes && transacoes.length > 0) {
            // Verificar se são parcelas (descrição contém "1/X", "2/X", etc.)
            const pareceParcelado = transacoes.some(t => 
              t.descricao && /\(\d+\/\d+\)/.test(t.descricao)
            );
            
            if (pareceParcelado && transacoes.length > 1) {
              setFormaPagamento("pix_parcelado");
              setNumeroParcelas(transacoes.length);
              const parcelas = transacoes.map((t, idx) => ({
                id: t.id,
                numero: idx + 1,
                valor: t.valor,
                data: t.data,
                status: t.a_receber ? "a_receber" : "pago"
              }));
              setParcelasInfo(parcelas);
              // Guardar cópia original para comparação
              setParcelasOriginais(transacoes.map(t => ({
                id: t.id,
                valor: t.valor,
                data: t.data,
                status: t.a_receber ? "a_receber" : "pago"
              })));
              // Usar status da primeira parcela como status geral
              setStatusPagamento(transacoes[0].a_receber ? "a_receber" : "pago");
              setDataPagamento(transacoes[0].data || "");
            } else {
              // Transação única
              const transacao = transacoes[0];
              setFormaPagamento("pix");
              setStatusPagamento(transacao.a_receber ? "a_receber" : "pago");
              setDataPagamento(transacao.data || "");
              setParcelasInfo([]);
              setParcelasOriginais([]);
            }
          } else {
            // Sem transações, resetar estado
            setFormaPagamento("pix");
            setParcelasInfo([]);
            setParcelasOriginais([]);
          }
        } catch (error) {
          logger.error('Erro ao buscar dados de pagamento:', error);
        }
      };
      
      fetchPaymentData();
    }
    
    // Reset ref quando o drawer fecha para permitir reinicialização na próxima abertura
    if (!open) {
      lastInitializedClientIdRef.current = null;
    }
  }, [open, client]);

  // Effect 2: Mapeia o serviço contratado para o ID do serviço quando a lista de serviços carrega
  // Este effect NÃO reseta datas nem formData
  useEffect(() => {
    if (client?.plano_contratado && servicosAtivos && servicosAtivos.length > 0) {
      const servico = servicosAtivos.find(s => s.nome === client.plano_contratado);
      if (servico && servicoSelecionadoId !== servico.id) {
        logger.info('📝 EditClientDrawer - Mapeando serviço:', {
          plano_contratado: client.plano_contratado,
          servico_id: servico.id,
        });
        setServicoSelecionadoId(servico.id);
      }
    }
  }, [client?.plano_contratado, servicosAtivos]);

  // Recalcular parcelas quando número de parcelas ou forma de pagamento mudar (apenas se não veio do banco)
  useEffect(() => {
    if (formaPagamento === "pix_parcelado" && servicoSelecionado && parcelasInfo.length === 0) {
      const valorTotal = servicoSelecionado.valor;
      const valorParcela = valorTotal / numeroParcelas;
      const novasParcelas = [];
      const dataBase = dataInicioPlano ? parseISO(dataInicioPlano) : new Date();

      for (let i = 0; i < numeroParcelas; i++) {
        const dataParcela = addMonths(dataBase, i);
        novasParcelas.push({
          numero: i + 1,
          valor: Math.round(valorParcela * 100) / 100,
          data: format(dataParcela, "yyyy-MM-dd"),
          status: i === 0 ? statusPagamento : "a_receber"
        });
      }
      setParcelasInfo(novasParcelas);
    } else if (formaPagamento !== "pix_parcelado") {
      setParcelasInfo([]);
    }
  }, [formaPagamento, numeroParcelas, servicoSelecionado, dataInicioPlano]);

  // Calcular data de término automaticamente quando serviço ou data de início mudar
  useEffect(() => {
    if (servicoSelecionado && dataInicioPlano && !userEditedEndDateRef.current) {
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

    // Validar datas
    if (dataInicioPlano && dataFimPlano) {
      const inicio = parseISO(dataInicioPlano);
      const fim = parseISO(dataFimPlano);
      if (fim < inicio) {
        toast({
          title: "Erro",
          description: "A data de fim do plano não pode ser anterior à data de início.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Atualizar parcelas no financeiro se houver alterações
      if (formaPagamento === "pix_parcelado" && parcelasInfo.length > 0) {
        for (const parcela of parcelasInfo) {
          if (parcela.id) {
            // Encontrar a parcela original para comparar
            const original = parcelasOriginais.find(p => p.id === parcela.id);
            
            // Só atualizar se houver mudanças
            if (original && (
              original.valor !== parcela.valor ||
              original.data !== parcela.data ||
              original.status !== parcela.status
            )) {
              const { error: updateError } = await supabase
                .from('financeiro_lancamentos')
                .update({
                  valor: parcela.valor,
                  data: parcela.data,
                  a_receber: parcela.status === "a_receber",
                  updated_at: new Date().toISOString()
                })
                .eq('id', parcela.id);
              
              if (updateError) {
                logger.error('Erro ao atualizar parcela:', updateError);
              }
            }
          }
        }
      }

      // 2. Preparar dados do cliente
      const clientData = {
        nome: formData.nome.trim(),
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim() || null,
        status: formData.status,
        plano_contratado: formData.plano_contratado.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        data_inicio_plano: dataInicioPlano || null,
        data_fim_plano: dataFimPlano || null,
        data_nascimento: formData.data_nascimento || null,
        cpf_cnpj: formData.cpf_cnpj.trim() || null,
        cep: formData.cep.trim() || null,
        logradouro: formData.logradouro.trim() || null,
        numero: formData.numero.trim() || null,
        complemento: formData.complemento.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado.trim() || null,
        foto_url: formData.foto_url || null,
      };

      await onSave(clientData);
      
      // Mostrar toast de sucesso se parcelas foram atualizadas
      const parcelasAlteradas = parcelasInfo.some(p => {
        const original = parcelasOriginais.find(o => o.id === p.id);
        return original && (
          original.valor !== p.valor ||
          original.data !== p.data ||
          original.status !== p.status
        );
      });
      
      if (parcelasAlteradas) {
        // Invalidar queries do financeiro para atualizar os dados
        queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
        queryClient.invalidateQueries({ queryKey: ["all-financial-transactions"] });
        
        toast({
          title: "Parcelas atualizadas",
          description: "As alterações nas parcelas foram salvas no módulo financeiro.",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        logger.ui('EditClientDrawer', 'Drawer onOpenChange', { nextOpen });
        if (!nextOpen) onClose();
      }}
      modal={false}
    >
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>Editar Cliente</DrawerTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DrawerHeader>
        
        <form id="edit-client-form" onSubmit={handleSubmit} className="flex-1 overflow-auto px-6">
          <div className="space-y-4 pb-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-3 py-4 border-b border-border">
              <ClientAvatarUpload
                currentUrl={formData.foto_url}
                clientName={formData.nome || "Cliente"}
                clientId={client.id}
                onUpload={(url) => setFormData({...formData, foto_url: url || ""})}
                size="lg"
              />
              <Label className="text-sm text-muted-foreground">Foto de Perfil</Label>
            </div>

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
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="space-y-2">
                <IntlPhoneInput
                  label="Telefone"
                  value={formData.telefone}
                  onChange={(value) => setFormData({...formData, telefone: value})}
                  defaultCountry="BR"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => {
                    // Remove caracteres não numéricos
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, cpf_cnpj: value});
                  }}
                  placeholder="Somente números"
                  maxLength={14}
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label className="font-medium">Endereço (para emissão de NF)</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => {
                        const cepValue = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setFormData({...formData, cep: cepValue});
                        
                        // Busca automática por CEP
                        if (cepValue.length === 8) {
                          setBuscandoCep(true);
                          fetch(`https://viacep.com.br/ws/${cepValue}/json/`)
                            .then(res => res.json())
                            .then(data => {
                              if (!data.erro) {
                                setFormData(prev => ({
                                  ...prev,
                                  logradouro: data.logradouro || "",
                                  bairro: data.bairro || "",
                                  cidade: data.localidade || "",
                                  estado: data.uf || "",
                                }));
                              }
                            })
                            .catch(() => {})
                            .finally(() => setBuscandoCep(false));
                        }
                      }}
                      placeholder="00000000"
                      maxLength={8}
                    />
                    {buscandoCep && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        Buscando...
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                    placeholder="Apto, Bloco..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                    placeholder="Bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Cidade"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({...formData, estado: value})}>
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'ativo' | 'inativo' | 'lead' | 'prospecto') => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospecto">Prospecto</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Serviço Contratado - Card estilizado */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <Label className="font-medium">Serviço Contratado</Label>
              </div>

              <div className="space-y-2">
                <Select 
                  value={servicoSelecionadoId} 
                  onValueChange={(value) => {
                    setServicoSelecionadoId(value);
                    userEditedEndDateRef.current = false;
                    if (value === "none" || value === "") {
                      setFormData(prev => ({ ...prev, plano_contratado: "" }));
                    } else {
                      const servico = servicosAtivos?.find(s => s.id === value);
                      if (servico) {
                        setFormData(prev => ({ ...prev, plano_contratado: servico.nome }));
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum serviço</SelectItem>
                    {servicosAtivos?.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome} - R$ {servico.valor.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        <span className="text-xs text-muted-foreground ml-1">
                          ({servicoSelecionado.tipo === 'recorrente' ? 'Recorrente' : 'Único'})
                        </span>
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
                        min={dataInicioPlano || undefined}
                        onChange={(e) => {
                          userEditedEndDateRef.current = true;
                          setDataFimPlano(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dados do Pagamento */}
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

                  <div className="space-y-2">
                    <Label>Status do Pagamento</Label>
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
                    <Label htmlFor="data_pagamento">Data do Pagamento</Label>
                    <Input
                      id="data_pagamento"
                      type="date"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                    />
                  </div>
                </div>

                {/* Seção de Pix Parcelado */}
                {formaPagamento === "pix_parcelado" && (
                  <div className="col-span-full space-y-4 border-t pt-4 mt-2">
                    <div className="space-y-2">
                      <Label>Número de Parcelas</Label>
                      <Select
                        value={numeroParcelas.toString()}
                        onValueChange={(v) => {
                          setNumeroParcelas(parseInt(v));
                          setParcelasInfo([]); // Resetar para recalcular
                        }}
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

                    {parcelasInfo.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Detalhes das Parcelas (informativo)
                        </Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {parcelasInfo.map((parcela, index) => (
                            <div
                              key={parcela.numero}
                              className="grid grid-cols-4 gap-2 items-center text-sm"
                            >
                              <span className="text-muted-foreground font-medium">
                                {parcela.numero}ª
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                value={parcela.valor}
                                onChange={(e) => {
                                  const novasParcelas = [...parcelasInfo];
                                  novasParcelas[index].valor = parseFloat(e.target.value) || 0;
                                  setParcelasInfo(novasParcelas);
                                }}
                                className="h-8 text-sm"
                              />
                              <Input
                                type="date"
                                value={parcela.data}
                                onChange={(e) => {
                                  const novasParcelas = [...parcelasInfo];
                                  novasParcelas[index].data = e.target.value;
                                  setParcelasInfo(novasParcelas);
                                }}
                                className="h-8 text-sm"
                              />
                              <Select
                                value={parcela.status}
                                onValueChange={(v) => {
                                  const novasParcelas = [...parcelasInfo];
                                  novasParcelas[index].status = v;
                                  setParcelasInfo(novasParcelas);
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pago">Pago</SelectItem>
                                  <SelectItem value="a_receber">A Receber</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-muted-foreground col-span-full bg-muted/50 p-3 rounded-lg">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {formaPagamento === "pix_parcelado" && parcelasInfo.some(p => p.id) 
                      ? "As alterações nas parcelas serão salvas automaticamente no módulo financeiro ao clicar em 'Salvar Alterações'."
                      : "Alterações nos dados de pagamento são apenas informativos. Para editar transações existentes, acesse o módulo Financeiro."
                    }
                  </span>
                </div>
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
                rows={4}
              />
            </div>
          </div>
        </form>

        <DrawerFooter className="flex flex-row justify-end space-x-2 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-client-form"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
