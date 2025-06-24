
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  nome: string;
  nivel_permissao: 'admin' | 'editor' | 'visualizacao' | 'operacional';
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

    // Create Supabase client for user verification using the JWT token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            authorization: authHeader,
          },
        },
      }
    );

    console.log('🔐 Verificando token do usuário...');

    // Verify the user token and get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('❌ Erro ao verificar token do usuário:', userError);
      throw new Error('Invalid or expired authentication token');
    }

    if (!user) {
      console.error('❌ Usuário não encontrado para o token fornecido');
      throw new Error('User not authenticated');
    }

    console.log('✅ Usuário autenticado com sucesso:', user.id);

    // Check if current user is admin
    console.log('🔍 Verificando permissões do usuário...');
    const { data: userProfile, error: profileError } = await supabase
      .from('perfis')
      .select('nivel_permissao, empresa_id')
      .eq('user_id', user.id)
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
    const { email, nome, nivel_permissao }: InviteRequest = await req.json();

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
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          nome: nome,
          nivel_permissao: nivel_permissao,
          empresa_id: userProfile.empresa_id
        },
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.supabase.co/dashboard`
      }
    );

    if (inviteError) {
      console.error('❌ Erro ao enviar convite:', inviteError);
      throw new Error(`Failed to invite user: ${inviteError.message}`);
    }

    console.log('✅ Convite enviado com sucesso:', inviteData.user?.id);

    // If user was invited successfully, create their profile
    if (inviteData.user) {
      console.log('👤 Criando perfil do usuário convidado...');
      const { error: profileCreateError } = await supabaseAdmin
        .from('perfis')
        .insert({
          user_id: inviteData.user.id,
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User invited successfully',
        user: inviteData.user
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
        errorMessage.includes('Invalid or expired authentication token') ||
        errorMessage.includes('User not authenticated') ||
        errorMessage.includes('Invalid authorization header format') ||
        errorMessage.includes('Invalid JWT token format')) {
      statusCode = 401;
    } else if (errorMessage.includes('Admin permission required') || 
               errorMessage.includes('not allowed')) {
      statusCode = 403;
    } else if (errorMessage.includes('Missing required fields')) {
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
