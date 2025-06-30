
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
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Apenas usuários autenticados podem cadastrar novos usuários pelo painel.'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client for database queries (to verify permissions)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the token and get user info using getUser()
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Token inválido ou usuário não encontrado:', userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token de autenticação inválido. Faça login novamente.'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('✅ Token válido para usuário:', user.id);

    // Check if current user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('perfis')
      .select('nivel_permissao, empresa_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil do usuário:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao verificar permissões do usuário'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!userProfile) {
      console.error('❌ Perfil do usuário não encontrado para:', user.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Perfil de usuário não encontrado'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (userProfile.nivel_permissao !== 'admin') {
      console.error('❌ Usuário não tem permissão de admin:', userProfile.nivel_permissao);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Apenas administradores podem criar usuários'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('✅ Usuário é admin, prosseguindo...');

    // Parse request body
    const createUserData: CreateUserRequest = await req.json();
    console.log('📄 Dados recebidos:', { ...createUserData, password: '***' });

    const { nome, email, password, nivel_permissao } = createUserData;

    if (!nome || !email || !password || !nivel_permissao) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios: nome, email, password, nivel_permissao'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
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

    console.log('👤 Verificando se usuário já existe...');

    // Check if user already exists by trying to get user by email
    const { data: existingUsers } = await supabaseAdmin
      .from('auth.users')
      .select('email')
      .eq('email', email);

    // Alternative check using admin.listUsers if the above doesn't work
    let userExists = false;
    try {
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
      userExists = usersList.users.some(u => u.email === email);
    } catch (listError) {
      console.log('⚠️ Não foi possível verificar usuários existentes via listUsers');
    }

    if (userExists) {
      console.log('⚠️ Usuário já existe:', email);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Este email já está cadastrado no sistema'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

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
      
      // Handle specific auth errors
      if (authError.message?.includes('User already registered')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Este email já está cadastrado no sistema'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao criar usuário: ${authError.message}`
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao criar usuário - dados não retornados'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
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
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('❌ Erro ao limpar usuário após falha na criação do perfil:', deleteError);
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao criar perfil do usuário: ${profileCreateError.message}`
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
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
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;
    
    if (error.message?.includes('Authorization header is required') || 
        error.message?.includes('Token de autenticação inválido')) {
      errorMessage = 'Sessão expirada. Faça login novamente';
      statusCode = 401;
    } else if (error.message?.includes('Apenas administradores')) {
      errorMessage = error.message;
      statusCode = 403;
    } else if (error.message?.includes('Campos obrigatórios') ||
               error.message?.includes('já está cadastrado')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
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
