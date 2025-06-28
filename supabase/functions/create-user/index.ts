
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  nome: string;
  email: string;
  password: string;
  nivel_permissao: 'admin' | 'visualizacao' | 'operacional';
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando criação de usuário...');

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ Authorization header não encontrado');
      throw new Error('Authorization header is required');
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client for database queries (to verify permissions)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the token and get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Token inválido:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('✅ Token válido para usuário:', user.id);

    // Check if current user is admin - using maybeSingle() to avoid errors when no profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('perfis')
      .select('nivel_permissao, empresa_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil do usuário:', profileError);
      throw new Error('Error fetching user profile');
    }

    if (!userProfile) {
      console.error('❌ Perfil do usuário não encontrado para:', user.id);
      throw new Error('User profile not found');
    }

    if (userProfile.nivel_permissao !== 'admin') {
      console.error('❌ Usuário não tem permissão de admin:', userProfile.nivel_permissao);
      throw new Error('Admin permission required');
    }

    console.log('✅ Usuário é admin, prosseguindo...');

    // Parse request body
    const createUserData: CreateUserRequest = await req.json();
    console.log('📄 Dados recebidos:', { ...createUserData, password: '***' });

    const { nome, email, password, nivel_permissao } = createUserData;

    if (!nome || !email || !password || !nivel_permissao) {
      throw new Error('Missing required fields: nome, email, password, nivel_permissao');
    }

    // Create Supabase admin client with service role key
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

    console.log('👤 Criando usuário no Auth...');

    // Create user in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nome: nome,
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create user - no user data returned');
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);

    // Create user profile in perfis table
    console.log('👤 Criando perfil do usuário...');
    const { error: profileCreateError } = await supabaseAdmin
      .from('perfis')
      .insert({
        user_id: authData.user.id,
        empresa_id: userProfile.empresa_id,
        nome: nome,
        nivel_permissao: nivel_permissao,
        ativo: true
      });

    if (profileCreateError) {
      console.error('❌ Erro ao criar perfil:', profileCreateError);
      // Try to delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileCreateError.message}`);
    }

    console.log('✅ Perfil criado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário criado com sucesso',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          nome: nome,
          nivel_permissao: nivel_permissao
        }
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
    console.error('💥 Erro na função create-user:', error);
    
    let statusCode = 500;
    let errorMessage = error.message || 'Unknown error occurred';

    if (errorMessage.includes('Authorization header is required') || 
        errorMessage.includes('Invalid authentication token')) {
      statusCode = 401;
    } else if (errorMessage.includes('Admin permission required')) {
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
});
