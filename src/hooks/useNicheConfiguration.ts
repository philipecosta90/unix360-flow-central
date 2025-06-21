
import { useState, useEffect } from "react";
import { NICHE_TEMPLATES, type NicheConfig } from "@/constants/nicheTemplates";
import { useNicheSettings } from "./useNicheSettings";

export const useNicheConfiguration = () => {
  const { settings, isLoading } = useNicheSettings();
  const [selectedNiche, setSelectedNiche] = useState<keyof typeof NICHE_TEMPLATES | 'custom'>('fitness');
  const [config, setConfig] = useState<NicheConfig>({
    ...NICHE_TEMPLATES.fitness,
    leadStages: [...NICHE_TEMPLATES.fitness.leadStages],
    customFields: NICHE_TEMPLATES.fitness.customFields.map(field => ({
      ...field,
      options: field.type === 'select' && field.options ? [...field.options] : undefined
    })),
    metrics: [...NICHE_TEMPLATES.fitness.metrics]
  });

  useEffect(() => {
    if (settings && !isLoading) {
      console.log('Carregando configurações salvas:', settings);
      setSelectedNiche(settings.niche_type as keyof typeof NICHE_TEMPLATES || 'fitness');
      setConfig(settings.config);
    }
  }, [settings, isLoading]);

  const handleNicheChange = (niche: keyof typeof NICHE_TEMPLATES | 'custom') => {
    console.log('Mudando nicho para:', niche);
    setSelectedNiche(niche);
    if (niche !== 'custom') {
      const template = NICHE_TEMPLATES[niche];
      setConfig({
        name: template.name,
        leadStages: [...template.leadStages],
        customFields: template.customFields.map(field => ({
          id: field.id,
          name: field.name,
          type: field.type,
          options: field.type === 'select' && field.options ? [...field.options] : undefined,
          required: field.required
        })),
        metrics: [...template.metrics]
      });
    }
  };

  return {
    selectedNiche,
    config,
    setConfig,
    handleNicheChange,
    isLoading
  };
};
