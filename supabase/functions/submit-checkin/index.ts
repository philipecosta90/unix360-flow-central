import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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

interface SubmitCheckinRequest {
  token: string;
  respostas: Array<{
    pergunta_id: string;
    resposta: string;
    pontuacao: number | null;
    indicador_visual: string | null;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("submit-checkin: Received request");
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, respostas } = await req.json() as SubmitCheckinRequest;

    console.log(`submit-checkin: Processing submission for token ${token}`);

    // Buscar o envio pelo token
    const { data: envio, error: envioError } = await supabase
      .from("checkin_envios")
      .select(`
        *,
        cliente:clientes(nome, email),
        template:checkin_templates(nome)
      `)
      .eq("token", token)
      .single();

    if (envioError || !envio) {
      console.error("submit-checkin: Token not found:", envioError);
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

    console.log(`submit-checkin: Found envio for empresa ${empresa?.nome || envio.empresa_id}`);

    // Verificar se já foi respondido
    if (envio.status === "respondido") {
      console.log("submit-checkin: Already answered");
      return new Response(
        JSON.stringify({ error: "Este check-in já foi respondido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se expirou
    const now = new Date();
    const expiraEm = new Date(envio.expira_em);
    if (now > expiraEm) {
      console.log("submit-checkin: Link expired");
      
      // Atualizar status para expirado
      await supabase
        .from("checkin_envios")
        .update({ status: "expirado" })
        .eq("id", envio.id);
      
      return new Response(
        JSON.stringify({ error: "Este link expirou. Solicite um novo envio." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calcular pontuação total
    let pontuacaoTotal = 0;
    for (const r of respostas) {
      if (r.pontuacao !== null) {
        pontuacaoTotal += r.pontuacao;
      }
    }

    // Inserir respostas
    const respostasToInsert = respostas.map((r) => ({
      envio_id: envio.id,
      pergunta_id: r.pergunta_id,
      resposta: r.resposta,
      pontuacao: r.pontuacao,
      indicador_visual: r.indicador_visual,
    }));

    const { error: respostasError } = await supabase
      .from("checkin_respostas")
      .insert(respostasToInsert);

    if (respostasError) {
      console.error("submit-checkin: Error inserting respostas:", respostasError);
      throw new Error(`Erro ao salvar respostas: ${respostasError.message}`);
    }

    // Atualizar status do envio
    const { error: updateError } = await supabase
      .from("checkin_envios")
      .update({
        status: "respondido",
        respondido_em: new Date().toISOString(),
        pontuacao_total: pontuacaoTotal,
      })
      .eq("id", envio.id);

    if (updateError) {
      console.error("submit-checkin: Error updating envio:", updateError);
    }

    console.log("submit-checkin: Respostas saved successfully");

    // Criar notificação no sistema
    const clienteNome = envio.cliente?.nome || "Cliente";

    const { data: perfisData } = await supabase
      .from("perfis")
      .select("user_id")
      .eq("empresa_id", envio.empresa_id)
      .eq("ativo", true);

    if (perfisData && perfisData.length > 0) {
      const notifications = perfisData.map((perfil) => ({
        user_id: perfil.user_id,
        empresa_id: envio.empresa_id,
        type: "checkin_respondido",
        title: "📋 Check-in Respondido!",
        message: `${clienteNome} respondeu o check-in "${envio.template?.nome || 'Check-in'}"`,
        read: false,
      }));

      await supabase.from("notifications").insert(notifications);
      console.log("submit-checkin: System notifications created");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Check-in enviado com sucesso!",
        pontuacao_total: pontuacaoTotal
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("submit-checkin: Error:", error);
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
