
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useNicheSettings } from "@/hooks/useNicheSettings";
import { useToast } from "@/hooks/use-toast";
import { useNicheConfiguration } from "@/hooks/useNicheConfiguration";
import { NicheSelector } from "./NicheSelector";
import { SalesFunnelSettings } from "./SalesFunnelSettings";
import { MetricsSettings } from "./MetricsSettings";

export const NicheSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { updateSettings } = useNicheSettings();
  const { selectedNiche, config, setConfig, handleNicheChange, isLoading } = useNicheConfiguration();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      const newSettings = {
        niche_type: selectedNiche,
        config: config,
        updated_at: new Date().toISOString()
      };

      console.log('Salvando configurações:', newSettings);
      await updateSettings(newSettings);

      toast({
        title: "Configurações salvas!",
        description: "As configurações do nicho foram salvas com sucesso.",
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Nicho</h1>
          <p className="text-gray-600 mt-2">Personalize o sistema para seu tipo de negócio</p>
        </div>
        <Settings className="w-8 h-8 text-[#43B26D]" />
      </div>

      <NicheSelector
        selectedNiche={selectedNiche}
        config={config}
        onNicheChange={handleNicheChange}
        onConfigChange={setConfig}
      />

      <SalesFunnelSettings
        config={config}
        onConfigChange={setConfig}
      />

      <MetricsSettings
        config={config}
        onConfigChange={setConfig}
      />

      <div className="flex justify-end">
        <Button 
          className="bg-[#43B26D] hover:bg-[#37A05B]"
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};
