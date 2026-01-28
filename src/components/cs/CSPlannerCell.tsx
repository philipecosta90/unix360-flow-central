import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Minus, CalendarIcon, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { toLocalISODate, parseLocalDate, formatDateDisplay } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface MicroMetaCellProps {
  value: string | null;
  onChange: (value: string) => void;
}

export const MicroMetaCell = ({ value, onChange }: MicroMetaCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setEditValue(value || '');
            setIsEditing(false);
          }
        }}
        className="h-7 text-xs w-full min-w-[80px]"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer px-2 py-1 min-h-[28px] text-xs hover:bg-muted rounded truncate max-w-[120px]"
      title={value || 'Clique para adicionar'}
    >
      {value || <span className="text-muted-foreground italic">-</span>}
    </div>
  );
};

interface CheckinCellProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const CheckinCell = ({ value, onChange }: CheckinCellProps) => {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "px-2 py-1 rounded text-xs font-medium transition-colors min-w-[40px]",
        value 
          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-400" 
          : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-400"
      )}
    >
      {value ? 'SIM' : 'NÃO'}
    </button>
  );
};

interface StatusCellProps {
  value: string;
  onChange: (value: string) => void;
}

export const StatusCell = ({ value, onChange }: StatusCellProps) => {
  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    'ok': { label: 'OK', icon: Check, className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
    'pendente': { label: 'Pendente', icon: Minus, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' },
    'ignorado': { label: 'Ignorado', icon: X, className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };

  const current = statusConfig[value] || statusConfig['pendente'];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-7 w-[90px] text-xs border-0", current.className)}>
        <SelectValue>
          <span className="flex items-center gap-1">
            <current.icon className="h-3 w-3" />
            {current.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusConfig).map(([key, config]) => (
          <SelectItem key={key} value={key} className="text-xs">
            <span className="flex items-center gap-1">
              <config.icon className="h-3 w-3" />
              {config.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface TipoContratoCellProps {
  value: string | null;
  onChange: (value: string) => void;
}

export const TipoContratoCell = ({ value, onChange }: TipoContratoCellProps) => {
  const tiposContrato = [
    { value: 'mensal', label: 'Mensal', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    { value: 'trimestral', label: 'Trimestral', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
    { value: 'semestral', label: 'Semestral', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
    { value: 'anual', label: 'Anual', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
    { value: 'parceria', label: 'Parceria', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' },
    { value: 'voucher', label: 'Voucher', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400' },
  ];

  const currentTipo = tiposContrato.find(t => t.value === value?.toLowerCase()) || tiposContrato[0];

  return (
    <Select value={value?.toLowerCase() || ''} onValueChange={onChange}>
      <SelectTrigger className={cn("h-7 w-[100px] text-xs border-0", currentTipo.color)}>
        <SelectValue placeholder="Tipo">
          {currentTipo.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tiposContrato.map((tipo) => (
          <SelectItem key={tipo.value} value={tipo.value} className="text-xs">
            <Badge className={cn("text-xs", tipo.color)}>{tipo.label}</Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface ObservacaoCellProps {
  value: string | null;
  onChange: (value: string) => void;
}

export const ObservacaoCell = ({ value, onChange }: ObservacaoCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setEditValue(value || '');
            setIsEditing(false);
          }
        }}
        className="h-7 text-xs w-full min-w-[100px]"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer px-2 py-1 min-h-[28px] text-xs hover:bg-muted rounded truncate max-w-[150px]"
      title={value || 'Clique para adicionar'}
    >
      {value || <span className="text-muted-foreground italic">...</span>}
    </div>
  );
};

interface CicloSemanaBadgeProps {
  value: number | null;
  max?: number;
}

export const CicloSemanaBadge = ({ value, max = 12 }: CicloSemanaBadgeProps) => {
  const val = value || 1;
  const progress = Math.min(val / max, 1);
  
  // Gradiente de cores baseado no progresso
  const getColor = () => {
    if (progress < 0.33) return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (progress < 0.66) return 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  return (
    <span className={cn(
      "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
      getColor()
    )}>
      {val}
    </span>
  );
};

// Função para calcular dias sem contato
export const calcularDiasSemContato = (ultimoContato: string | null): number => {
  if (!ultimoContato) return -1; // Sem registro
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ultimo = parseLocalDate(ultimoContato);
  ultimo.setHours(0, 0, 0, 0);
  const diffMs = hoje.getTime() - ultimo.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

// Componente para exibir e editar a data do último contato
interface UltimoContatoCellProps {
  value: string | null;
  onChange: (value: string) => void;
}

export const UltimoContatoCell = ({ value, onChange }: UltimoContatoCellProps) => {
  const [open, setOpen] = useState(false);
  const dias = calcularDiasSemContato(value);
  
  // Determina cor e status baseado nos dias
  const getStatus = () => {
    if (dias < 0) return { 
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', 
      label: 'Sem registro',
      isRisk: true
    };
    if (dias <= 7) return { 
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700', 
      label: formatDateDisplay(value!),
      isRisk: false
    };
    if (dias <= 10) return { 
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', 
      label: `${dias} dias`,
      isRisk: false
    };
    return { 
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700', 
      label: `${dias} dias`,
      isRisk: true
    };
  };
  
  const status = getStatus();
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(toLocalISODate(date));
      setOpen(false);
    }
  };
  
  const selectedDate = value ? parseLocalDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 text-xs font-medium border px-2 py-1 gap-1 min-w-[90px] justify-start",
            status.color
          )}
        >
          {status.isRisk && dias > 10 && <AlertTriangle className="h-3 w-3" />}
          <span className="truncate">{status.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          className="pointer-events-auto"
          disabled={(date) => date > new Date()}
        />
      </PopoverContent>
    </Popover>
  );
};
