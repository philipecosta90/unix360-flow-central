
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
  nome_empresa: string;
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

    // Buscar perfil do admin para verificar permissões
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

    // Verificar se é o super admin específico
    if (user.id !== 'b0896210-8487-4456-a5f1-056a0685ee7f') {
      console.error('❌ [CREATE-USER] Usuário não é super admin:', user.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Apenas o super administrador pode criar usuários'
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
      nome_empresa: createUserData.nome_empresa,
      password: '***'
    });

    const { nome, email, password, nivel_permissao, nome_empresa } = createUserData;

    // Validar campos obrigatórios
    if (!nome || !email || !password || !nivel_permissao || !nome_empresa) {
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

    // INÍCIO DA TRANSAÇÃO
    let newEmpresaId: string | null = null;
    let newUserId: string | null = null;

    try {
      // 1. Criar nova empresa
      console.log('🏢 [CREATE-USER] Criando nova empresa...');
      const { data: empresaData, error: empresaError } = await supabaseAdmin
        .from('empresas')
        .insert({
          nome: nome_empresa,
          email: email,
          ativa: true
        })
        .select()
        .single();

      if (empresaError || !empresaData) {
        console.error('❌ [CREATE-USER] Erro ao criar empresa:', empresaError?.message);
        throw new Error(`Erro ao criar empresa: ${empresaError?.message}`);
      }

      newEmpresaId = empresaData.id;
      console.log('✅ [CREATE-USER] Empresa criada:', newEmpresaId);

      // 2. Criar usuário no Auth
      console.log('👤 [CREATE-USER] Criando usuário no Auth...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          nome: nome,
        }
      });

      if (authError || !authData.user) {
        console.error('❌ [CREATE-USER] Erro ao criar usuário no Auth:', authError?.message);
        throw new Error(`Erro ao criar usuário: ${authError?.message}`);
      }

      newUserId = authData.user.id;
      console.log('✅ [CREATE-USER] Usuário criado no Auth:', newUserId);

      // 3. Criar perfil na tabela perfis (vinculado à NOVA empresa)
      console.log('👤 [CREATE-USER] Criando perfil...');
      const { error: profileCreateError } = await supabaseAdmin
        .from('perfis')
        .insert({
          user_id: newUserId,
          empresa_id: newEmpresaId, // IMPORTANTE: usar a nova empresa, não a do admin
          nome: nome,
          nivel_permissao: nivel_permissao, // Usar o nível de permissão selecionado no formulário
          ativo: true
        });

      if (profileCreateError) {
        console.error('❌ [CREATE-USER] Erro ao criar perfil:', profileCreateError.message);
        throw new Error(`Erro ao criar perfil: ${profileCreateError.message}`);
      }

      console.log('✅ [CREATE-USER] Perfil criado com sucesso');

      // Retorno de sucesso
      console.log('🎉 [CREATE-USER] Usuário e empresa criados com sucesso');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Usuário e empresa criados com sucesso',
          user: {
            id: newUserId,
            email: email,
            nome: nome,
            nivel_permissao: nivel_permissao, // Retornar o nível de permissão correto
            empresa_id: newEmpresaId,
            nome_empresa: nome_empresa
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

    } catch (transactionError: any) {
      console.error('💥 [CREATE-USER] Erro na transação, fazendo rollback...', transactionError);
      
      // Rollback: Remover usuário do Auth se foi criado
      if (newUserId) {
        console.log('🧹 [CREATE-USER] Removendo usuário do Auth...');
        try {
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          console.log('✅ [CREATE-USER] Usuário removido do Auth');
        } catch (deleteError) {
          console.error('❌ [CREATE-USER] Erro ao remover usuário do Auth:', deleteError);
        }
      }

      // Rollback: Remover empresa se foi criada
      if (newEmpresaId) {
        console.log('🧹 [CREATE-USER] Removendo empresa...');
        try {
          await supabaseAdmin
            .from('empresas')
            .delete()
            .eq('id', newEmpresaId);
          console.log('✅ [CREATE-USER] Empresa removida');
        } catch (deleteError) {
          console.error('❌ [CREATE-USER] Erro ao remover empresa:', deleteError);
        }
      }

      throw transactionError;
    }

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
