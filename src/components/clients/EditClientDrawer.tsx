import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

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
    data_inicio_plano: "",
    data_fim_plano: ""
  });

  const [loading, setLoading] = useState(false);

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
        data_inicio_plano: client.data_inicio_plano || "",
        data_fim_plano: client.data_fim_plano || ""
      });
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
        data_inicio_plano: formData.data_inicio_plano || null,
        data_fim_plano: formData.data_fim_plano || null
      };

      await onSave(clientData);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
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
                <Label htmlFor="data_inicio_plano">Data de Início do Plano</Label>
                <Input
                  id="data_inicio_plano"
                  type="date"
                  value={formData.data_inicio_plano}
                  onChange={(e) => setFormData({...formData, data_inicio_plano: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim_plano">Data de Término do Plano</Label>
                <Input
                  id="data_fim_plano"
                  type="date"
                  value={formData.data_fim_plano}
                  onChange={(e) => setFormData({...formData, data_fim_plano: e.target.value})}
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
