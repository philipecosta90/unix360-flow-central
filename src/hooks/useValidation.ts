import { z } from 'zod';
import DOMPurify from 'dompurify';

// Schemas de validação centralizados
export const ValidationSchemas = {
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  
  cpfCnpj: z.string()
    .min(11, 'CPF/CNPJ deve ter no mínimo 11 caracteres')
    .max(18, 'CPF/CNPJ deve ter no máximo 18 caracteres')
    .refine((value) => {
      // Remove caracteres especiais
      const numbers = value.replace(/\D/g, '');
      return numbers.length === 11 || numbers.length === 14;
    }, 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'),
  
  phone: z.string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos'),
  
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .refine((value) => {
      // Não permite apenas números ou caracteres especiais
      return /^[a-zA-ZÀ-ÿ\s]+$/.test(value);
    }, 'Nome deve conter apenas letras'),
  
  prospect: z.object({
    nome: z.string().min(2, 'Nome é obrigatório'),
    email: z.union([z.string().email('Email inválido'), z.literal("")]).optional(),
    telefone: z.string().optional(),
    empresa_cliente: z.string().optional(),
    valor_estimado: z.number().positive('Valor deve ser positivo').optional(),
    stage: z.string().min(1, 'Stage é obrigatório'),
    origem: z.string().optional(),
    observacoes: z.string().optional(),
    tags: z.array(z.string()).optional()
  }),
  
  client: z.object({
    nome: z.string().min(2, 'Nome é obrigatório'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefone: z.string().optional(),
    status: z.enum(['lead', 'cliente', 'ex_cliente']),
    plano_contratado: z.string().optional(),
    observacoes: z.string().optional(),
    tags: z.array(z.string()).optional()
  }),
  
  transaction: z.object({
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    valor: z.number().positive('Valor deve ser positivo'),
    data: z.string().min(1, 'Data é obrigatória'),
    categoria: z.string().min(1, 'Categoria é obrigatória'),
    tipo: z.enum(['receita', 'despesa']),
    recorrente: z.boolean().optional(),
    a_receber: z.boolean().optional()
  })
};

// Função para sanitizar entrada do usuário
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove scripts maliciosos e HTML
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  // Remove caracteres de controle e espaços extras
  return cleaned.trim().replace(/[\x00-\x1F\x7F]/g, '');
};

// Função para sanitizar objetos
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeInput(sanitized[key] as string);
    } else if (Array.isArray(sanitized[key])) {
      (sanitized as any)[key] = (sanitized[key] as any[]).map((item: any) => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    }
  }
  
  return sanitized;
};

// Hook principal de validação
export const useValidation = () => {
  const validateField = <T>(schema: z.ZodSchema<T>, value: T) => {
    try {
      schema.parse(value);
      return { isValid: true, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          isValid: false, 
          error: error.errors[0]?.message || 'Valor inválido' 
        };
      }
      return { isValid: false, error: 'Erro de validação' };
    }
  };

  const validateForm = <T>(schema: z.ZodSchema<T>, data: T) => {
    try {
      const sanitizedData = sanitizeObject(data);
      const validated = schema.parse(sanitizedData);
      return { 
        isValid: true, 
        errors: {}, 
        data: validated 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { 
          isValid: false, 
          errors, 
          data: null 
        };
      }
      return { 
        isValid: false, 
        errors: { general: 'Erro de validação' }, 
        data: null 
      };
    }
  };

  const validateEmail = (email: string) => {
    return validateField(ValidationSchemas.email, email);
  };

  const validateCpfCnpj = (cpfCnpj: string) => {
    return validateField(ValidationSchemas.cpfCnpj, cpfCnpj);
  };

  const validatePhone = (phone: string) => {
    return validateField(ValidationSchemas.phone, phone);
  };

  const validateName = (name: string) => {
    return validateField(ValidationSchemas.name, name);
  };

  // Validação de unicidade (para prospects/clientes)
  const checkUniqueness = async (
    table: string,
    field: string,
    value: string,
    excludeId?: string
  ): Promise<{ isUnique: boolean; message?: string }> => {
    try {
      // Esta função seria implementada com uma chamada ao Supabase
      // Por enquanto, retorna true para não quebrar o fluxo
      return { isUnique: true };
    } catch (error) {
      return { 
        isUnique: false, 
        message: 'Erro ao verificar unicidade' 
      };
    }
  };

  return {
    validateField,
    validateForm,
    validateEmail,
    validateCpfCnpj,
    validatePhone,
    validateName,
    checkUniqueness,
    sanitizeInput,
    sanitizeObject,
    schemas: ValidationSchemas
  };
};

// Rate limiting para formulários
export const useFormRateLimit = () => {
  const submissions = new Map<string, number[]>();
  
  const checkRateLimit = (
    formId: string, 
    maxSubmissions: number = 5, 
    windowMs: number = 60000
  ): { allowed: boolean; remainingTime?: number } => {
    const now = Date.now();
    const formSubmissions = submissions.get(formId) || [];
    
    // Remove submissions antigas
    const recentSubmissions = formSubmissions.filter(
      time => now - time < windowMs
    );
    
    if (recentSubmissions.length >= maxSubmissions) {
      const oldestSubmission = Math.min(...recentSubmissions);
      const remainingTime = windowMs - (now - oldestSubmission);
      return { allowed: false, remainingTime };
    }
    
    // Adiciona nova submission
    recentSubmissions.push(now);
    submissions.set(formId, recentSubmissions);
    
    return { allowed: true };
  };
  
  return { checkRateLimit };
};