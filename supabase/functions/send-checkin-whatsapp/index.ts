import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface RequestBody {
  clienteId: string;
  templateId: string;
  clienteNome: string;
  clienteTelefone: string;
  agendamentoId?: string;
}

interface CheckUserResponse {
  Users: Array<{
    Query: string;
    IsInWhatsapp: boolean;
    JID: string;
    VerifiedName?: string;
  }>;
}

// Normaliza telefone - apenas remove caracteres não numéricos
// O frontend IntlPhoneInput já envia o número com DDI correto
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

const DEFAULT_MESSAGE = `Olá {clienteNome}! 👋

📊 *{nomeTemplate}*

Como está seu progresso? Responda este check-in rápido para que possamos acompanhar sua evolução.

🔗 {link}

⏰ O link é válido por 3 dias.

Dúvidas? Responda esta mensagem!

Equipe *{nomeEmpresa}*`;

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

    // Cliente com service role para operações administrativas
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
    const { clienteId, templateId, clienteNome, clienteTelefone, agendamentoId }: RequestBody = await req.json();

    if (!clienteId || !templateId || !clienteNome || !clienteTelefone) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos. clienteId, templateId, clienteNome e clienteTelefone são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Enviando check-in para: ${clienteNome} (${clienteTelefone})`);

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

    // Buscar nome do template
    const { data: template, error: templateError } = await supabase
      .from("checkin_templates")
      .select("nome")
      .eq("id", templateId)
      .single();

    if (templateError) {
      console.error("Erro ao buscar template:", templateError);
    }

    const nomeTemplate = template?.nome || "Check-in";

    // Buscar pontuação máxima do template
    const { data: perguntas, error: perguntasError } = await supabase
      .from("checkin_perguntas")
      .select("pontos_maximo")
      .eq("template_id", templateId);

    if (perguntasError) {
      console.error("Erro ao buscar perguntas:", perguntasError);
    }

    const pontuacaoMaxima = perguntas?.reduce((sum, p) => sum + (p.pontos_maximo || 0), 0) || 0;

    // Buscar mensagem personalizada
    const { data: mensagemConfig, error: mensagemError } = await supabaseAdmin
      .from("whatsapp_mensagens")
      .select("conteudo, ativo")
      .eq("empresa_id", perfil.empresa_id)
      .eq("tipo", "checkin")
      .single();

    if (mensagemError && mensagemError.code !== "PGRST116") {
      console.error("Erro ao buscar mensagem personalizada:", mensagemError);
    }

    // Se mensagem está desativada, não enviar via WhatsApp mas ainda criar o registro
    const enviarWhatsApp = !mensagemConfig || mensagemConfig.ativo;

    // Buscar instância WhatsApp conectada da empresa
    const { data: instancia, error: instanciaError } = await supabase
      .from("whatsapp_instances")
      .select("id, user_token, nome, status")
      .eq("empresa_id", perfil.empresa_id)
      .eq("status", "connected")
      .limit(1)
      .single();

    if ((instanciaError || !instancia) && enviarWhatsApp) {
      console.log("Nenhuma instância WhatsApp conectada encontrada");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Nenhuma instância WhatsApp conectada. Configure sua conexão em Configurações > WhatsApp." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Usando instância: ${instancia?.nome}`);

    const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL");
    if (!WHATSAPP_API_URL && enviarWhatsApp) {
      console.error("WHATSAPP_API_URL não configurada");
      return new Response(
        JSON.stringify({ error: "API WhatsApp não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let jid = "";

    if (enviarWhatsApp && instancia) {
      // 1. Verificar se o número tem WhatsApp
      console.log("Verificando número no WhatsApp...");
      const checkResponse = await fetch(`${WHATSAPP_API_URL}/user/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": instancia.user_token,
        },
        body: JSON.stringify({
          Phone: [normalizePhone(clienteTelefone)],
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
            message: "Este número não possui WhatsApp",
            checkedPhone: clienteTelefone,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      jid = firstUser.JID;
      console.log(`Número verificado, JID: ${jid}`);
    }

    // 2. Gerar token único para o check-in
    const token = crypto.randomUUID();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 3); // Válido por 3 dias

    // 3. Criar registro de envio na tabela checkin_envios
    const { error: envioError } = await supabaseAdmin
      .from("checkin_envios")
      .insert({
        empresa_id: perfil.empresa_id,
        cliente_id: clienteId,
        template_id: templateId,
        agendamento_id: agendamentoId || null,
        token: token,
        status: "pendente",
        enviado_em: new Date().toISOString(),
        expira_em: expiraEm.toISOString(),
        pontuacao_maxima: pontuacaoMaxima,
      });

    if (envioError) {
      console.error("Erro ao criar registro de envio:", envioError);
      return new Response(
        JSON.stringify({ error: "Erro ao registrar envio do check-in" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Montar link e mensagem
    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://app.unix360.com.br";
    const link = `${appBaseUrl}/checkin/preencher/${token}`;
    console.log(`Link de check-in gerado: ${link}`);
    
    // Usar mensagem personalizada ou padrão
    let mensagem = mensagemConfig?.conteudo || DEFAULT_MESSAGE;
    
    // Substituir variáveis
    mensagem = mensagem
      .replace(/{clienteNome}/g, clienteNome)
      .replace(/{nomeTemplate}/g, nomeTemplate)
      .replace(/{link}/g, link)
      .replace(/{nomeEmpresa}/g, nomeEmpresa);

    // Se WhatsApp desativado, retornar sucesso sem enviar
    if (!enviarWhatsApp) {
      console.log("Envio de check-in via WhatsApp está desativado");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Check-in registrado (envio WhatsApp desativado)",
          token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5. Enviar mensagem via WhatsApp
    console.log("Enviando mensagem com link do check-in...");

    const destino = jid?.includes("@") ? jid : normalizePhone(clienteTelefone);

    const sendResponse = await fetch(`${WHATSAPP_API_URL}/chat/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": instancia!.user_token,
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
          message: "Erro ao enviar mensagem via WhatsApp",
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
        message: "Check-in enviado com sucesso via WhatsApp",
        checkedPhone: clienteTelefone,
        jid,
        token,
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
