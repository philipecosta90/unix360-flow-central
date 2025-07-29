
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

// Esquema de validação para signup
export const signupSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(128, "Senha muito longa"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  nomeEmpresa: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres").max(100, "Nome da empresa muito longo")
});

// Função para sanitizar inputs
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove caracteres perigosos e sanitiza HTML, mas preserva espaços
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
};

// Função específica para sanitizar campos de nome
export const sanitizeNameInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove apenas caracteres realmente perigosos, preservando espaços, acentos e hífens
  return input
    .replace(/[<>\"\'&]/g, '') // Remove apenas caracteres HTML perigosos
    .replace(/\s+/g, ' ') // Normaliza múltiplos espaços para um único espaço
    .trim();
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
