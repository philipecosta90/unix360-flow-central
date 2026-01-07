// Hook para gerenciamento de anamnese
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface AnamneseTemplate {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnamnesePergunta {
  id: string;
  template_id: string;
  secao: string;
  secao_icone: string | null;
  ordem: number;
  pergunta: string;
  tipo: string;
  opcoes: Json;
  obrigatoria: boolean;
  placeholder: string | null;
  created_at: string;
}

export interface AnamneseEnvio {
  id: string;
  empresa_id: string;
  cliente_id: string;
  template_id: string;
  token: string;
  status: string;
  enviado_em: string;
  preenchido_em: string | null;
  expira_em: string;
  cliente?: {
    nome: string;
    email: string;
  } | null;
  template?: {
    nome: string;
  } | null;
}

export interface AnamneseResposta {
  id: string;
  envio_id: string;
  pergunta_id: string;
  resposta: string | null;
  created_at: string;
  pergunta?: AnamnesePergunta | null;
}

export function useAnamnese() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AnamneseTemplate[]>([]);
  const [perguntas, setPerguntas] = useState<AnamnesePergunta[]>([]);
  const [envios, setEnvios] = useState<AnamneseEnvio[]>([]);
  const [respostas, setRespostas] = useState<AnamneseResposta[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!userProfile?.empresa_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("anamnese_templates")
        .select("*")
        .eq("empresa_id", userProfile.empresa_id)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as AnamneseTemplate[]);
    } catch (error: any) {
      console.error("Erro ao buscar templates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userProfile?.empresa_id, toast]);

  const fetchPerguntas = useCallback(async (templateId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("anamnese_perguntas")
        .select("*")
        .eq("template_id", templateId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      const perguntas = (data || []) as AnamnesePergunta[];
      setPerguntas(perguntas);
      return perguntas;
    } catch (error: any) {
      console.error("Erro ao buscar perguntas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as perguntas.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchEnvios = useCallback(async (clienteId?: string) => {
    if (!userProfile?.empresa_id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("anamnese_envios")
        .select(`
          *,
          cliente:clientes(nome, email),
          template:anamnese_templates(nome)
        `)
        .eq("empresa_id", userProfile.empresa_id)
        .order("enviado_em", { ascending: false });

      if (clienteId) {
        query = query.eq("cliente_id", clienteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      const envios = (data || []) as AnamneseEnvio[];
      setEnvios(envios);
      return envios;
    } catch (error: any) {
      console.error("Erro ao buscar envios:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os envios.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [userProfile?.empresa_id, toast]);

  const fetchRespostas = useCallback(async (envioId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("anamnese_respostas")
        .select(`
          *,
          pergunta:anamnese_perguntas(*)
        `)
        .eq("envio_id", envioId);

      if (error) throw error;
      const respostas = (data || []) as AnamneseResposta[];
      setRespostas(respostas);
      return respostas;
    } catch (error: any) {
      console.error("Erro ao buscar respostas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as respostas.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createDefaultTemplate = useCallback(async () => {
    if (!userProfile?.empresa_id) return null;

    try {
      const { data, error } = await supabase
        .rpc("create_default_anamnese_template_for_company", {
          p_empresa_id: userProfile.empresa_id,
        });

      if (error) throw error;
      
      await fetchTemplates();
      return data;
    } catch (error: any) {
      console.error("Erro ao criar template padrão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o template padrão.",
        variant: "destructive",
      });
      return null;
    }
  }, [userProfile?.empresa_id, fetchTemplates, toast]);

  const sendAnamnese = useCallback(async (
    clienteId: string,
    templateId: string,
    clienteNome: string,
    clienteEmail: string
  ) => {
    if (!userProfile?.empresa_id) return false;

    try {
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("nome")
        .eq("id", userProfile.empresa_id)
        .single();

      const { data, error } = await supabase.functions.invoke("send-anamnese-email", {
        body: {
          cliente_id: clienteId,
          template_id: templateId,
          empresa_id: userProfile.empresa_id,
          cliente_nome: clienteNome,
          cliente_email: clienteEmail,
          empresa_nome: empresaData?.nome,
        },
      });

      if (error) throw error;

      toast({
        title: "Anamnese enviada!",
        description: `Questionário enviado para ${clienteEmail}`,
      });

      return true;
    } catch (error: any) {
      console.error("Erro ao enviar anamnese:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a anamnese.",
        variant: "destructive",
      });
      return false;
    }
  }, [userProfile?.empresa_id, toast]);

  const sendAnamneseWhatsApp = useCallback(async (
    clienteId: string,
    templateId: string,
    clienteNome: string,
    clienteTelefone: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-anamnese-whatsapp", {
        body: {
          clienteId,
          templateId,
          clienteNome,
          clienteTelefone,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Anamnese enviada!",
          description: `Questionário enviado para ${clienteNome} via WhatsApp.`,
        });
        return true;
      } else {
        toast({
          title: "Atenção",
          description: data?.message || "Não foi possível enviar a anamnese via WhatsApp.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Erro ao enviar anamnese via WhatsApp:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a anamnese via WhatsApp.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const resendAnamnese = useCallback(async (envioId: string) => {
    try {
      // Buscar dados do envio original
      const { data: envio, error: envioError } = await supabase
        .from("anamnese_envios")
        .select(`
          *,
          cliente:clientes(nome, email)
        `)
        .eq("id", envioId)
        .single();

      if (envioError || !envio) throw envioError;

      const cliente = envio.cliente as { nome: string; email: string } | null;
      
      // Reenviar
      return await sendAnamnese(
        envio.cliente_id,
        envio.template_id,
        cliente?.nome || "",
        cliente?.email || ""
      );
    } catch (error: any) {
      console.error("Erro ao reenviar anamnese:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reenviar a anamnese.",
        variant: "destructive",
      });
      return false;
    }
  }, [sendAnamnese, toast]);

  const deleteEnvio = useCallback(async (envioId: string) => {
    try {
      // Primeiro, deletar as respostas associadas (se existirem)
      const { error: respostasError } = await supabase
        .from("anamnese_respostas")
        .delete()
        .eq("envio_id", envioId);

      if (respostasError) throw respostasError;

      // Depois, deletar o envio
      const { error } = await supabase
        .from("anamnese_envios")
        .delete()
        .eq("id", envioId);

      if (error) throw error;

      toast({
        title: "Anamnese excluída!",
        description: "O registro foi removido com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error("Erro ao excluir envio:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a anamnese.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // ========== CRUD Templates ==========

  const createTemplate = useCallback(async (nome: string, descricao: string) => {
    if (!userProfile?.empresa_id) return null;

    try {
      const { data, error } = await supabase
        .from("anamnese_templates")
        .insert({
          empresa_id: userProfile.empresa_id,
          nome,
          descricao,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Template criado!",
        description: "Agora adicione as perguntas ao template.",
      });

      await fetchTemplates();
      return data as AnamneseTemplate;
    } catch (error: any) {
      console.error("Erro ao criar template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o template.",
        variant: "destructive",
      });
      return null;
    }
  }, [userProfile?.empresa_id, fetchTemplates, toast]);

  const updateTemplate = useCallback(async (
    templateId: string,
    dados: { nome?: string; descricao?: string; ativo?: boolean }
  ) => {
    try {
      const { error } = await supabase
        .from("anamnese_templates")
        .update({ ...dados, updated_at: new Date().toISOString() })
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Template atualizado!",
        description: "As alterações foram salvas.",
      });

      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o template.",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchTemplates, toast]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      // Primeiro, deletar todas as perguntas do template
      const { error: perguntasError } = await supabase
        .from("anamnese_perguntas")
        .delete()
        .eq("template_id", templateId);

      if (perguntasError) throw perguntasError;

      // Depois, deletar o template
      const { error } = await supabase
        .from("anamnese_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Template excluído!",
        description: "O template foi removido com sucesso.",
      });

      await fetchTemplates();
      return true;
    } catch (error: any) {
      console.error("Erro ao excluir template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template.",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchTemplates, toast]);

  const duplicateTemplate = useCallback(async (templateId: string, novoNome: string) => {
    if (!userProfile?.empresa_id) return null;

    try {
      // Buscar template original
      const { data: templateOriginal, error: templateError } = await supabase
        .from("anamnese_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError || !templateOriginal) throw templateError;

      // Criar novo template
      const { data: novoTemplate, error: novoError } = await supabase
        .from("anamnese_templates")
        .insert({
          empresa_id: userProfile.empresa_id,
          nome: novoNome,
          descricao: templateOriginal.descricao,
          ativo: true,
        })
        .select()
        .single();

      if (novoError || !novoTemplate) throw novoError;

      // Buscar perguntas do template original
      const { data: perguntasOriginais, error: perguntasError } = await supabase
        .from("anamnese_perguntas")
        .select("*")
        .eq("template_id", templateId)
        .order("ordem", { ascending: true });

      if (perguntasError) throw perguntasError;

      // Duplicar perguntas para o novo template
      if (perguntasOriginais && perguntasOriginais.length > 0) {
        const novasPerguntas = perguntasOriginais.map((p) => ({
          template_id: novoTemplate.id,
          secao: p.secao,
          secao_icone: p.secao_icone,
          ordem: p.ordem,
          pergunta: p.pergunta,
          tipo: p.tipo,
          opcoes: p.opcoes,
          obrigatoria: p.obrigatoria,
          placeholder: p.placeholder,
        }));

        const { error: insertError } = await supabase
          .from("anamnese_perguntas")
          .insert(novasPerguntas);

        if (insertError) throw insertError;
      }

      toast({
        title: "Template duplicado!",
        description: "O template foi copiado com sucesso.",
      });

      await fetchTemplates();
      return novoTemplate as AnamneseTemplate;
    } catch (error: any) {
      console.error("Erro ao duplicar template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o template.",
        variant: "destructive",
      });
      return null;
    }
  }, [userProfile?.empresa_id, fetchTemplates, toast]);

  // ========== CRUD Perguntas ==========

  const addPergunta = useCallback(async (
    templateId: string,
    pergunta: {
      secao: string;
      secao_icone?: string;
      ordem: number;
      pergunta: string;
      tipo: string;
      opcoes?: string[];
      obrigatoria: boolean;
      placeholder?: string;
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from("anamnese_perguntas")
        .insert({
          template_id: templateId,
          secao: pergunta.secao,
          secao_icone: pergunta.secao_icone || null,
          ordem: pergunta.ordem,
          pergunta: pergunta.pergunta,
          tipo: pergunta.tipo,
          opcoes: pergunta.opcoes ? JSON.stringify(pergunta.opcoes) : null,
          obrigatoria: pergunta.obrigatoria,
          placeholder: pergunta.placeholder || null,
        })
        .select()
        .single();

      if (error) throw error;

      return data as AnamnesePergunta;
    } catch (error: any) {
      console.error("Erro ao adicionar pergunta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a pergunta.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updatePergunta = useCallback(async (
    perguntaId: string,
    dados: {
      secao?: string;
      secao_icone?: string;
      ordem?: number;
      pergunta?: string;
      tipo?: string;
      opcoes?: string[];
      obrigatoria?: boolean;
      placeholder?: string;
    }
  ) => {
    try {
      const updateData: Record<string, unknown> = { ...dados };
      if (dados.opcoes) {
        updateData.opcoes = JSON.stringify(dados.opcoes);
      }

      const { error } = await supabase
        .from("anamnese_perguntas")
        .update(updateData)
        .eq("id", perguntaId);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar pergunta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a pergunta.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const deletePergunta = useCallback(async (perguntaId: string) => {
    try {
      const { error } = await supabase
        .from("anamnese_perguntas")
        .delete()
        .eq("id", perguntaId);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error("Erro ao excluir pergunta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a pergunta.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const updatePerguntasOrdem = useCallback(async (
    perguntas: { id: string; ordem: number }[]
  ) => {
    try {
      for (const p of perguntas) {
        await supabase
          .from("anamnese_perguntas")
          .update({ ordem: p.ordem })
          .eq("id", p.id);
      }
      return true;
    } catch (error: any) {
      console.error("Erro ao reordenar perguntas:", error);
      return false;
    }
  }, []);

  return {
    templates,
    perguntas,
    envios,
    respostas,
    loading,
    fetchTemplates,
    fetchPerguntas,
    fetchEnvios,
    fetchRespostas,
    createDefaultTemplate,
    sendAnamnese,
    sendAnamneseWhatsApp,
    resendAnamnese,
    deleteEnvio,
    // CRUD Templates
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    // CRUD Perguntas
    addPergunta,
    updatePergunta,
    deletePergunta,
    updatePerguntasOrdem,
  };
}
