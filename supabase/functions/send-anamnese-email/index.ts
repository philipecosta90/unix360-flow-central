import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendAnamneseRequest {
  cliente_id: string;
  template_id: string;
  empresa_id: string;
  cliente_nome: string;
  cliente_email: string;
  empresa_nome?: string;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-anamnese-email: Received request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { cliente_id, template_id, empresa_id, cliente_nome, cliente_email, empresa_nome } = await req.json() as SendAnamneseRequest;

    console.log(`send-anamnese-email: Processing request for cliente ${cliente_nome} (${cliente_email})`);

    // Gerar token único
    const token = generateToken();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7); // 7 dias de validade

    // Criar registro de envio
    const { data: envio, error: envioError } = await supabase
      .from("anamnese_envios")
      .insert({
        empresa_id,
        cliente_id,
        template_id,
        token,
        status: "pendente",
        expira_em: expiraEm.toISOString(),
      })
      .select()
      .single();

    if (envioError) {
      console.error("send-anamnese-email: Error creating envio:", envioError);
      throw new Error(`Erro ao criar envio: ${envioError.message}`);
    }

    console.log(`send-anamnese-email: Envio created with ID ${envio.id}`);

    // URL base do app (usar variável de ambiente ou fallback)
    const appUrl = Deno.env.get("APP_URL") || "https://app.unix360.com.br";
    const formLink = `${appUrl}/anamnese/preencher/${token}`;

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: `${empresa_nome || 'UniX360'} <onboarding@resend.dev>`,
      to: [cliente_email],
      subject: `📋 Questionário de Anamnese - ${empresa_nome || 'Sua Consultoria'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #43B26D 0%, #37A05B 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                        Questionário de Anamnese
                      </h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                        ${empresa_nome || 'Sua Consultoria'}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #333; font-size: 18px; margin: 0 0 20px; line-height: 1.6;">
                        Olá <strong>${cliente_nome}</strong>! 👋
                      </p>
                      
                      <p style="color: #555; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                        Parabéns pela decisão! Este é o primeiro passo no caminho em direção aos seus objetivos.
                      </p>
                      
                      <p style="color: #555; font-size: 16px; margin: 0 0 30px; line-height: 1.6;">
                        Para começarmos, precisamos conhecer melhor você. Por favor, preencha o questionário de anamnese clicando no botão abaixo:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${formLink}" style="display: inline-block; background: linear-gradient(135deg, #43B26D 0%, #37A05B 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(67,178,109,0.4);">
                              📋 Preencher Questionário
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
                          <strong>📌 Dicas importantes:</strong>
                        </p>
                        <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                          <li>Reserve um tempo para responder com calma</li>
                          <li>Seja o mais detalhado possível</li>
                          <li>Não omita informações - somos um time!</li>
                          <li>O link é válido por <strong>7 dias</strong></li>
                        </ul>
                      </div>
                      
                      <p style="color: #888; font-size: 14px; margin: 20px 0 0; line-height: 1.6;">
                        Se o botão não funcionar, copie e cole este link no navegador:<br>
                        <a href="${formLink}" style="color: #43B26D; word-break: break-all;">${formLink}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px 40px; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="color: #888; font-size: 14px; margin: 0;">
                        ${empresa_nome || 'UniX360'} - Gestão Inteligente
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

    console.log("send-anamnese-email: Email sent successfully:", emailResponse);

    // Criar notificação no sistema
    const { data: perfisData } = await supabase
      .from("perfis")
      .select("user_id")
      .eq("empresa_id", empresa_id)
      .eq("ativo", true);

    if (perfisData && perfisData.length > 0) {
      const notifications = perfisData.map((perfil) => ({
        user_id: perfil.user_id,
        empresa_id,
        type: "anamnese_enviada",
        title: "Anamnese Enviada",
        message: `Questionário de anamnese enviado para ${cliente_nome}`,
        read: false,
      }));

      await supabase.from("notifications").insert(notifications);
      console.log("send-anamnese-email: Notifications created");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        envio_id: envio.id,
        message: "Anamnese enviada com sucesso" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("send-anamnese-email: Error:", error);
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
