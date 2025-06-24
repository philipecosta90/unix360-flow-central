
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
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with service role key for admin operations
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

    // Create regular client to verify current user
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

    // Get current user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('User not authenticated');
    }

    console.log('Current user ID:', user.id);

    // Check if current user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('perfis')
      .select('nivel_permissao, empresa_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error getting user profile:', profileError);
      throw new Error('User profile not found');
    }

    if (userProfile.nivel_permissao !== 'admin') {
      console.log('User permission level:', userProfile.nivel_permissao);
      throw new Error('User not allowed - admin permission required');
    }

    console.log('User is admin, proceeding with invite...');

    // Parse request body
    const { email, nome, nivel_permissao }: InviteRequest = await req.json();

    if (!email || !nome || !nivel_permissao) {
      throw new Error('Missing required fields: email, nome, nivel_permissao');
    }

    console.log('Inviting user:', { email, nome, nivel_permissao });

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
      console.error('Error inviting user:', inviteError);
      throw new Error(`Failed to invite user: ${inviteError.message}`);
    }

    console.log('User invited successfully:', inviteData);

    // If user was invited successfully, create their profile
    if (inviteData.user) {
      const { error: profileCreateError } = await supabaseAdmin
        .from('perfis')
        .insert({
          user_id: inviteData.user.id,
          empresa_id: userProfile.empresa_id,
          nome: nome,
          nivel_permissao: nivel_permissao
        });

      if (profileCreateError) {
        console.error('Error creating user profile:', profileCreateError);
        // Don't throw here as the user was already invited
        console.log('Profile creation failed but invite was successful');
      } else {
        console.log('User profile created successfully');
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
    console.error('Error in invite-user function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: error.message.includes('not allowed') ? 403 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
