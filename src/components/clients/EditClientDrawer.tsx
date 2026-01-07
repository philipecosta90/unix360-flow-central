import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { X, MapPin } from "lucide-react";
import { parseISO } from "date-fns";

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
}

interface EditClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
  client: Cliente;
}

export const EditClientDrawer = ({ open, onClose, onSave, client }: EditClientDrawerProps) => {
  const { toast } = useToast();
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
  });
  const [dataInicioPlano, setDataInicioPlano] = useState<string>("");
  const [dataFimPlano, setDataFimPlano] = useState<string>("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [loading, setLoading] = useState(false);

  // Log de montagem do componente
  useEffect(() => {
    logger.ui('EditClientDrawer', 'Component MOUNTED', { clientId: client?.id });
    return () => logger.ui('EditClientDrawer', 'Component UNMOUNTED');
  }, []);

  useEffect(() => {
    if (client) {
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
      });
      setDataInicioPlano(client.data_inicio_plano || "");
      setDataFimPlano(client.data_fim_plano || "");
    }
  }, [client]);

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
      };

      await onSave(clientData);
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
                <Label htmlFor="telefone">Telefone</Label>
                <PhoneInput
                  id="telefone"
                  value={formData.telefone}
                  onChange={(value) => setFormData({...formData, telefone: value})}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="plano">Plano Contratado</Label>
                <Input
                  id="plano"
                  value={formData.plano_contratado}
                  onChange={(e) => setFormData({...formData, plano_contratado: e.target.value})}
                  placeholder="Básico, Premium, VIP..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio_plano">Data de Início do Plano</Label>
                <Input
                  id="data_inicio_plano"
                  type="date"
                  value={dataInicioPlano}
                  onChange={(e) => setDataInicioPlano(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim_plano">Data de Término do Plano</Label>
                <Input
                  id="data_fim_plano"
                  type="date"
                  value={dataFimPlano}
                  min={dataInicioPlano || undefined}
                  onChange={(e) => setDataFimPlano(e.target.value)}
                />
              </div>
            </div>

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
