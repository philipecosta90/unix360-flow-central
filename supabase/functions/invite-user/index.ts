
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
      console.error('Missing authorization header');
      throw new Error('Authorization header is required');
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token || token === authHeader) {
      console.error('Invalid authorization header format');
      throw new Error('Invalid authorization header format');
    }

    console.log('Authorization header found, validating token...');

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

    // Verify the user token and get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('Error verifying user token:', userError);
      throw new Error('Invalid or expired authentication token');
    }

    if (!user) {
      console.error('No user found for provided token');
      throw new Error('User not authenticated');
    }

    console.log('User authenticated successfully:', user.id);

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
      throw new Error('Admin permission required to invite users');
    }

    console.log('User is admin, proceeding with invite...');

    // Parse request body
    const { email, nome, nivel_permissao }: InviteRequest = await req.json();

    if (!email || !nome || !nivel_permissao) {
      throw new Error('Missing required fields: email, nome, nivel_permissao');
    }

    console.log('Inviting user:', { email, nome, nivel_permissao });

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
    
    let statusCode = 500;
    let errorMessage = error.message || 'Unknown error occurred';

    // Set appropriate status codes based on error type
    if (errorMessage.includes('Authorization header is required') || 
        errorMessage.includes('Invalid or expired authentication token') ||
        errorMessage.includes('User not authenticated')) {
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
