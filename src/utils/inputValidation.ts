
import { z } from "zod";
import DOMPurify from "dompurify";

// Esquema de validação para login
export const loginFormSchema = z.object({
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email muito longo"),
  password: z.string()
    .min(1, "Senha é obrigatória")
    .max(128, "Senha muito longa")
});

// Esquema de validação para prospects
export const prospectFormSchema = z.object({
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome muito longo"),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email muito longo")
    .optional()
    .or(z.literal("")),
  telefone: z.string()
    .max(20, "Telefone muito longo")
    .optional()
    .or(z.literal("")),
  empresa_cliente: z.string()
    .max(200, "Nome da empresa muito longo")
    .optional()
    .or(z.literal("")),
  cargo: z.string()
    .max(100, "Cargo muito longo")
    .optional()
    .or(z.literal("")),
  valor_estimado: z.string()
    .optional()
    .or(z.literal("")),
  origem: z.string()
    .max(100, "Origem muito longa")
    .optional()
    .or(z.literal("")),
  tags: z.string()
    .max(200, "Tags muito longas")
    .optional()
    .or(z.literal("")),
  observacoes: z.string()
    .max(1000, "Observações muito longas")
    .optional()
    .or(z.literal(""))
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

// Função para sanitizar HTML mantendo formatação básica
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
