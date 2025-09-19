import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ContractDocument {
  id: string;
  nome: string;
  tipo_arquivo?: string;
  tamanho?: number;
  url_arquivo?: string;
  created_at: string;
  created_by?: string;
}

export const useContractDocuments = (contractId: string) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    if (!userProfile?.empresa_id || !contractId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contratos_documentos')
        .select('*')
        .eq('contrato_id', contractId)
        .eq('empresa_id', userProfile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar documentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os documentos.",
          variant: "destructive",
        });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, fileName: string) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Usuário não possui empresa associada.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Upload do arquivo para o Supabase Storage
      const fileExtension = file.name.split('.').pop();
      const fileName_sanitized = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '');
      const filePath = `${userProfile.empresa_id}/${contractId}/${Date.now()}-${fileName_sanitized}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        throw uploadError;
      }

      // Obter URL pública do arquivo
      const { data } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(filePath);

      // Inserir documento na tabela contratos_documentos
      const { error } = await supabase
        .from('contratos_documentos')
        .insert([{
          empresa_id: userProfile.empresa_id,
          contrato_id: contractId,
          nome: fileName,
          tipo_arquivo: file.type,
          tamanho: file.size,
          url_arquivo: data.publicUrl,
          created_by: userProfile.user_id
        }]);

      if (error) {
        console.error('Erro ao salvar documento:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Documento adicionado com sucesso!",
      });

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload do documento.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('contratos_documentos')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Erro ao excluir documento:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o documento.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso!",
      });

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [contractId, userProfile?.empresa_id]);

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
};