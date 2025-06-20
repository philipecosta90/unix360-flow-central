
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required: boolean;
}

interface NicheFieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
}

export const NicheFieldRenderer = ({ field, value, onChange }: NicheFieldRendererProps) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
    </div>
  );
};
