import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { validateUserStatus } from '@/services/userValidationService';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para validar periodicamente o status do usuário
 * Força logout se o usuário se tornar inativo
 */
export const useUserValidation = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const performValidation = useCallback(async () => {
    if (!user) return;

    try {
      const result = await validateUserStatus();
      
      if (!result.valid) {
        console.warn('🚫 Usuário inválido detectado, forçando logout:', result.message);
        
        // Mostrar mensagem de erro
        toast({
          title: "Acesso Negado",
          description: result.message || "Conta inativa ou não encontrada.",
          variant: "destructive",
          duration: 5000,
        });

        // Forçar logout
        await signOut();
      }
    } catch (error) {
      console.error('💥 Erro na validação periódica:', error);
    }
  }, [user, signOut, toast]);

  // Validar a cada 30 segundos quando o usuário estiver ativo
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(performValidation, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [user, performValidation]);

  // Validar quando a aba ganhar foco
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      performValidation();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, performValidation]);

  return {
    validateUser: performValidation
  };
};