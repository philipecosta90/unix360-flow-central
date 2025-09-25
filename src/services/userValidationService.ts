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
 * Verifica se o usuário tem um perfil no sistema (ativo ou inativo)
 */
export const validateUserProfile = async (userId: string): Promise<{ hasProfile: boolean; isActive: boolean; profile?: any }> => {
  try {
    logger.security('Validando perfil do usuário', { userId });
    
    const { data, error } = await supabase
      .from('perfis')
      .select('id, ativo, subscription_status, trial_end_date, data_de_expiracao_da_assinatura_ativa')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Erro ao validar perfil do usuário:', error);
      return { hasProfile: false, isActive: false };
    }

    const hasProfile = !!data;
    const isActive = hasProfile ? data.ativo : false;
    
    logger.security('Resultado validação perfil', { 
      hasProfile, 
      isActive, 
      status: hasProfile ? (isActive ? 'Ativo' : 'Inativo') : 'Inexistente' 
    });
    
    return { hasProfile, isActive, profile: data };
  } catch (error) {
    logger.error('Erro inesperado ao validar perfil:', error);
    return { hasProfile: false, isActive: false };
  }
};

/**
 * Nova validação que não força logout para usuários inativos
 * Apenas verifica se o perfil existe
 */
export const validateUserStatus = async (): Promise<{ valid: boolean; message?: string; allowAccess?: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { valid: false, message: 'Usuário não autenticado' };
    }

    const { hasProfile, isActive } = await validateUserProfile(user.id);
    
    if (!hasProfile) {
      return { 
        valid: false, 
        message: 'Perfil não encontrado. Entre em contato com o administrador.',
        allowAccess: false 
      };
    }
    
    if (!isActive) {
      // Usuário tem perfil mas está inativo (assinatura vencida)
      // Permitir acesso limitado com pop-up de renovação
      return { 
        valid: true, 
        allowAccess: true,
        message: 'Assinatura vencida. Acesso limitado.' 
      };
    }

    return { valid: true, allowAccess: true };
  } catch (error) {
    logger.error('Erro ao validar status do usuário:', error);
    return { 
      valid: false, 
      message: 'Erro interno. Tente novamente.',
      allowAccess: false 
    };
  }
};