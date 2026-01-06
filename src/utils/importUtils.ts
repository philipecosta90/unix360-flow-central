import * as XLSX from 'xlsx';

export interface ImportedRow {
  [key: string]: string | undefined;
}

export interface ColumnMapping {
  nome: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  plano_contratado: string | null;
  observacoes: string | null;
  status: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  row: ImportedRow;
  index: number;
}

export interface SoftwareTemplate {
  name: string;
  mappings: Partial<Record<keyof ColumnMapping, string[]>>;
}

// Templates pré-configurados para cada software
export const softwareTemplates: Record<string, SoftwareTemplate> = {
  dietbox: {
    name: 'Dietbox',
    mappings: {
      nome: ['Nome do Paciente', 'Nome Paciente', 'Nome', 'Paciente'],
      email: ['E-mail', 'Email', 'E-Mail'],
      telefone: ['Telefone', 'Celular', 'WhatsApp', 'Tel'],
      data_nascimento: ['Data de Nascimento', 'Nascimento', 'Data Nasc', 'Dt. Nascimento'],
      plano_contratado: ['Plano', 'Tipo de Plano'],
      observacoes: ['Observações', 'Obs', 'Notas'],
    }
  },
  liveclin: {
    name: 'Liveclin',
    mappings: {
      nome: ['Nome Completo', 'Nome', 'Paciente'],
      email: ['Email', 'E-mail'],
      telefone: ['Celular', 'Telefone', 'WhatsApp'],
      data_nascimento: ['Data de Nascimento', 'Nascimento'],
      observacoes: ['Observações', 'Notas'],
    }
  },
  webdiet: {
    name: 'Webdiet',
    mappings: {
      nome: ['Paciente', 'Nome', 'Nome Completo'],
      email: ['E-mail', 'Email'],
      telefone: ['WhatsApp', 'Celular', 'Telefone'],
      data_nascimento: ['Data Nascimento', 'Nascimento'],
      observacoes: ['Observações'],
    }
  },
  primecoaching: {
    name: 'Primecoaching',
    mappings: {
      nome: ['Nome', 'Nome Completo', 'Cliente'],
      email: ['Email', 'E-mail'],
      telefone: ['Telefone/WhatsApp', 'WhatsApp', 'Telefone', 'Celular'],
      data_nascimento: ['Data de Nascimento', 'Nascimento'],
      plano_contratado: ['Plano', 'Serviço'],
      observacoes: ['Observações', 'Notas'],
    }
  },
};

// Parsear arquivo Excel/CSV
export const parseFile = async (file: File): Promise<{ headers: string[]; rows: ImportedRow[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          dateNF: 'dd/mm/yyyy'
        }) as unknown[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Arquivo vazio ou sem dados válidos'));
          return;
        }
        
        const rawHeaders = jsonData[0] as unknown[];
        const headers = rawHeaders.map(h => String(h || '').trim());
        const dataRows = jsonData.slice(1) as unknown[][];
        const rows: ImportedRow[] = dataRows
          .filter(row => Array.isArray(row) && row.some(cell => cell && String(cell).trim()))
          .map(row => {
            const obj: ImportedRow = {};
            headers.forEach((header, index) => {
              const cell = (row as unknown[])[index];
              obj[header] = cell ? String(cell).trim() : undefined;
            });
            return obj;
          });
        
        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsBinaryString(file);
  });
};

