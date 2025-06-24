
import { z } from "zod";
import DOMPurify from "dompurify";

// Esquema de validação para prospect
export const prospectFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().optional(),
  empresa_cliente: z.string().optional(),
  cargo: z.string().optional(),
  stage: z.string().min(1, "Stage é obrigatório"),
  valor_estimado: z
    .union([z.string(), z.number()])
    .transform(val => typeof val === "string" ? parseFloat(val) : val)
    .refine(val => !isNaN(val), "Valor estimado inválido")
    .optional(),
  origem: z.string().optional(),
  tags: z.string().optional(),
  responsavel_id: z.string().optional(),
  proximo_followup: z.string().optional(),
  observacoes: z.string().optional(),
});

// Esquema de validação para login
export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email muito longo"),
  password: z.string()
    .min(1, "Senha é obrigatória")
    .max(128, "Senha muito longa")
});

// Função para sanitizar inputs
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove caracteres perigosos e sanitiza HTML
  return DOMPurify.sanitize(input.trim(), { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// Função para sanitizar HTML
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
};

// Função para validar e sanitizar dados
export const validateAndSanitize = <T>(
  data: T, 
  schema: z.ZodSchema<T>
): z.SafeParseReturnType<T, T> => {
  return schema.safeParse(data);
};
