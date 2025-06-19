
export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const isFollowupOverdue = (followupDate: string): boolean => {
  if (!followupDate) return false;
  const today = new Date();
  const followup = new Date(followupDate);
  return followup < today;
};
