
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

// Função para sanitizar inputs
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove caracteres perigosos e sanitiza HTML
  return DOMPurify.sanitize(input.trim(), { 
    ALLOWED_TAGS: [],
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
