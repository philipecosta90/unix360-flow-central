
interface MainLogoProps {
  className?: string;
}

export const MainLogo = ({ className = "" }: MainLogoProps) => {
  return (
    <img
      src="/lovable-uploads/6fac9a09-e2fa-4d1f-af32-5b863d96606a.png"
      alt="UniX360 - Logomarca oficial"
      className={`object-contain ${className}`}
    />
  );
};
