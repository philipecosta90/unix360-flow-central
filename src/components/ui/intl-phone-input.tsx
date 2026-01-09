import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dataset of countries with dial codes
const COUNTRIES = [
  { iso2: "BR", name: "Brasil", dialCode: "55" },
  { iso2: "US", name: "Estados Unidos", dialCode: "1" },
  { iso2: "PT", name: "Portugal", dialCode: "351" },
  { iso2: "ES", name: "Espanha", dialCode: "34" },
  { iso2: "FR", name: "França", dialCode: "33" },
  { iso2: "DE", name: "Alemanha", dialCode: "49" },
  { iso2: "IT", name: "Itália", dialCode: "39" },
  { iso2: "GB", name: "Reino Unido", dialCode: "44" },
  { iso2: "IE", name: "Irlanda", dialCode: "353" },
  { iso2: "NL", name: "Holanda", dialCode: "31" },
  { iso2: "BE", name: "Bélgica", dialCode: "32" },
  { iso2: "CH", name: "Suíça", dialCode: "41" },
  { iso2: "AT", name: "Áustria", dialCode: "43" },
  { iso2: "PL", name: "Polônia", dialCode: "48" },
  { iso2: "SE", name: "Suécia", dialCode: "46" },
  { iso2: "NO", name: "Noruega", dialCode: "47" },
  { iso2: "DK", name: "Dinamarca", dialCode: "45" },
  { iso2: "FI", name: "Finlândia", dialCode: "358" },
  { iso2: "GR", name: "Grécia", dialCode: "30" },
  { iso2: "CZ", name: "República Tcheca", dialCode: "420" },
  { iso2: "RO", name: "Romênia", dialCode: "40" },
  { iso2: "HU", name: "Hungria", dialCode: "36" },
  { iso2: "AR", name: "Argentina", dialCode: "54" },
  { iso2: "CL", name: "Chile", dialCode: "56" },
  { iso2: "CO", name: "Colômbia", dialCode: "57" },
  { iso2: "PE", name: "Peru", dialCode: "51" },
  { iso2: "VE", name: "Venezuela", dialCode: "58" },
  { iso2: "UY", name: "Uruguai", dialCode: "598" },
  { iso2: "PY", name: "Paraguai", dialCode: "595" },
  { iso2: "BO", name: "Bolívia", dialCode: "591" },
  { iso2: "EC", name: "Equador", dialCode: "593" },
  { iso2: "MX", name: "México", dialCode: "52" },
  { iso2: "CA", name: "Canadá", dialCode: "1" },
  { iso2: "AU", name: "Austrália", dialCode: "61" },
  { iso2: "NZ", name: "Nova Zelândia", dialCode: "64" },
  { iso2: "JP", name: "Japão", dialCode: "81" },
  { iso2: "CN", name: "China", dialCode: "86" },
  { iso2: "IN", name: "Índia", dialCode: "91" },
  { iso2: "KR", name: "Coreia do Sul", dialCode: "82" },
  { iso2: "AE", name: "Emirados Árabes", dialCode: "971" },
  { iso2: "SA", name: "Arábia Saudita", dialCode: "966" },
  { iso2: "IL", name: "Israel", dialCode: "972" },
  { iso2: "ZA", name: "África do Sul", dialCode: "27" },
  { iso2: "EG", name: "Egito", dialCode: "20" },
  { iso2: "NG", name: "Nigéria", dialCode: "234" },
  { iso2: "RU", name: "Rússia", dialCode: "7" },
  { iso2: "UA", name: "Ucrânia", dialCode: "380" },
  { iso2: "TR", name: "Turquia", dialCode: "90" },
];

// Convert ISO2 to flag emoji
function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Try to detect country from phone number
function detectCountryFromPhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return null;

  // Sort by dialCode length descending to match longer codes first
  const sorted = [...COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  for (const country of sorted) {
    if (cleaned.startsWith(country.dialCode)) {
      return country.iso2;
    }
  }

  return null;
}

// Extract local number (without dial code)
function extractLocalNumber(phone: string, dialCode: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith(dialCode)) {
    return cleaned.slice(dialCode.length);
  }
  return cleaned;
}

