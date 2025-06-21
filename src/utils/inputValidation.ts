
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim());
};

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { 
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
};

// Validation schemas
export const emailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email muito longo');

export const phoneSchema = z.string()
  .regex(/^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-\s]?\d{4})$/, 'Formato de telefone inválido')
  .or(z.literal(''));

export const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/\d/, 'Senha deve conter pelo menos um número')
  .max(128, 'Senha muito longa');

export const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços');

export const companyNameSchema = z.string()
  .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
  .max(200, 'Nome da empresa muito longo');

export const cnpjSchema = z.string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato de CNPJ inválido (XX.XXX.XXX/XXXX-XX)')
  .or(z.literal(''));

export const textAreaSchema = z.string()
  .max(1000, 'Texto muito longo (máximo 1000 caracteres)');

export const currencySchema = z.string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Valor inválido')
  .transform((val) => parseFloat(val));

// CRM specific validations
export const prospectFormSchema = z.object({
  nome: nameSchema,
  email: emailSchema.or(z.literal('')),
  telefone: phoneSchema,
  empresa_cliente: companyNameSchema.or(z.literal('')),
  cargo: z.string().max(100, 'Cargo muito longo').optional(),
  valor_estimado: z.string().regex(/^\d*\.?\d*$/, 'Valor inválido').optional(),
  origem: z.string().max(100, 'Origem muito longa').optional(),
  tags: z.string().max(200, 'Tags muito longas').optional(),
  observacoes: textAreaSchema.optional(),
});

// Auth form validations
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const signupFormSchema = z.object({
  nome: nameSchema,
  nomeEmpresa: companyNameSchema,
  cnpj: cnpjSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Updated validation helper using Zod's SafeParseReturnType
export const validateAndSanitize = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): z.SafeParseReturnType<unknown, T> => {
  return schema.safeParse(data);
};
