import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface RequestBody {
  clienteNome: string;
  clienteTelefone: string;
}

interface CheckUserResponse {
  Users: Array<{
    Query: string;
    IsInWhatsapp: boolean;
    JID: string;
    VerifiedName?: string;
  }>;
}

const DEFAULT_MESSAGE = `Olá {clienteNome}! 👋

Bem-vindo(a) à *{nomeEmpresa}*! 🎉

Estamos muito felizes em tê-lo(a) como nosso cliente.

Se precisar de algo, é só responder esta mensagem.

Atenciosamente,
Equipe {nomeEmpresa}`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Cliente com service role para buscar mensagens personalizadas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Obter usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Erro ao obter usuário:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter dados do request
    const { clienteNome, clienteTelefone }: RequestBody = await req.json();

    if (!clienteNome || !clienteTelefone) {
      return new Response(
        JSON.stringify({ error: "Nome e telefone são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Enviando boas-vindas para: ${clienteNome} (${clienteTelefone})`);

    // Buscar perfil do usuário para obter empresa_id
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("empresa_id, nome")
      .eq("user_id", user.id)
      .single();

    if (perfilError || !perfil) {
      console.error("Erro ao buscar perfil:", perfilError);
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar nome da empresa
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("nome")
      .eq("id", perfil.empresa_id)
      .single();

    if (empresaError) {
      console.error("Erro ao buscar empresa:", empresaError);
    }

    const nomeEmpresa = empresa?.nome || "Nossa equipe";

    // Buscar mensagem personalizada
    const { data: mensagemConfig, error: mensagemError } = await supabaseAdmin
      .from("whatsapp_mensagens")
      .select("conteudo, ativo")
      .eq("empresa_id", perfil.empresa_id)
      .eq("tipo", "boas_vindas")
      .single();

    if (mensagemError && mensagemError.code !== "PGRST116") {
      console.error("Erro ao buscar mensagem personalizada:", mensagemError);
    }

    // Se mensagem está desativada, não enviar
    if (mensagemConfig && !mensagemConfig.ativo) {
      console.log("Envio de boas-vindas está desativado para esta empresa");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Envio de boas-vindas está desativado" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar instância WhatsApp conectada da empresa
    const { data: instancia, error: instanciaError } = await supabase
      .from("whatsapp_instances")
      .select("id, user_token, nome, status")
      .eq("empresa_id", perfil.empresa_id)
      .eq("status", "connected")
      .limit(1)
      .single();

    if (instanciaError || !instancia) {
      console.log("Nenhuma instância WhatsApp conectada encontrada");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Nenhuma instância WhatsApp conectada" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Usando instância: ${instancia.nome}`);

    const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL");
    if (!WHATSAPP_API_URL) {
      console.error("WHATSAPP_API_URL não configurada");
      return new Response(
        JSON.stringify({ error: "API WhatsApp não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verificar se o número tem WhatsApp
    console.log("Verificando número no WhatsApp...");
    const checkResponse = await fetch(`${WHATSAPP_API_URL}/user/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": instancia.user_token,
      },
      body: JSON.stringify({
        Phone: [clienteTelefone],
      }),
    });

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      console.error("Erro ao verificar número:", errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro ao verificar número no WhatsApp" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const checkJson = await checkResponse.json();
    console.log("Resposta da verificação:", JSON.stringify(checkJson));

    const users = (checkJson?.data?.Users ?? checkJson?.Users ?? checkJson?.data?.data?.Users) as
      | CheckUserResponse["Users"]
      | undefined;

    const firstUser = users?.[0];

    if (!firstUser || !firstUser.IsInWhatsapp) {
      console.log("Número não possui WhatsApp");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Número não possui WhatsApp",
          checkedPhone: clienteTelefone,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const jid = firstUser.JID;
    console.log(`Número verificado, JID: ${jid}`);

    // 2. Montar mensagem de boas-vindas (personalizada ou padrão)
    let mensagem = mensagemConfig?.conteudo || DEFAULT_MESSAGE;
    
    // Substituir variáveis
    mensagem = mensagem
      .replace(/{clienteNome}/g, clienteNome)
      .replace(/{nomeEmpresa}/g, nomeEmpresa);

    // 3. Enviar mensagem
    console.log("Enviando mensagem de boas-vindas...");

    const destino = jid?.includes("@") ? jid : clienteTelefone;

    const sendResponse = await fetch(`${WHATSAPP_API_URL}/chat/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": instancia.user_token,
      },
      body: JSON.stringify({
        Phone: destino,
        Body: mensagem,
      }),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Erro ao enviar mensagem:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Erro ao enviar mensagem",
          checkedPhone: clienteTelefone,
          jid,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sendData = await sendResponse.json();
    console.log("Mensagem enviada com sucesso:", JSON.stringify(sendData));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mensagem de boas-vindas enviada com sucesso",
        checkedPhone: clienteTelefone,
        jid,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("Erro na edge function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
