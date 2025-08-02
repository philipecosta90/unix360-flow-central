import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

/**
 * Valida se o usuário atual tem um perfil ativo no sistema
 * Retorna null se o usuário não tiver perfil ou estiver inativo
 */
export const validateActiveUser = async (userId: string): Promise<boolean> => {
  try {
    logger.security('Validando usuário ativo', { userId });
    
    const { data, error } = await supabase
      .from('perfis')
      .select('id, ativo')
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle();

    if (error) {
      logger.error('Erro ao validar usuário ativo:', error);
      return false;
    }

    const isActive = !!data;
    logger.security('Resultado validação', { isActive, status: isActive ? 'Ativo' : 'Inativo/Inexistente' });
    
    return isActive;
  } catch (error) {
    logger.error('Erro inesperado ao validar usuário:', error);
    return false;
  }
};

/**
 * Edge function para validar status do usuário
 * Usado para verificações periódicas durante a navegação
 */
export const validateUserStatus = async (): Promise<{ valid: boolean; message?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { valid: false, message: 'Usuário não autenticado' };
    }

    const isActive = await validateActiveUser(user.id);
    
    if (!isActive) {
      return { 
        valid: false, 
        message: 'Conta inativa ou não encontrada. Entre em contato com o administrador.' 
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Erro ao validar status do usuário:', error);
    return { 
      valid: false, 
      message: 'Erro interno. Tente novamente.' 
    };
  }
};