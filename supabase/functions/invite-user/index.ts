
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  nome: string;
  nivel_permissao: 'admin' | 'editor' | 'visualizacao' | 'operacional';
}

// Function to decode JWT payload (without signature validation)
function decodeJWTPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Failed to decode JWT payload');
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando processamento da função invite-user');
    console.log('📋 Método da requisição:', req.method);
    console.log('🔍 Content-Type:', req.headers.get('content-type'));

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    console.log('🔍 Authorization header recebido:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader) {
      console.error('❌ Authorization header não encontrado');
      throw new Error('Authorization header is required');
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token || token === authHeader) {
      console.error('❌ Formato do authorization header inválido:', authHeader.substring(0, 100));
      throw new Error('Invalid authorization header format');
    }

    // Verificar se o token parece ser um JWT (contém pontos)
    if (!token.includes('.')) {
      console.error('❌ Token não parece ser um JWT válido (sem pontos):', token.substring(0, 100));
      throw new Error('Invalid JWT token format');
    }

    console.log('✅ Token JWT extraído com sucesso (primeiros 50 chars):', token.substring(0, 50) + '...');

    // Decode JWT payload to get user_id
    console.log('🔓 Decodificando payload do JWT...');
    let jwtPayload;
    try {
      jwtPayload = decodeJWTPayload(token);
      console.log('✅ JWT payload decodificado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao decodificar JWT payload:', error);
      throw new Error('Invalid JWT token payload');
    }

    const userId = jwtPayload.sub;
    if (!userId) {
      console.error('❌ User ID (sub) não encontrado no JWT payload');
      throw new Error('User ID not found in JWT payload');
    }

    console.log('✅ User ID extraído do JWT:', userId);

    // Create Supabase client for database queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check if current user is admin by querying the perfis table
    console.log('🔍 Verificando permissões do usuário...');
    const { data: userProfile, error: profileError } = await supabase
      .from('perfis')
      .select('nivel_permissao, empresa_id')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil do usuário:', profileError);
      throw new Error('User profile not found');
    }

    console.log('👤 Perfil do usuário:', { nivel_permissao: userProfile.nivel_permissao, empresa_id: userProfile.empresa_id });

    if (userProfile.nivel_permissao !== 'admin') {
      console.error('❌ Usuário não tem permissão de admin:', userProfile.nivel_permissao);
      throw new Error('Admin permission required to invite users');
    }

    console.log('✅ Usuário é admin, prosseguindo com o convite...');

    // Parse request body com logs detalhados
    console.log('📄 Iniciando parsing do corpo da requisição...');
    
    let requestBody: string;
    try {
      requestBody = await req.text();
      console.log('📄 Corpo da requisição recebido (raw):', requestBody);
      console.log('📏 Tamanho do corpo:', requestBody ? requestBody.length : 0);
    } catch (error) {
      console.error('❌ Erro ao ler o corpo da requisição:', error);
      throw new Error('Failed to read request body');
    }

    // Verificar se o corpo não está vazio
    if (!requestBody || requestBody.trim() === '') {
      console.error('❌ Corpo da requisição está vazio');
      throw new Error('Corpo da requisição inválido ou vazio');
    }

    // Parse JSON
    let inviteData: InviteRequest;
    try {
      console.log('🔄 Tentando fazer parse do JSON...');
      inviteData = JSON.parse(requestBody);
      console.log('✅ JSON parseado com sucesso:', JSON.stringify(inviteData, null, 2));
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('❌ Conteúdo que causou erro:', requestBody);
      throw new Error('Corpo da requisição inválido ou vazio');
    }

    // Validar estrutura do JSON
    const { email, nome, nivel_permissao } = inviteData || {};

    if (!email || !nome || !nivel_permissao) {
      console.error('❌ Campos obrigatórios faltando:', { 
        email: !!email, 
        nome: !!nome, 
        nivel_permissao: !!nivel_permissao,
        received_data: inviteData 
      });
      throw new Error('Missing required fields: email, nome, nivel_permissao');
    }

    // Validar tipos dos campos
    if (typeof email !== 'string' || typeof nome !== 'string' || typeof nivel_permissao !== 'string') {
      console.error('❌ Tipos de campos inválidos:', {
        email_type: typeof email,
        nome_type: typeof nome,
        nivel_permissao_type: typeof nivel_permissao
      });
      throw new Error('Invalid field types in request body');
    }

    // Validar nível de permissão
    const validPermissions = ['admin', 'editor', 'visualizacao', 'operacional'];
    if (!validPermissions.includes(nivel_permissao)) {
      console.error('❌ Nível de permissão inválido:', nivel_permissao);
      throw new Error('Invalid permission level');
    }

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
      const htmlTemplate = `
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
      
      // Fallback: tentar reenviar o convite padrão do Supabase se o personalizado falhar
      try {
        console.log('🔄 Executando fallback - reenviando convite padrão...');
        const { error: fallbackError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          email,
          {
            data: {
              nome: nome,
              nivel_permissao: nivel_permissao,
              empresa_id: userProfile.empresa_id
            }
          }
        );
        
        if (fallbackError) {
          console.error('❌ Fallback também falhou:', fallbackError);
        } else {
          console.log('✅ Fallback executado com sucesso - convite padrão enviado');
        }
      } catch (fallbackSendError) {
        console.error('❌ Erro crítico no fallback:', fallbackSendError);
      }
    }

    // Resposta de sucesso
    const responseMessage = emailSentSuccessfully 
      ? 'Convite personalizado enviado com sucesso via unix360.com.br'
      : 'Convite enviado via sistema padrão (fallback ativado)';

    console.log(`✅ Processo concluído: ${responseMessage}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        user: inviteResponse.user,
        email_sent_via_resend: emailSentSuccessfully
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('💥 Erro na função invite-user:', error);
    
    let statusCode = 500;
    let errorMessage = error.message || 'Unknown error occurred';

    // Set appropriate status codes based on error type
    if (errorMessage.includes('Authorization header is required') || 
        errorMessage.includes('Invalid JWT token') ||
        errorMessage.includes('User ID not found') ||
        errorMessage.includes('Invalid authorization header format')) {
      statusCode = 401;
    } else if (errorMessage.includes('Admin permission required') || 
               errorMessage.includes('not allowed')) {
      statusCode = 403;
    } else if (errorMessage.includes('Missing required fields') ||
               errorMessage.includes('Corpo da requisição inválido ou vazio') ||
               errorMessage.includes('Invalid field types') ||
               errorMessage.includes('Invalid permission level') ||
               errorMessage.includes('Failed to read request body')) {
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
