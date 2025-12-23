import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAnamnese } from "@/hooks/useAnamnese";
import { logger } from "@/utils/logger";
import { X, ClipboardList } from "lucide-react";

interface AddClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (clientData: any) => Promise<{ id: string } | void>;
}

export const AddClientDrawer = ({ open, onClose, onSave }: AddClientDrawerProps) => {
  const { toast } = useToast();
  const { templates, fetchTemplates, sendAnamnese } = useAnamnese();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    status: "lead" as const,
    plano_contratado: "",
    tags: "",
    observacoes: "",
  });
  const [dataInicioPlano, setDataInicioPlano] = useState<string>("");
  const [dataFimPlano, setDataFimPlano] = useState<string>("");
  const [enviarAnamnese, setEnviarAnamnese] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

    if (enviarAnamnese && !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "O e-mail é obrigatório para enviar a anamnese.",
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
        data_fim_plano: dataFimPlano || null
      };

      const result = await onSave(clientData);
      
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
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        status: "lead",
        plano_contratado: "",
        tags: "",
        observacoes: "",
      });
      setDataInicioPlano("");
      setDataFimPlano("");
      setEnviarAnamnese(false);
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
    });
    setDataInicioPlano("");
    setDataFimPlano("");
    setEnviarAnamnese(false);
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
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Informações adicionais sobre o cliente..."
                rows={4}
              />
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
