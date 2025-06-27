
interface CompanyLogoProps {
  className?: string;
  fallbackText?: string;
}

export const CompanyLogo = ({ className = "", fallbackText = "UniX360" }: CompanyLogoProps) => {
  return (
    <img
      src="/lovable-uploads/33399846-7665-4651-9bc0-24ca1d517bc3.png"
      alt="Logomarca da empresa"
      className={`object-contain ${className}`}
    />
  );
};
