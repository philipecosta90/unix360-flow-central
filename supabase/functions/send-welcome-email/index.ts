import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  nome: string;
  nomeEmpresa: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome, nomeEmpresa }: WelcomeEmailRequest = await req.json();

    console.log('📧 [WELCOME-EMAIL] Enviando email de boas-vindas para:', email);

    const emailResponse = await resend.emails.send({
      from: "UniX360 <noreply@unix360.com.br>",
      to: [email],
      subject: "🎉 Bem-vindo ao UniX360! Seu trial de 7 dias começou",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao UniX360</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #43B26D; font-size: 24px; font-weight: bold; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
            .trial-badge { background: #43B26D; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
            .button { background: #43B26D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .features { margin: 20px 0; }
            .feature { margin: 10px 0; padding-left: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UniX360</div>
              <h1>Bem-vindo, ${nome}! 🎉</h1>
            </div>
            
            <div class="content">
              <p><strong>Olá ${nome},</strong></p>
              
              <p>Seja muito bem-vindo ao UniX360! Estamos muito felizes em tê-lo conosco.</p>
              
              <div class="trial-badge">
                ✨ Seu trial de 7 dias começou agora!
              </div>
              
              <p>Sua empresa <strong>${nomeEmpresa}</strong> já está configurada e pronta para uso. Durante os próximos 7 dias, você terá acesso completo a todas as funcionalidades:</p>
              
              <div class="features">
                <div class="feature">🎯 <strong>CRM Completo</strong> - Gerencie seus prospects e vendas</div>
                <div class="feature">💰 <strong>Gestão Financeira</strong> - Controle suas receitas e despesas</div>
                <div class="feature">📊 <strong>Dashboard Inteligente</strong> - Métricas em tempo real</div>
                <div class="feature">👥 <strong>Customer Success</strong> - Cuide dos seus clientes</div>
                <div class="feature">📝 <strong>Gestão de Contratos</strong> - Organize seus documentos</div>
                <div class="feature">✅ <strong>Gestão de Tarefas</strong> - Mantenha-se produtivo</div>
              </div>
              
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('//', '//hfqzbljiwkrksmjyfdiy.')}/dashboard" class="button">
                🚀 Acessar minha conta
              </a>
              
              <p><strong>Precisa de ajuda?</strong> Nossa equipe está aqui para apoiá-lo. Responda este email com suas dúvidas ou sugestões.</p>
              
              <p>Aproveite ao máximo seu trial e descobra como o UniX360 pode transformar a gestão da sua empresa!</p>
              
              <p>Sucesso e bons negócios,<br>
              <strong>Equipe UniX360</strong></p>
            </div>
            
            <div class="footer">
              <p>UniX360 - Gestão Empresarial Inteligente<br>
              Este email foi enviado para ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("✅ [WELCOME-EMAIL] Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ [WELCOME-EMAIL] Erro ao enviar email:", error);
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