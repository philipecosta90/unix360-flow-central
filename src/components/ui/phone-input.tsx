import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  showHelper?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, showHelper = true, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove todos os caracteres não numéricos
      const numericValue = e.target.value.replace(/\D/g, "");
      onChange?.(numericValue);
    };

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder="5511999999999"
          className={cn(className)}
          {...props}
        />
        {showHelper && (
          <p className="text-xs text-muted-foreground">
            Código do país + DDD + número (sem + ou espaços)
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
