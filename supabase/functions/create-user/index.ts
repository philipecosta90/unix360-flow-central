
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
  console.log('🚀 [CREATE-USER] Função iniciada');
  
  if (req.method === 'OPTIONS') {
    console.log('📋 [CREATE-USER] Respondendo preflight CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar Authorization header
    const authHeader = req.headers.get('authorization');
    console.log('🔑 [CREATE-USER] Auth header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ [CREATE-USER] Authorization header ausente');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token de autenticação necessário'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Criar cliente Supabase com auth do usuário
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar usuário autenticado
    console.log('👤 [CREATE-USER] Verificando usuário autenticado...');
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ [CREATE-USER] Usuário não autenticado:', userError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Sessão inválida. Faça login novamente.'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('✅ [CREATE-USER] Usuário autenticado:', user.id);

    // Buscar perfil do admin para obter empresa_id e verificar permissões
    console.log('🏢 [CREATE-USER] Buscando perfil do admin...');
    const { data: adminProfile, error: profileError } = await supabaseUser
      .from('perfis')
      .select('empresa_id, nivel_permissao, nome')
      .eq('user_id', user.id)
      .single();

    if (profileError || !adminProfile) {
      console.error('❌ [CREATE-USER] Erro ao buscar perfil:', profileError?.message);
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

    console.log('✅ [CREATE-USER] Perfil encontrado:', {
      empresa_id: adminProfile.empresa_id,
      nivel_permissao: adminProfile.nivel_permissao
    });

    // Verificar se é admin
    if (adminProfile.nivel_permissao !== 'admin') {
      console.error('❌ [CREATE-USER] Usuário não é admin:', adminProfile.nivel_permissao);
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

    // Parse dos dados da requisição
    console.log('📝 [CREATE-USER] Parseando dados da requisição...');
    const createUserData: CreateUserRequest = await req.json();
    console.log('📄 [CREATE-USER] Dados recebidos:', {
      nome: createUserData.nome,
      email: createUserData.email,
      nivel_permissao: createUserData.nivel_permissao,
      password: '***'
    });

    const { nome, email, password, nivel_permissao } = createUserData;

    // Validar campos obrigatórios
    if (!nome || !email || !password || !nivel_permissao) {
      console.error('❌ [CREATE-USER] Campos obrigatórios ausentes');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Todos os campos são obrigatórios'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Criar cliente admin com service role
    console.log('🔧 [CREATE-USER] Criando cliente admin...');
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

    // Verificar se usuário já existe
    console.log('🔍 [CREATE-USER] Verificando se usuário já existe...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ [CREATE-USER] Erro ao listar usuários:', listError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const userExists = existingUsers?.users?.some(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );

    if (userExists) {
      console.log('⚠️ [CREATE-USER] Usuário já existe:', email);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Já existe um usuário com este email'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Criar usuário no Auth
    console.log('👤 [CREATE-USER] Criando usuário no Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nome: nome,
      }
    });

    if (authError) {
      console.error('❌ [CREATE-USER] Erro ao criar usuário no Auth:', authError.message);
      
      if (authError.message?.includes('User already registered') || 
          authError.message?.includes('already registered')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Já existe um usuário com este email'
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
      console.error('❌ [CREATE-USER] Usuário não foi criado no Auth');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao criar usuário'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('✅ [CREATE-USER] Usuário criado no Auth:', authData.user.id);

    // Criar perfil na tabela perfis
    console.log('👤 [CREATE-USER] Criando perfil...');
    const { error: profileCreateError } = await supabaseAdmin
      .from('perfis')
      .insert({
        user_id: authData.user.id,
        empresa_id: adminProfile.empresa_id,
        nome: nome,
        nivel_permissao: nivel_permissao,
        ativo: true
      });

    if (profileCreateError) {
      console.error('❌ [CREATE-USER] Erro ao criar perfil:', profileCreateError.message);
      
      // Limpar usuário do Auth se criação do perfil falhou
      console.log('🧹 [CREATE-USER] Removendo usuário do Auth devido erro no perfil...');
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('✅ [CREATE-USER] Usuário removido do Auth');
      } catch (deleteError) {
        console.error('❌ [CREATE-USER] Erro ao remover usuário do Auth:', deleteError);
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao criar perfil: ${profileCreateError.message}`
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('✅ [CREATE-USER] Perfil criado com sucesso');

    // Retorno de sucesso
    console.log('🎉 [CREATE-USER] Usuário criado com sucesso');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário criado com sucesso',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          nome: nome,
          nivel_permissao: nivel_permissao,
          empresa_id: adminProfile.empresa_id
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
    console.error('💥 [CREATE-USER] Erro inesperado:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;
    
    if (error.message?.includes('Authorization') || error.message?.includes('Token')) {
      errorMessage = 'Sessão expirada. Faça login novamente';
      statusCode = 401;
    } else if (error.message?.includes('Permission denied') || error.message?.includes('admin')) {
      errorMessage = 'Permissão negada';
      statusCode = 403;
    } else if (error.message?.includes('duplicate') || error.message?.includes('já está cadastrado')) {
      errorMessage = 'Usuário já existe com este email';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error.message // Para debugging
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
