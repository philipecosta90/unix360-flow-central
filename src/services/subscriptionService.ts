import { supabase } from '@/integrations/supabase/client';

export interface CaktoSubscriptionData {
  id_assinatura: string;
  nome: string;
  email: string;
  whatsapp?: string;
  data_de_ativacao: string;
  data_de_expiracao: string;
  status: string;
}

/**
 * Sincroniza dados de assinatura do webhook N8N com o perfil do usuário
 */
export const syncSubscriptionData = async (subscriptionData: CaktoSubscriptionData) => {
  try {
    console.log('Sincronizando dados de assinatura', JSON.stringify(subscriptionData));

    // Buscar o perfil ativo diretamente pelo email
    const { data: profile, error: profileError } = await supabase
      .from('perfis')
      .select('id, user_id, empresa_id, email')
      .eq('email', subscriptionData.email)
      .eq('ativo', true)
      .maybeSingle();

    if (profileError) {
      console.error('Erro ao buscar perfil por email:', profileError);
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    }

    if (!profile) {
      console.warn('Perfil ativo não encontrado para email:', subscriptionData.email);
      return false;
    }

    console.log('Perfil encontrado:', { profileId: profile.id, userId: profile.user_id, email: profile.email, empresaId: profile.empresa_id });

    // Inserir ou atualizar dados na tabela assinaturas_cakto
    const { error: upsertError } = await supabase
      .from('assinaturas_cakto')
      .upsert({
        perfil_id: profile.id,
        id_assinatura: subscriptionData.id_assinatura,
        nome: subscriptionData.nome,
        email: subscriptionData.email,
        whatsapp: subscriptionData.whatsapp,
        data_de_ativacao: subscriptionData.data_de_ativacao,
        data_de_expiracao: subscriptionData.data_de_expiracao,
        status: subscriptionData.status,
      }, {
        onConflict: 'id_assinatura'
      });

    if (upsertError) {
      console.error('Erro ao inserir/atualizar assinatura:', upsertError);
      throw new Error(`Erro ao salvar assinatura: ${upsertError.message}`);
    }

    // Atualizar status no perfil do usuário
    const subscriptionStatus = getSubscriptionStatus(subscriptionData.status);
    const isActive = subscriptionStatus === 'active';

    const { error: updateProfileError } = await supabase
      .from('perfis')
      .update({
        subscription_status: subscriptionStatus,
        subscription_plan: 'premium', // Ou extrair do subscriptionData se disponível
        trial_start_date: null, // Limpar trial se houver assinatura ativa
        trial_end_date: null,
      })
      .eq('id', profile.id);

    if (updateProfileError) {
      console.error('Erro ao atualizar perfil:', updateProfileError);
      throw new Error(`Erro ao atualizar perfil: ${updateProfileError.message}`);
    }

    console.log('Sincronização concluída com sucesso', JSON.stringify({ 
      profileId: profile.id, 
      subscriptionStatus,
      isActive 
    }));

    return true;
  } catch (error) {
    console.error('Erro na sincronização de assinatura:', error);
    return false;
  }
};

/**
 * Mapeia status do Cakto para nossos status internos
 */
const getSubscriptionStatus = (caktoStatus: string): 'trial' | 'active' | 'expired' | 'canceled' => {
  switch (caktoStatus.toLowerCase()) {
    case 'ativo':
    case 'active':
    case 'pago':
      return 'active';
    case 'cancelado':
    case 'canceled':
      return 'canceled';
    case 'expirado':
    case 'expired':
    case 'vencido':
      return 'expired';
    default:
      return 'canceled';
  }
};

/**
 * Verifica e atualiza status de trials expirados
 */
export const checkExpiredTrials = async () => {
  try {
    console.log('Verificando trials expirados');

    const { data: expiredTrials, error } = await supabase
      .from('perfis')
      .select('id, nome, trial_end_date')
      .eq('subscription_status', 'trial')
      .lt('trial_end_date', new Date().toISOString());

    if (error) {
      console.error('Erro ao buscar trials expirados:', error);
      return;
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      console.log('Nenhum trial expirado encontrado');
      return;
    }

    // Atualizar status dos trials expirados
    const expiredIds = expiredTrials.map(trial => trial.id);
    const { error: updateError } = await supabase
      .from('perfis')
      .update({
        subscription_status: 'expired'
      })
      .in('id', expiredIds);

    if (updateError) {
      console.error('Erro ao atualizar trials expirados:', updateError);
    } else {
      console.log(`${expiredTrials.length} trials expirados atualizados`);
    }
  } catch (error) {
    console.error('Erro ao verificar trials expirados:', error);
  }
};