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
    resendAnamnese,
  };
}
