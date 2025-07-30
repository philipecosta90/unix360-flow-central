import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const AccessDeniedMessage = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleAccessDeniedMessage = (event: CustomEvent) => {
      const message = event.detail?.message || "Acesso negado";
      
      toast({
        title: "Acesso Negado",
        description: message,
        variant: "destructive",
        duration: 8000,
      });
    };

    window.addEventListener('show-access-denied', handleAccessDeniedMessage as EventListener);

    return () => {
      window.removeEventListener('show-access-denied', handleAccessDeniedMessage as EventListener);
    };
  }, [toast]);

  return null;
};