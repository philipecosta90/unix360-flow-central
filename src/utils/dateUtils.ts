/**
 * Converte uma data para string ISO no formato YYYY-MM-DD usando a data local,
 * evitando problemas de timezone que ocorrem com toISOString()
 */
export const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formata uma string de data YYYY-MM-DD diretamente para DD/MM/YYYY
 * sem conversão para objeto Date, evitando problemas de timezone
 */
export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "-";
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return "-";
  }
};
