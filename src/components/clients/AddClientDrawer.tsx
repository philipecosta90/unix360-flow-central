
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
}

export const AddClientDrawer = ({ open, onClose, onSave }: AddClientDrawerProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    status: "lead" as const,
    plano_contratado: "",
    tags: "",
    observacoes: "",
    data_inicio_plano: null as Date | null,
    data_fim_plano: null as Date | null
  });

  const [loading, setLoading] = useState(false);

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
        data_inicio_plano: formData.data_inicio_plano ? formData.data_inicio_plano.toISOString().split('T')[0] : null,
        data_fim_plano: formData.data_fim_plano ? formData.data_fim_plano.toISOString().split('T')[0] : null
      };

      await onSave(clientData);
      
      // Reset form
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        status: "lead",
        plano_contratado: "",
        tags: "",
        observacoes: "",
        data_inicio_plano: null,
        data_fim_plano: null
      });
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      status: "lead",
      plano_contratado: "",
      tags: "",
      observacoes: "",
      data_inicio_plano: null,
      data_fim_plano: null
    });
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>Adicionar Novo Cliente</DrawerTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
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
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="VIP, Mentor, Coaching, etc..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início do Plano</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data_inicio_plano && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_inicio_plano ? format(formData.data_inicio_plano, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_inicio_plano || undefined}
                      onSelect={(date) => setFormData({...formData, data_inicio_plano: date || null})}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Término do Plano</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data_fim_plano && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_fim_plano ? format(formData.data_fim_plano, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_fim_plano || undefined}
                      onSelect={(date) => setFormData({...formData, data_fim_plano: date || null})}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => 
                        formData.data_inicio_plano ? date < formData.data_inicio_plano : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
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
