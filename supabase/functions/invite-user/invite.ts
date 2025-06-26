
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";
import { InviteRequest } from './types.ts';

export async function sendInviteAndCreateProfile(inviteData: InviteRequest, userProfile: any) {
  const { email, nome, nivel_permissao } = inviteData;
  
  console.log('📧 Enviando convite para:', { email, nome, nivel_permissao });

  // Create Supabase admin client for privileged operations
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Invite user using admin client
  const { data: inviteResponse, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        nome: nome,
        nivel_permissao: nivel_permissao,
        empresa_id: userProfile.empresa_id
      },
      redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.supabase.co/auth/v1/verify`
    }
  );

  if (inviteError) {
    console.error('❌ Erro ao enviar convite:', inviteError);
    throw new Error(`Failed to invite user: ${inviteError.message}`);
  }

  console.log('✅ Convite enviado com sucesso:', inviteResponse.user?.id);

  // If user was invited successfully, create their profile
  if (inviteResponse.user) {
    console.log('👤 Criando perfil do usuário convidado...');
    const { error: profileCreateError } = await supabaseAdmin
      .from('perfis')
      .insert({
        user_id: inviteResponse.user.id,
        empresa_id: userProfile.empresa_id,
        nome: nome,
        nivel_permissao: nivel_permissao
      });

    if (profileCreateError) {
      console.error('❌ Erro ao criar perfil do usuário:', profileCreateError);
      console.log('⚠️ Perfil não criado, mas convite foi enviado');
    } else {
      console.log('✅ Perfil do usuário criado com sucesso');
    }
  }

  return inviteResponse;
}

export async function sendCustomEmail(inviteData: InviteRequest, inviteResponse: any) {
  const { email, nome, nivel_permissao } = inviteData;
  
  // Send custom professional email using Resend with unix360.com.br domain
  console.log('📧 Enviando convite personalizado via Resend (no-reply@unix360.com.br)...');
  let emailSentSuccessfully = false;
  
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY não configurada');
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);
    
    // Construir URL de convite personalizada
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://hfqzbljiwkrksmjyfdiy';
    const inviteUrl = `${baseUrl}.supabase.co/auth/v1/verify?token=${inviteResponse.user?.email_confirm_token || 'token'}&type=invite&redirect_to=${encodeURIComponent(window?.location?.origin || 'https://id-preview--80384adc-3096-43a9-9362-e214605557ea.lovable.app/')}`;
    
    // Template HTML profissional e responsivo
    const htmlTemplate = generateEmailTemplate(nome, nivel_permissao, email, inviteUrl);

    console.log('📨 Enviando e-mail via Resend...');
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'UniX360 <no-reply@unix360.com.br>',
      to: [email],
      subject: `🎉 Bem-vindo ao UniX360 - Ative sua conta`,
      html: htmlTemplate,
    });

    if (emailError) {
      console.error('❌ Erro detalhado do Resend:', JSON.stringify(emailError, null, 2));
      throw new Error(`Resend API error: ${emailError.message || JSON.stringify(emailError)}`);
    }

    console.log('✅ E-mail personalizado enviado com sucesso via Resend:', emailData);
    emailSentSuccessfully = true;

  } catch (emailSendError) {
    console.error('❌ Erro ao enviar e-mail personalizado via Resend:', emailSendError);
    console.log('⚠️ Tentando fallback para convite padrão do Supabase...');
    
    // Fallback logic here if needed
  }

  return emailSentSuccessfully;
}

function generateEmailTemplate(nome: string, nivel_permissao: string, email: string, inviteUrl: string): string {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite UniX360</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
      <!-- Header com logo -->
      <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 20px; text-align: center;">
        <div style="background-color: rgba(255, 255, 255, 0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 32px; font-weight: bold;">U</span>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">UniX360</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Sistema de Gestão Integrada</p>
      </div>

      <!-- Conteúdo principal -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Olá, ${nome}!</h2>
        
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin: 0 0 20px;">
          Você foi convidado para acessar o <strong>UniX360</strong> com nível de permissão <span style="background-color: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${nivel_permissao}</span>.
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin: 0 0 30px;">
          Para ativar sua conta e definir sua senha, clique no botão abaixo:
        </p>

        <!-- Botão de ação -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${inviteUrl}" 
             style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3); transition: all 0.3s ease;">
            🚀 Aceitar Convite
          </a>
        </div>

        <!-- Informações adicionais -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #4F46E5; margin: 30px 0;">
          <h4 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">🔐 Sobre seu acesso</h4>
          <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">
            Seu convite foi configurado para o nível <strong>${nivel_permissao}</strong>. Após ativar sua conta, você terá acesso às funcionalidades correspondentes ao seu perfil.
          </p>
        </div>
      </div>

      <!-- Rodapé -->
      <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; line-height: 1.4;">
          Este convite foi enviado para <strong>${email}</strong>
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 15px; line-height: 1.4;">
          Se não esperava este e-mail, pode ignorá-lo com segurança.
        </p>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0; font-weight: 500;">
            © 2024 UniX360 - Sistema de Gestão Integrada
          </p>
        </div>
      </div>
      
    </div>
  </body>
  </html>
  `;
}
