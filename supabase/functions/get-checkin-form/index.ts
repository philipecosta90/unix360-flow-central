// Edge Function para leitura segura de formulário de check-in
// Valida o token antes de retornar dados do formulário

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckinFormResponse {
  success: boolean;
  data?: {
    envio: {
      id: string;
      status: string;
      expira_em: string;
    };
    template: {
      nome: string;
      descricao: string | null;
    };
    cliente: {
      nome: string;
    };
    perguntas: Array<{
      id: string;
      pergunta: string;
      tipo: string;
      secao: string;
      secao_icone: string | null;
      ordem: number;
      obrigatoria: boolean;
      placeholder: string | null;
      pontos_maximo: number | null;
      opcoes_pontuacao: any;
    }>;
  };
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("get-checkin-form: Received request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse token do body ou query params
    let token: string;
    if (req.method === "POST") {
      const body = await req.json();
      token = body.token;
    } else {
      const url = new URL(req.url);
      token = url.searchParams.get("token") || "";
    }

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token não fornecido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`get-checkin-form: Validating token ${token.substring(0, 8)}...`);

    // Usar função de validação de token (security definer)
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('validate_checkin_token', { p_token: token });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.log("get-checkin-form: Invalid token or expired");
      return new Response(
        JSON.stringify({ success: false, error: "Link inválido, expirado ou já respondido" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validatedEnvio = tokenData[0];
    console.log(`get-checkin-form: Token valid, template_id: ${validatedEnvio.template_id}`);

    // Buscar template usando função security definer
    const { data: templateData } = await supabase
      .rpc('get_checkin_template', { p_template_id: validatedEnvio.template_id });

    const template = templateData?.[0] || { nome: 'Check-in', descricao: null };

    // Buscar nome do cliente usando função security definer
    const { data: clienteNome } = await supabase
      .rpc('get_cliente_nome', { p_cliente_id: validatedEnvio.cliente_id });

    // Buscar perguntas usando função security definer
    const { data: perguntasData } = await supabase
      .rpc('get_checkin_perguntas_by_template', { p_template_id: validatedEnvio.template_id });

    const perguntas = perguntasData || [];

    const response: CheckinFormResponse = {
      success: true,
      data: {
        envio: {
          id: validatedEnvio.envio_id,
          status: validatedEnvio.status,
          expira_em: validatedEnvio.expira_em,
        },
        template: {
          nome: template.nome,
          descricao: template.descricao,
        },
        cliente: {
          nome: clienteNome || 'Cliente',
        },
        perguntas: perguntas.map((p: any) => ({
          id: p.id,
          pergunta: p.pergunta,
          tipo: p.tipo,
          secao: p.secao,
          secao_icone: p.secao_icone,
          ordem: p.ordem,
          obrigatoria: p.obrigatoria,
          placeholder: p.placeholder,
          pontos_maximo: p.pontos_maximo,
          opcoes_pontuacao: p.opcoes_pontuacao,
        })),
      },
    };

    console.log(`get-checkin-form: Returning ${perguntas.length} questions`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("get-checkin-form: Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
