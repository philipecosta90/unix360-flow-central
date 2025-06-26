
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from './types.ts';
import { validateAuth, validateAdminPermissions } from './auth.ts';
import { parseAndValidateRequest } from './validation.ts';
import { sendInviteAndCreateProfile, sendCustomEmail } from './invite.ts';
import { getStatusCodeFromError } from './error-handling.ts';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando processamento da função invite-user');
    console.log('📋 Método da requisição:', req.method);
    console.log('🔍 Content-Type:', req.headers.get('content-type'));

    // Validate authentication and get user ID
    const userId = await validateAuth(req);

    // Validate admin permissions and get user profile
    const userProfile = await validateAdminPermissions(userId);

    // Parse and validate request body
    const inviteData = await parseAndValidateRequest(req);

    // Send invite and create user profile
    const inviteResponse = await sendInviteAndCreateProfile(inviteData, userProfile);

    // Send custom email
    const emailSentSuccessfully = await sendCustomEmail(inviteData, inviteResponse);

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
    
    const statusCode = getStatusCodeFromError(error.message || 'Unknown error occurred');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
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
