import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  data_nascimento?: string | null;
  peso_kg?: number | null;
  altura_cm?: number | null;
  sexo?: string | null;
  massa_livre_gordura_kg?: number | null;
}

export const useClients = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['clientes', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) {
        throw new Error('Empresa ID não encontrado');
      }

      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone, status, data_nascimento, peso_kg, altura_cm, sexo, massa_livre_gordura_kg')
        .eq('empresa_id', userProfile.empresa_id)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.empresa_id,
  });
};