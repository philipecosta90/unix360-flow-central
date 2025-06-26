
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

    // Parse request body
    let inviteData: InviteRequest;
    try {
      const body = await req.text();
      console.log('📄 Corpo da requisição recebido:', body);
      
      if (!body || body.trim() === '') {
        throw new Error('Empty request body');
      }
      
      inviteData = JSON.parse(body);
      console.log('✅ JSON parseado com sucesso:', inviteData);
    } catch (e) {
      console.error('❌ Erro ao processar corpo da requisição:', e);
      throw new Error('Invalid JSON body');
    }

    const { email, nome, nivel_permissao } = inviteData || {};

    if (!email || !nome || !nivel_permissao) {
      console.error('❌ Campos obrigatórios faltando:', { email: !!email, nome: !!nome, nivel_permissao: !!nivel_permissao });
      throw new Error('Missing required fields: email, nome, nivel_permissao');
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

    // Send custom email using Resend with the new sender email
    console.log('📧 Enviando e-mail de convite personalizado via Resend...');
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.supabase.co/auth/v1/verify?token=${inviteResponse.user?.confirmation_sent_at}&type=invite&redirect_to=${encodeURIComponent('https://your-app-domain.com/login')}`;
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'UniX360 <uni.x360app@gmail.com>',
        to: [email],
        subject: 'Convite para acessar o UniX360',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Bem-vindo ao UniX360!</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Olá, ${nome}!</h2>
              <p style="color: #666; line-height: 1.6;">
                Você foi convidado para acessar o sistema UniX360 com nível de permissão <strong>${nivel_permissao}</strong>.
              </p>
              <p style="color: #666; line-height: 1.6;">
                Para concluir seu cadastro e definir sua senha, clique no botão abaixo:
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Aceitar Convite
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                Este convite foi enviado para ${email}. Se você não esperava receber este e-mail, pode ignorá-lo com segurança.
              </p>
              <p style="color: #999; font-size: 12px; text-align: center;">
                © 2024 UniX360 - Sistema de Gestão Integrada
              </p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        console.error('❌ Erro ao enviar e-mail via Resend:', emailError);
        // Não falha a operação se o e-mail personalizado falhar, pois o convite do Supabase já foi enviado
        console.log('⚠️ E-mail personalizado não enviado, mas convite do Supabase foi processado');
      } else {
        console.log('✅ E-mail personalizado enviado via Resend:', emailData);
      }
    } catch (emailSendError) {
      console.error('❌ Erro ao processar envio de e-mail via Resend:', emailSendError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User invited successfully',
        user: inviteResponse.user
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
               errorMessage.includes('Invalid JSON body') ||
               errorMessage.includes('Empty request body')) {
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
