import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WhatsAppInstance {
  id: string;
  empresa_id: string;
  nome: string;
  numero: string;
  status: "disconnected" | "connecting" | "connected";
  jid: string | null;
  webhook: string | null;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppInstances = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Buscar instâncias
  const fetchInstances = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInstances((data as WhatsAppInstance[]) || []);
    } catch (error) {
      console.error("Erro ao buscar instâncias:", error);
      toast.error("Erro ao carregar instâncias do WhatsApp");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Criar instância
  const createInstance = async (nome: string, numero: string) => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-create-instance",
        {
          body: { nome, numero },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar instância");
      }

      toast.success("Instância criada com sucesso!");
      await fetchInstances();
      return data.instance;
    } catch (error) {
      console.error("Erro ao criar instância:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar instância"
      );
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Reconectar instância
  const connectInstance = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-connect",
        {
          body: { instanceId },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao conectar");
      }

      toast.success("Conexão iniciada!");
      await fetchInstances();
      return data;
    } catch (error) {
      console.error("Erro ao conectar:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao conectar instância"
      );
      throw error;
    }
  };

  // Obter QR Code
  const getQRCode = useCallback(async (instanceId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(
        `https://hfqzbljiwkrksmjyfdiy.supabase.co/functions/v1/whatsapp-qrcode?instanceId=${instanceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao obter QR Code");
      }

      return result.qrcode;
    } catch (error) {
      console.error("Erro ao obter QR Code:", error);
      throw error;
    }
  }, []);

  // Obter código de pareamento por telefone
  const getPairCode = async (instanceId: string, phone: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-pair-phone",
        {
          body: { instanceId, phone },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao obter código de pareamento");
      }

      return data.pairCode;
    } catch (error) {
      console.error("Erro ao obter código:", error);
      throw error;
    }
  };

  // Verificar status
  const checkStatus = async (instanceId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(
        `https://hfqzbljiwkrksmjyfdiy.supabase.co/functions/v1/whatsapp-status?instanceId=${instanceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Atualizar estado local
        setInstances((prev) =>
          prev.map((inst) =>
            inst.id === instanceId
              ? { ...inst, status: result.status, jid: result.jid }
              : inst
          )
        );
      }

      return result;
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      throw error;
    }
  };

  // Deletar instância
  const deleteInstance = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from("whatsapp_instances")
        .delete()
        .eq("id", instanceId);

      if (error) throw error;

      toast.success("Instância removida com sucesso!");
      await fetchInstances();
    } catch (error) {
      console.error("Erro ao deletar instância:", error);
      toast.error("Erro ao remover instância");
      throw error;
    }
  };

  // Carregar instâncias ao montar
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    isCreating,
    createInstance,
    connectInstance,
    getQRCode,
    getPairCode,
    checkStatus,
    deleteInstance,
    refetch: fetchInstances,
  };
};
