import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prospectFormSchema, sanitizeInput, sanitizeHtml } from "@/utils/inputValidation";
import { z } from "zod";

interface CRMProspect {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa_cliente: string;
  cargo: string;
  stage: string;
  valor_estimado: number;
  origem: string;
  tags: string[];
  responsavel_id: string;
  proximo_followup: string;
  observacoes: string;
  created_at: string;
  perfis?: {
    nome: string;
    sobrenome: string;
  };
}

interface EditProspectDialogProps {
  prospect: CRMProspect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProspectFormData = z.infer<typeof prospectFormSchema> & {
  stage: string;
  responsavel_id: string;
  proximo_followup: string;
};

export const EditProspectDialog = ({ prospect, open, onOpenChange }: EditProspectDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProspectFormData>({
    resolver: zodResolver(prospectFormSchema.extend({
      stage: z.string(),
      responsavel_id: z.string(),
      proximo_followup: z.string(),
    })),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      empresa_cliente: "",
      cargo: "",
      stage: "default",
      valor_estimado: "",
      origem: "",
      tags: "",
      responsavel_id: "default",
      proximo_followup: "",
      observacoes: "",
    },
  });

  // Update form when prospect changes
  useEffect(() => {
    if (prospect && open) {
      form.reset({
        nome: prospect.nome || "",
        email: prospect.email || "",
        telefone: prospect.telefone || "",
        empresa_cliente: prospect.empresa_cliente || "",
        cargo: prospect.cargo || "",
        stage: prospect.stage || "default",
        valor_estimado: prospect.valor_estimado?.toString() || "",
        origem: prospect.origem || "",
        tags: prospect.tags?.join(", ") || "",
        responsavel_id: prospect.responsavel_id || "default",
        proximo_followup: prospect.proximo_followup || "",
        observacoes: prospect.observacoes || "",
      });
    }
  }, [prospect, open, form]);

  // Fetch stages
  const { data: stages = [] } = useQuery({
    queryKey: ['crm-stages', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('crm_stages')
        .select('id, nome')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.empresa_id && open,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome, sobrenome')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('ativo', true);

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.empresa_id && open,
  });

  const updateProspectMutation = useMutation({
    mutationFn: async (data: ProspectFormData) => {
      // Sanitize all inputs
      const sanitizedData = {
        nome: sanitizeInput(data.nome),
        email: data.email ? sanitizeInput(data.email) : null,
        telefone: data.telefone ? sanitizeInput(data.telefone) : null,
        empresa_cliente: data.empresa_cliente ? sanitizeInput(data.empresa_cliente) : null,
        cargo: data.cargo ? sanitizeInput(data.cargo) : null,
        stage: data.stage === "default" ? null : data.stage,
        valor_estimado: data.valor_estimado ? parseFloat(data.valor_estimado) : null,
        origem: data.origem ? sanitizeInput(data.origem) : null,
        tags: data.tags ? data.tags.split(',').map(tag => sanitizeInput(tag)).filter(Boolean) : [],
        responsavel_id: data.responsavel_id === "default" ? null : data.responsavel_id,
        proximo_followup: data.proximo_followup || null,
        observacoes: data.observacoes ? sanitizeHtml(data.observacoes) : null,
      };
      
      const { error } = await supabase
        .from('crm_prospects')
        .update(sanitizedData)
        .eq('id', prospect.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-prospects'] });
      toast({
        title: "Prospect atualizado",
        description: "As informações do prospect foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating prospect:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o prospect.",
        variant: "destructive",
      });
    },
  });

  const deleteProspectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('crm_prospects')
        .delete()
        .eq('id', prospect.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-prospects'] });
      toast({
        title: "Prospect removido",
        description: "O prospect foi removido com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error deleting prospect:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o prospect.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProspectFormData) => {
    setIsLoading(true);
    updateProspectMutation.mutate(data);
    setIsLoading(false);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja remover este prospect? Esta ação não pode ser desfeita.")) {
      deleteProspectMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Prospect</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do prospect" maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com" maxLength={255} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(11) 99999-9999" maxLength={20} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="empresa_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da empresa" maxLength={200} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cargo do prospect" maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a etapa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Selecione a etapa</SelectItem>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Site, LinkedIn, Indicação..." maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Selecione o responsável</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.nome} {member.sobrenome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proximo_followup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próximo Follow-up</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Tag1, Tag2, Tag3..." maxLength={200} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações sobre o prospect..." maxLength={1000} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteProspectMutation.isPending}
              >
                {deleteProspectMutation.isPending ? "Removendo..." : "Remover"}
              </Button>
              
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
