import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useDatePickerDebug } from "@/hooks/useDatePickerDebug";
import { logger } from "@/utils/logger";
import { X, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  });
  const [dataInicioPlano, setDataInicioPlano] = useState<Date | undefined>(undefined);
  const [dataFimPlano, setDataFimPlano] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Debug hooks para os datepickers
  const dataInicioDebug = useDatePickerDebug({ 
    componentName: 'EditClientDrawer', 
    fieldName: 'DataInicio' 
  });
  const dataFimDebug = useDatePickerDebug({ 
    componentName: 'EditClientDrawer', 
    fieldName: 'DataFim' 
  });

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
      });
      setDataInicioPlano(client.data_inicio_plano ? parseISO(client.data_inicio_plano) : undefined);
      setDataFimPlano(client.data_fim_plano ? parseISO(client.data_fim_plano) : undefined);
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
    if (dataInicioPlano && dataFimPlano && dataFimPlano < dataInicioPlano) {
      toast({
        title: "Erro",
        description: "A data de fim do plano não pode ser anterior à data de início.",
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
        status: formData.status,
        plano_contratado: formData.plano_contratado.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        data_inicio_plano: dataInicioPlano ? format(dataInicioPlano, "yyyy-MM-dd") : null,
        data_fim_plano: dataFimPlano ? format(dataFimPlano, "yyyy-MM-dd") : null
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
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6">
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
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
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
                <Label>Data de Início do Plano</Label>
                <Popover 
                  open={dataInicioDebug.isOpen} 
                  onOpenChange={dataInicioDebug.handleOpenChange}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={dataInicioDebug.handleTriggerClick}
                      className={cn(
                        "w-full justify-start text-left font-normal pointer-events-auto",
                        !dataInicioPlano && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicioPlano ? format(dataInicioPlano, "dd/MM/yyyy") : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    portalled={false}
                    className="w-auto p-0 z-[9999] pointer-events-auto"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={dataInicioPlano}
                      onSelect={(date) => dataInicioDebug.handleSelect(date, setDataInicioPlano)}
                      locale={ptBR}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Término do Plano</Label>
                <Popover 
                  open={dataFimDebug.isOpen} 
                  onOpenChange={dataFimDebug.handleOpenChange}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={dataFimDebug.handleTriggerClick}
                      className={cn(
                        "w-full justify-start text-left font-normal pointer-events-auto",
                        !dataFimPlano && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFimPlano ? format(dataFimPlano, "dd/MM/yyyy") : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    portalled={false}
                    className="w-auto p-0 z-[9999] pointer-events-auto"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={dataFimPlano}
                      onSelect={(date) => dataFimDebug.handleSelect(date, setDataFimPlano)}
                      locale={ptBR}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => dataInicioPlano ? date < dataInicioPlano : false}
                    />
                  </PopoverContent>
                </Popover>
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
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#43B26D] hover:bg-[#37A05B]"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
