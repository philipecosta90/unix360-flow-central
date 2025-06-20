
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Contract {
  id: string;
  titulo: string;
  cliente_nome?: string;
  valor?: number;
  data_inicio: string;
  data_fim?: string;
  status: 'ativo' | 'inativo' | 'pendente' | 'cancelado';
  tipo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export const useContracts = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contratos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os contratos.",
          variant: "destructive",
        });
        return;
      }

      // Convert Supabase data to Contract type with proper type assertion
      const contractsData: Contract[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'ativo' | 'inativo' | 'pendente' | 'cancelado'
      }));

      setContracts(contractsData);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contratos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async (contractData: Omit<Contract, "id" | "created_at" | "updated_at">) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contratos')
        .insert({
          empresa_id: userProfile.empresa_id,
          titulo: contractData.titulo,
          cliente_nome: contractData.cliente_nome,
          valor: contractData.valor,
          data_inicio: contractData.data_inicio,
          data_fim: contractData.data_fim,
          status: contractData.status,
          tipo: contractData.tipo,
          observacoes: contractData.observacoes,
          created_by: userProfile.user_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar contrato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o contrato.",
          variant: "destructive",
        });
        return;
      }

      // Convert and add to state with proper type assertion
      const newContract: Contract = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | 'pendente' | 'cancelado'
      };

      setContracts(prev => [newContract, ...prev]);
      
      toast({
        title: "Contrato adicionado!",
        description: `${contractData.titulo} foi adicionado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o contrato.",
        variant: "destructive",
      });
    }
  };

  const handleEditContract = async (contractData: Contract) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contratos')
        .update({
          titulo: contractData.titulo,
          cliente_nome: contractData.cliente_nome,
          valor: contractData.valor,
          data_inicio: contractData.data_inicio,
          data_fim: contractData.data_fim,
          status: contractData.status,
          tipo: contractData.tipo,
          observacoes: contractData.observacoes
        })
        .eq('id', contractData.id)
        .eq('empresa_id', userProfile.empresa_id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar contrato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o contrato.",
          variant: "destructive",
        });
        return;
      }

      // Convert and update state with proper type assertion
      const updatedContract: Contract = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | 'pendente' | 'cancelado'
      };

      setContracts(prev => 
        prev.map(c => c.id === contractData.id ? updatedContract : c)
      );
      
      toast({
        title: "Contrato atualizado!",
        description: `${contractData.titulo} foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contrato.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', contractId)
        .eq('empresa_id', userProfile.empresa_id);

      if (error) {
        console.error('Erro ao excluir contrato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o contrato.",
          variant: "destructive",
        });
        return;
      }

      setContracts(prev => prev.filter(c => c.id !== contractId));
      
      toast({
        title: "Contrato excluído!",
        description: "O contrato foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [userProfile?.empresa_id]);

  return {
    contracts,
    loading,
    handleAddContract,
    handleEditContract,
    handleDeleteContract,
  };
};
