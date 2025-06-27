
import { useLogo } from "@/hooks/useLogo";

interface CompanyLogoProps {
  className?: string;
  fallbackText?: string;
}

export const CompanyLogo = ({ className = "", fallbackText = "UniX360" }: CompanyLogoProps) => {
  const { logo } = useLogo();

  if (logo) {
    return (
      <img
        src={logo}
        alt="Logomarca da empresa"
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <h1 className={`font-bold text-gray-900 ${className}`}>
      {fallbackText}
    </h1>
  );
};
