import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS seguro - domínios específicos permitidos
const ALLOWED_ORIGINS = [
  'https://app.unix360.com.br',
  'https://unix360-flow-central.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace('/**', '')))
    ? origin 
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

interface SubmitAnamneseRequest {
  token: string;
  respostas: Array<{
    pergunta_id: string;
    resposta: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("submit-anamnese: Received request");
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, respostas } = await req.json() as SubmitAnamneseRequest;

    console.log(`submit-anamnese: Processing submission for token ${token}`);

    // Buscar o envio pelo token (sem join com empresas pois não há FK)
    const { data: envio, error: envioError } = await supabase
      .from("anamnese_envios")
      .select(`
        *,
        cliente:clientes(nome, email),
        template:anamnese_templates(nome)
      `)
      .eq("token", token)
      .single();

    if (envioError || !envio) {
      console.error("submit-anamnese: Token not found:", envioError);
      return new Response(
        JSON.stringify({ error: "Link inválido ou não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar dados da empresa separadamente
    let empresa: { nome: string; email: string | null } | null = null;
    if (envio.empresa_id) {
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("nome, email")
        .eq("id", envio.empresa_id)
        .maybeSingle();
      empresa = empresaData;
    }

    console.log(`submit-anamnese: Found envio for empresa ${empresa?.nome || envio.empresa_id}`);

    // Verificar se já foi preenchido
    if (envio.status === "preenchido") {
      console.log("submit-anamnese: Already filled");
      return new Response(
        JSON.stringify({ error: "Este questionário já foi preenchido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se expirou
    const now = new Date();
    const expiraEm = new Date(envio.expira_em);
    if (now > expiraEm) {
      console.log("submit-anamnese: Link expired");
      
      // Atualizar status para expirado
      await supabase
        .from("anamnese_envios")
        .update({ status: "expirado" })
        .eq("id", envio.id);
      
      return new Response(
        JSON.stringify({ error: "Este link expirou. Solicite um novo envio." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Inserir respostas
    const respostasToInsert = respostas.map((r) => ({
      envio_id: envio.id,
      pergunta_id: r.pergunta_id,
      resposta: r.resposta,
    }));

    const { error: respostasError } = await supabase
      .from("anamnese_respostas")
      .insert(respostasToInsert);

    if (respostasError) {
      console.error("submit-anamnese: Error inserting respostas:", respostasError);
      throw new Error(`Erro ao salvar respostas: ${respostasError.message}`);
    }

    // Atualizar status do envio
    const { error: updateError } = await supabase
      .from("anamnese_envios")
      .update({
        status: "preenchido",
        preenchido_em: new Date().toISOString(),
      })
      .eq("id", envio.id);

    if (updateError) {
      console.error("submit-anamnese: Error updating envio:", updateError);
    }

    console.log("submit-anamnese: Respostas saved successfully");

    // Enviar email de notificação para a empresa
    const empresaEmail = empresa?.email;
    const clienteNome = envio.cliente?.nome || "Cliente";
    const empresaNome = empresa?.nome || "UniX360";

    if (empresaEmail) {
      try {
        await resend.emails.send({
          from: `UniX360 <onboarding@resend.dev>`,
          to: [empresaEmail],
          subject: `🎉 ${clienteNome} preencheu a anamnese!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
            </head>
            <body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #43B26D 0%, #37A05B 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                            🎉 Nova Anamnese Preenchida!
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px;">
                          <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Ótimas notícias! <strong>${clienteNome}</strong> acabou de preencher o questionário de anamnese.
                          </p>
                          <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            Acesse o sistema para visualizar as respostas completas e iniciar o acompanhamento.
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 20px 0;">
                                <a href="https://app.unix360.com.br/clientes" style="display: inline-block; background: linear-gradient(135deg, #43B26D 0%, #37A05B 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                  Ver Respostas
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
                          <p style="color: #888; font-size: 14px; margin: 0;">
                            ${empresaNome} - UniX360
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });
        console.log("submit-anamnese: Notification email sent to empresa");
      } catch (emailError) {
        console.error("submit-anamnese: Error sending notification email:", emailError);
        // Não falhar se o email não for enviado
      }
    }

    // Criar notificação no sistema
    const { data: perfisData } = await supabase
      .from("perfis")
      .select("user_id")
      .eq("empresa_id", envio.empresa_id)
      .eq("ativo", true);

    if (perfisData && perfisData.length > 0) {
      const notifications = perfisData.map((perfil) => ({
        user_id: perfil.user_id,
        empresa_id: envio.empresa_id,
        type: "anamnese_preenchida",
        title: "🎉 Anamnese Preenchida!",
        message: `${clienteNome} preencheu o questionário de anamnese`,
        read: false,
      }));

      await supabase.from("notifications").insert(notifications);
      console.log("submit-anamnese: System notifications created");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Respostas enviadas com sucesso!" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("submit-anamnese: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
