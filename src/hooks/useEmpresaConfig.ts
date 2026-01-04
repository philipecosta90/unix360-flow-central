import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface EmpresaConfig {
  nome: string;
  nome_exibicao: string | null;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
}

export function useEmpresaConfig() {
  const { userProfile } = useAuthContext();
  const [config, setConfig] = useState<EmpresaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.empresa_id) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("empresas")
        .select("nome, nome_exibicao, logo_url, cor_primaria, cor_secundaria")
        .eq("id", userProfile.empresa_id)
        .single();

      if (!error && data) {
        setConfig({
          nome: data.nome,
          nome_exibicao: data.nome_exibicao,
          logo_url: data.logo_url,
          cor_primaria: data.cor_primaria || "#43B26D",
          cor_secundaria: data.cor_secundaria || "#37A05B",
        });
      }
      setLoading(false);
    };

    fetchConfig();
  }, [userProfile?.empresa_id]);

  return { config, loading };
}
