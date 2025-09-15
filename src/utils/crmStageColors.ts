// Centralized CRM stage color logic to prevent gray fallbacks

// Mapping from hex colors to CSS classes
const hexToClass: { [key: string]: string } = {
  '#3B82F6': 'crm-stage-blue',
  '#F59E0B': 'crm-stage-amber', 
  '#F97316': 'crm-stage-orange',
  '#8B5CF6': 'crm-stage-purple',
  '#10B981': 'crm-stage-emerald',
  '#EF4444': 'crm-stage-red',
  '#6B7280': 'crm-stage-gray',
  '#EC4899': 'crm-stage-pink',
};

// Mapping from stage names to CSS classes (official defaults)
const nameToClass: { [key: string]: string } = {
  'LEAD': 'crm-stage-blue',
  'QUALIFICADO': 'crm-stage-amber',
  'PROPOSTA': 'crm-stage-orange', 
  'NEGOCIAÇÃO': 'crm-stage-purple',
  'FECHADO': 'crm-stage-emerald',
  'PERDIDO': 'crm-stage-red',
};

interface CRMStage {
  cor?: string;
  nome: string;
}

/**
 * Gets the correct CSS class for a CRM stage header
 * Priority: 1) Normalized hex color match, 2) Stage name match, 3) Gray fallback
 */
export const getStageHeaderClass = (stage: CRMStage): string => {
  // Try to match by normalized hex color first
  if (stage.cor) {
    const normalizedColor = stage.cor.trim().toUpperCase();
    const cssClass = hexToClass[normalizedColor];
    if (cssClass) {
      return cssClass;
    }
  }

  // Fall back to stage name mapping
  const normalizedName = stage.nome.trim().toUpperCase();
  const nameClass = nameToClass[normalizedName];
  if (nameClass) {
    return nameClass;
  }

  // Final fallback
  return 'crm-stage-gray';
};