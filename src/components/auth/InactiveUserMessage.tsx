import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const InactiveUserMessage = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleInactiveUserMessage = () => {
      toast({
        title: "Acesso Negado",
        description: "Conta inativa ou não encontrada. Entre em contato com o administrador.",
        variant: "destructive",
        duration: 5000,
      });
    };

    window.addEventListener('show-inactive-user-message', handleInactiveUserMessage);

    return () => {
      window.removeEventListener('show-inactive-user-message', handleInactiveUserMessage);
    };
  }, [toast]);

  return null;
};