// Auto-detectar mapeamento baseado nos headers
export const autoDetectMapping = (
  headers: string[], 
  softwareId?: string
): ColumnMapping => {
  const mapping: ColumnMapping = {
    nome: null,
    email: null,
    telefone: null,
    data_nascimento: null,
    plano_contratado: null,
    observacoes: null,
    status: null,
  };
  
  const template = softwareId ? softwareTemplates[softwareId] : null;
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Para cada campo do mapeamento
  (Object.keys(mapping) as Array<keyof ColumnMapping>).forEach(field => {
    // Primeiro tenta usar o template do software
    if (template?.mappings[field]) {
      for (const possibleName of template.mappings[field]!) {
        const index = normalizedHeaders.findIndex(h => 
          h === possibleName.toLowerCase() || h.includes(possibleName.toLowerCase())
        );
        if (index >= 0) {
          mapping[field] = headers[index];
          return;
        }
      }
    }
    
    // Fallback: busca genérica
    const genericMatches: Record<keyof ColumnMapping, string[]> = {
      nome: ['nome', 'name', 'paciente', 'cliente'],
      email: ['email', 'e-mail', 'mail'],
      telefone: ['telefone', 'celular', 'whatsapp', 'phone', 'tel'],
      data_nascimento: ['nascimento', 'birth', 'nasc', 'data de nascimento'],
      plano_contratado: ['plano', 'plan', 'serviço', 'servico'],
      observacoes: ['observações', 'observacoes', 'obs', 'notas', 'notes'],
      status: ['status', 'situação', 'situacao'],
    };
    
    for (const match of genericMatches[field]) {
      const index = normalizedHeaders.findIndex(h => h.includes(match));
      if (index >= 0 && !mapping[field]) {
        mapping[field] = headers[index];
        break;
      }
    }
  });
  
  return mapping;
};

// Formatar telefone para padrão brasileiro
export const formatPhone = (phone?: string): string | null => {
  if (!phone) return null;
  
  // Remover tudo que não for número
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length < 10) return phone; // Retornar original se muito curto
  
  // Se tem 11 dígitos (com DDD e 9), formatar
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  
  // Se tem 10 dígitos (sem o 9), adicionar
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) 9${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  // Se tem código do país (+55), remover
  if (numbers.length === 13 && numbers.startsWith('55')) {
    const local = numbers.slice(2);
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  
  return phone;
};

// Parsear data em vários formatos
export const parseDate = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim();
  
  // Formatos comuns
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD (ISO)
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      let year: string, month: string, day: string;
      
      if (format.source.startsWith('^(\\d{4})')) {
        // YYYY-MM-DD
        [, year, month, day] = match;
      } else {
        // DD/MM/YYYY ou similar
        [, day, month, year] = match;
      }
      
      // Validar data
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  // Tentar parsear diretamente
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return null;
};

// Validar email
export const validateEmail = (email?: string): boolean => {
  if (!email) return true; // Email não é obrigatório
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

// Validar uma linha de dados
export const validateRow = (
  row: ImportedRow, 
  mapping: ColumnMapping, 
  index: number,
  existingEmails: Set<string>
): ValidationResult => {
  const errors: string[] = [];
  
  // Nome é obrigatório
  const nome = mapping.nome ? row[mapping.nome] : undefined;
  if (!nome || !nome.trim()) {
    errors.push('Nome é obrigatório');
  }
  
  // Validar email se presente
  const email = mapping.email ? row[mapping.email] : undefined;
  if (email && !validateEmail(email)) {
    errors.push('Email inválido');
  }
  
  // Verificar duplicidade de email
  if (email && existingEmails.has(email.toLowerCase())) {
    errors.push('Email duplicado');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    row,
    index
  };
};

// Gerar template de planilha para download
export const generateTemplate = (): Blob => {
  const headers = ['Nome', 'Email', 'Telefone', 'Data de Nascimento', 'Plano', 'Observações'];
  const example = ['João Silva', 'joao@email.com', '11999999999', '01/01/1990', 'Mensal', 'Cliente migrado'];
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, example]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
  
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Mapear status do texto para o enum do banco
export const mapStatus = (status?: string): 'ativo' | 'inativo' | 'lead' | 'prospecto' => {
  if (!status) return 'ativo';
  
  const normalized = status.toLowerCase().trim();
  
  if (['ativo', 'active', 'a'].includes(normalized)) return 'ativo';
  if (['inativo', 'inactive', 'i'].includes(normalized)) return 'inativo';
  if (['lead', 'l'].includes(normalized)) return 'lead';
  if (['prospecto', 'prospect', 'p'].includes(normalized)) return 'prospecto';
  
  return 'ativo'; // Default
};