interface IntlPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function IntlPhoneInput({
  value = "",
  onChange,
  defaultCountry = "BR",
  label,
  helperText,
  disabled = false,
  className,
}: IntlPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const userSelectedCountryRef = useRef(false);
  const previousValueRef = useRef(value);

  // Detect country from value - handles corrupted numbers like "55353..."
  const { detectedCountryIso, normalizedValue } = useMemo(() => {
    if (!value) {
      return { detectedCountryIso: defaultCountry, normalizedValue: "" };
    }

    const cleaned = value.replace(/\D/g, "");
    
    // Sort by dialCode length descending to match longer codes first
    const sorted = [...COUNTRIES].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );

    // First, try direct detection
    for (const country of sorted) {
      if (cleaned.startsWith(country.dialCode)) {
        return { detectedCountryIso: country.iso2, normalizedValue: cleaned };
      }
    }

    // If starts with "55" but also has another valid dial code after, it's corrupted
    // Example: "55353830755996" -> should be "353830755996" (Ireland)
    if (cleaned.startsWith("55") && cleaned.length > 4) {
      const withoutBR = cleaned.slice(2);
      for (const country of sorted) {
        if (country.dialCode !== "55" && withoutBR.startsWith(country.dialCode)) {
          // Found a valid country after removing "55" - this is corrupted data
          return { detectedCountryIso: country.iso2, normalizedValue: withoutBR };
        }
      }
    }

    return { detectedCountryIso: defaultCountry, normalizedValue: cleaned };
  }, [value, defaultCountry]);

  // Sync selectedCountry when value changes from outside (not user interaction)
  useEffect(() => {
    // Only auto-update if user hasn't manually selected a country
    // or if the value changed significantly (different number loaded)
    if (value !== previousValueRef.current) {
      previousValueRef.current = value;
      
      // Reset user selection flag when a new value is loaded
      if (!userSelectedCountryRef.current || value !== previousValueRef.current) {
        userSelectedCountryRef.current = false;
        setSelectedCountry(detectedCountryIso);
      }
    }
  }, [value, detectedCountryIso]);

  // Also update on mount if value exists
  useEffect(() => {
    if (value && !userSelectedCountryRef.current) {
      setSelectedCountry(detectedCountryIso);
    }
  }, []);

  const country = COUNTRIES.find((c) => c.iso2 === selectedCountry) || COUNTRIES[0];

  // Extract local number from normalized value
  const localNumber = useMemo(() => {
    if (!normalizedValue) return "";
    return extractLocalNumber(normalizedValue, country.dialCode);
  }, [normalizedValue, country.dialCode]);

  const handleCountrySelect = (iso2: string) => {
    userSelectedCountryRef.current = true;
    setSelectedCountry(iso2);
    setOpen(false);

    const newCountry = COUNTRIES.find((c) => c.iso2 === iso2);
    if (newCountry && localNumber) {
      onChange?.(newCountry.dialCode + localNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove non-digits
    let cleaned = input.replace(/\D/g, "");

    // Remove leading 0 (trunk prefix) - common in European countries
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }

    // Build full number with dial code
    const fullNumber = country.dialCode + cleaned;
    onChange?.(fullNumber);
  };

  const displayValue = `${country.dialCode}${localNumber}`;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <div className="flex gap-2">
        {/* Country selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[100px] justify-between px-2"
              disabled={disabled}
            >
              <span className="flex items-center gap-1">
                <span className="text-lg">{getFlagEmoji(country.iso2)}</span>
                <span className="text-xs text-muted-foreground">{country.dialCode}</span>
              </span>
              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar país..." />
              <CommandList>
                <CommandEmpty>País não encontrado.</CommandEmpty>
                <CommandGroup>
                  {COUNTRIES.map((c) => (
                    <CommandItem
                      key={c.iso2}
                      value={`${c.name} ${c.dialCode}`}
                      onSelect={() => handleCountrySelect(c.iso2)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountry === c.iso2 ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="mr-2 text-lg">{getFlagEmoji(c.iso2)}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-muted-foreground">{c.dialCode}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Phone number input */}
        <Input
          type="tel"
          placeholder="Número do telefone"
          value={localNumber}
          onChange={handlePhoneChange}
          disabled={disabled}
          className="flex-1"
        />
      </div>

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {value && (
        <p className="text-xs text-muted-foreground">
          Número que será salvo: <span className="font-mono">{displayValue}</span>
        </p>
      )}
    </div>
  );
}
