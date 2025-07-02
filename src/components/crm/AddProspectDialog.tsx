
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useCRMStages } from "@/hooks/useCRMStages";
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

interface AddProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProspectFormData {
  nome: string;
  email: string;
  telefone: string;
  empresa_cliente: string;
  cargo: string;
  stage: string;
  valor_estimado: string;
  origem: string;
  tags: string;
  responsavel_id: string;
  proximo_followup: string;
  observacoes: string;
}

export const AddProspectDialog = ({ open, onOpenChange }: AddProspectDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Usar o hook de stages que já está funcionando
  const { data: stages = [], isLoading: stagesLoading } = useCRMStages();

  const form = useForm<ProspectFormData>({
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      empresa_cliente: "",
      cargo: "",
      stage: "",
      valor_estimado: "",
      origem: "",
      tags: "",
      responsavel_id: "",
      proximo_followup: "",
      observacoes: "",
    },
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

  const createProspectMutation = useMutation({
    mutationFn: async (data: ProspectFormData) => {
      if (!userProfile?.empresa_id) throw new Error('Empresa não encontrada');

      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      // Se não foi selecionado um stage, usar o primeiro stage disponível
      let selectedStageId = data.stage;
      if (!selectedStageId && stages.length > 0) {
        // Ordenar por ordem e pegar o primeiro
        const firstStage = stages.sort((a, b) => a.ordem - b.ordem)[0];
        selectedStageId = firstStage.id;
        console.log('🎯 Stage não selecionado, usando o primeiro:', firstStage.nome, firstStage.id);
      }

      console.log('📝 Criando prospect com stage:', selectedStageId);
      
      const { error } = await supabase
        .from('crm_prospects')
        .insert({
          empresa_id: userProfile.empresa_id,
          nome: data.nome,
          email: data.email || null,
          telefone: data.telefone || null,
          empresa_cliente: data.empresa_cliente || null,
          cargo: data.cargo || null,
          stage: selectedStageId, // Usar o ID do stage, não string
          valor_estimado: data.valor_estimado ? parseFloat(data.valor_estimado) : null,
          origem: data.origem || null,
          tags,
          responsavel_id: data.responsavel_id || null,
          proximo_followup: data.proximo_followup || null,
          observacoes: data.observacoes || null,
          created_by: userProfile.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-prospects'] });
      toast({
        title: "Prospect criado",
        description: "O novo prospect foi adicionado com sucesso.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating prospect:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o prospect.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProspectFormData) => {
    setIsLoading(true);
    createProspectMutation.mutate(data);
    setIsLoading(false);
  };

  // Se não selecionou stage, definir o primeiro como padrão quando stages carregarem
  const firstStage = stages.length > 0 ? stages.sort((a, b) => a.ordem - b.ordem)[0] : null;
  if (firstStage && !form.getValues('stage')) {
    form.setValue('stage', firstStage.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Prospect</DialogTitle>
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
                      <Input {...field} placeholder="Nome do prospect" />
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
                      <Input {...field} type="email" placeholder="email@exemplo.com" />
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
                      <Input {...field} placeholder="(11) 99999-9999" />
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
                      <Input {...field} placeholder="Nome da empresa" />
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
                      <Input {...field} placeholder="Cargo do prospect" />
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={firstStage?.id}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={stagesLoading ? "Carregando..." : "Selecione a etapa"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                      <Input {...field} placeholder="Site, LinkedIn, Indicação..." />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <Input {...field} placeholder="Tag1, Tag2, Tag3..." />
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
                    <Textarea {...field} placeholder="Observações sobre o prospect..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || stagesLoading}>
                {isLoading ? "Criando..." : "Criar Prospect"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
