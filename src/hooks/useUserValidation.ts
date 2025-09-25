import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { validateUserStatus } from '@/services/userValidationService';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para validar periodicamente o status do usuário
 * Nova versão que não força logout para usuários com assinatura vencida
 */
export const useUserValidation = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const performValidation = useCallback(async () => {
    if (!user) return;

    try {
      const result = await validateUserStatus();
      
      // Só fazer logout se o usuário não tem perfil (não existe no sistema)
      if (!result.valid && result.allowAccess === false) {
        console.warn('🚫 Usuário sem perfil detectado, forçando logout:', result.message);
        
        // Mostrar mensagem de erro
        toast({
          title: "Acesso Negado",
          description: result.message || "Perfil não encontrado no sistema.",
          variant: "destructive",
          duration: 5000,
        });

        // Forçar logout apenas para usuários sem perfil
        await signOut();
      }
      // Para usuários com assinatura vencida, o SubscriptionExpiredDialog cuidará da UX
    } catch (error) {
      console.error('💥 Erro na validação periódica:', error);
    }
  }, [user, signOut, toast]);

  // Validar apenas quando o usuário fizer login (não periodicamente)
  useEffect(() => {
    if (user) {
      // Validar uma vez ao fazer login
      performValidation();
    }
  }, [user, performValidation]);

  return {
    validateUser: performValidation
  };
};