import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface CheckUserResponse {
  Users: Array<{
    Query: string;
    IsInWhatsapp: boolean;
    JID: string;
    VerifiedName?: string;
  }>;
}

interface Agendamento {
  id: string;
  empresa_id: string;
  cliente_id: string;
  template_id: string;
  frequencia: string;
  intervalo_dias: number | null;
  proximo_envio: string;
  hora_envio: string;
  ativo: boolean;
  cliente: {
    id: string;
    nome: string;
    telefone: string | null;
  };
  template: {
    id: string;
    nome: string;
  };
}

// Converte para horário do Brasil (UTC-3)
function toBrazilTime(date: Date = new Date()): Date {
  // Usar offset fixo de UTC-3 (Brasil)
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const brazilOffset = -3 * 60 * 60000; // UTC-3 em milissegundos
  return new Date(utcTime + brazilOffset);
}

// Formata data para YYYY-MM-DD no horário do Brasil
function toLocalISODate(date: Date = new Date()): string {
  const brazilDate = toBrazilTime(date);
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Retorna hora atual no Brasil no formato HH:MM
function getCurrentBrazilTime(): string {
  const brazilDate = toBrazilTime(new Date());
  const hours = String(brazilDate.getHours()).padStart(2, '0');
  const minutes = String(brazilDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Calcular próximo envio baseado na frequência
function calcularProximoEnvio(frequencia: string, intervaloDias: number | null): string {
  const now = new Date();
  const proxEnvio = new Date(now);

  switch (frequencia) {
    case "diario":
      proxEnvio.setDate(proxEnvio.getDate() + 1);
      break;
    case "semanal":
      proxEnvio.setDate(proxEnvio.getDate() + 7);
      break;
    case "quinzenal":
      proxEnvio.setDate(proxEnvio.getDate() + 15);
      break;
    case "mensal":
      proxEnvio.setMonth(proxEnvio.getMonth() + 1);
      break;
    case "personalizado":
      proxEnvio.setDate(proxEnvio.getDate() + (intervaloDias || 7));
      break;
    default:
      proxEnvio.setDate(proxEnvio.getDate() + 7);
  }

  return toLocalISODate(proxEnvio);
}

Deno.serve(async (req) => {
  const startTime = new Date().toISOString();
  console.log(`[${startTime}] Edge Function process-scheduled-checkins iniciada`);

  // Handle CORS preflight
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar agendamentos que devem ser enviados agora
    const now = new Date();
    const todayDate = toLocalISODate(now); // YYYY-MM-DD no horário do Brasil
    const currentTime = getCurrentBrazilTime(); // HH:MM no horário do Brasil

    console.log(`[${startTime}] Buscando agendamentos para data: ${todayDate}, hora Brasil: ${currentTime}`);

    // Buscar agendamentos ativos onde proximo_envio <= hoje
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from("checkin_agendamentos")
      .select(`
        id,
        empresa_id,
        cliente_id,
        template_id,
        frequencia,
        intervalo_dias,
        proximo_envio,
        hora_envio,
        ativo,
        cliente:clientes(id, nome, telefone),
        template:checkin_templates(id, nome)
      `)
      .eq("ativo", true)
      .lte("proximo_envio", todayDate);

    if (agendamentosError) {
      console.error(`[${startTime}] Erro ao buscar agendamentos:`, agendamentosError);
      throw agendamentosError;
    }

    console.log(`[${startTime}] Encontrados ${agendamentos?.length || 0} agendamentos com data pendente`);

    if (!agendamentos || agendamentos.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum agendamento pendente",
          processed: 0,
          timestamp: now.toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CORREÇÃO: Filtrar agendamentos que JÁ passaram do horário de envio
    const agendamentosParaProcessar = (agendamentos as unknown as Agendamento[]).filter(ag => {
      // Se proximo_envio é de um dia anterior, enviar imediatamente (agendamento atrasado)
      if (ag.proximo_envio < todayDate) {
        console.log(`[${startTime}] Agendamento ${ag.id} ATRASADO (${ag.proximo_envio} < ${todayDate}), enviando agora`);
        return true;
      }
      
      // Se é hoje, verificar se já passou do horário configurado
      const horaAgendada = ag.hora_envio?.slice(0, 5) || "00:00";
      if (currentTime >= horaAgendada) {
        console.log(`[${startTime}] Agendamento ${ag.id}: hora_envio=${horaAgendada}, hora_atual=${currentTime} - PROCESSAR`);
        return true;
      }
      
      console.log(`[${startTime}] Agendamento ${ag.id}: hora_envio=${horaAgendada}, hora_atual=${currentTime} - AGUARDAR`);
      return false;
    });

    console.log(`[${startTime}] ${agendamentosParaProcessar.length} de ${agendamentos.length} agendamentos prontos para envio`);

    if (agendamentosParaProcessar.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum agendamento com horário atingido",
          processed: 0,
          total_pendentes: agendamentos.length,
          timestamp: now.toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let enviados = 0;
    let erros = 0;
    const resultados: Array<{ agendamentoId: string; status: string; message: string }> = [];

    // Processar cada agendamento que já passou do horário
    for (const agendamento of agendamentosParaProcessar) {
      console.log(`[${startTime}] Processando agendamento ${agendamento.id}`);

      // Verificar se o cliente tem dados válidos
      const cliente = Array.isArray(agendamento.cliente) 
        ? agendamento.cliente[0] 
        : agendamento.cliente;
      
      const template = Array.isArray(agendamento.template) 
        ? agendamento.template[0] 
        : agendamento.template;

      if (!cliente || !cliente.telefone) {
        console.log(`[${startTime}] Cliente sem telefone, pulando agendamento ${agendamento.id}`);
        resultados.push({
          agendamentoId: agendamento.id,
          status: "skipped",
          message: "Cliente sem telefone cadastrado",
        });
        
        // Atualizar próximo envio mesmo assim para não ficar em loop
        const proximoEnvio = calcularProximoEnvio(agendamento.frequencia, agendamento.intervalo_dias);
        await supabase
          .from("checkin_agendamentos")
          .update({ proximo_envio: proximoEnvio })
          .eq("id", agendamento.id);
        
        continue;
      }

      try {
        // Buscar instância WhatsApp da empresa
        const { data: instancia, error: instanciaError } = await supabase
          .from("whatsapp_instances")
          .select("id, user_token, nome, status")
          .eq("empresa_id", agendamento.empresa_id)
          .eq("status", "connected")
          .limit(1)
          .single();

        if (instanciaError || !instancia) {
          console.log(`[${startTime}] Empresa ${agendamento.empresa_id} sem WhatsApp conectado`);
          resultados.push({
            agendamentoId: agendamento.id,
            status: "skipped",
            message: "Empresa sem WhatsApp conectado",
          });
          
          // Atualizar próximo envio
          const proximoEnvio = calcularProximoEnvio(agendamento.frequencia, agendamento.intervalo_dias);
          await supabase
            .from("checkin_agendamentos")
            .update({ proximo_envio: proximoEnvio })
            .eq("id", agendamento.id);
          
          continue;
        }

        if (!WHATSAPP_API_URL) {
          console.error(`[${startTime}] WHATSAPP_API_URL não configurada`);
          erros++;
          continue;
        }

        // Buscar nome da empresa
        const { data: empresa } = await supabase
          .from("empresas")
          .select("nome")
          .eq("id", agendamento.empresa_id)
          .single();

        const nomeEmpresa = empresa?.nome || "Nossa equipe";

        // Buscar pontuação máxima do template
        const { data: perguntas } = await supabase
          .from("checkin_perguntas")
          .select("pontos_maximo")
          .eq("template_id", agendamento.template_id);

        const pontuacaoMaxima = perguntas?.reduce((sum, p) => sum + (p.pontos_maximo || 0), 0) || 0;

        // Verificar número no WhatsApp
        console.log(`[${startTime}] Verificando número ${cliente.telefone}...`);
        const checkResponse = await fetch(`${WHATSAPP_API_URL}/user/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instancia.user_token,
          },
          body: JSON.stringify({ Phone: [cliente.telefone] }),
        });

        if (!checkResponse.ok) {
          console.error(`[${startTime}] Erro ao verificar número:`, await checkResponse.text());
          erros++;
          resultados.push({
            agendamentoId: agendamento.id,
            status: "error",
            message: "Erro ao verificar número no WhatsApp",
          });
          continue;
        }

        const checkJson = await checkResponse.json();
        const users = (checkJson?.data?.Users ?? checkJson?.Users ?? checkJson?.data?.data?.Users) as
          | CheckUserResponse["Users"]
          | undefined;
        const firstUser = users?.[0];

        if (!firstUser || !firstUser.IsInWhatsapp) {
          console.log(`[${startTime}] Número ${cliente.telefone} não possui WhatsApp`);
          resultados.push({
            agendamentoId: agendamento.id,
            status: "skipped",
            message: "Número não possui WhatsApp",
          });
          
          // Atualizar próximo envio
          const proximoEnvio = calcularProximoEnvio(agendamento.frequencia, agendamento.intervalo_dias);
          await supabase
            .from("checkin_agendamentos")
            .update({ proximo_envio: proximoEnvio })
            .eq("id", agendamento.id);
          
          continue;
        }

        // Gerar token e criar envio
        const token = crypto.randomUUID();
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + 3);

        const { error: envioError } = await supabase
          .from("checkin_envios")
          .insert({
            empresa_id: agendamento.empresa_id,
            cliente_id: agendamento.cliente_id,
            template_id: agendamento.template_id,
            agendamento_id: agendamento.id,
            token: token,
            status: "pendente",
            enviado_em: new Date().toISOString(),
            expira_em: expiraEm.toISOString(),
            pontuacao_maxima: pontuacaoMaxima,
          });

        if (envioError) {
          console.error(`[${startTime}] Erro ao criar envio:`, envioError);
          erros++;
          resultados.push({
            agendamentoId: agendamento.id,
            status: "error",
            message: "Erro ao criar registro de envio",
          });
          continue;
        }

        // Enviar mensagem
        const link = `https://app.unix360.com.br/checkin/preencher/${token}`;
        const templateNome = template?.nome || "Check-in";
        
        const mensagem = `Olá ${cliente.nome}! 👋

📊 *${templateNome}*

Como está seu progresso? Responda este check-in rápido para que possamos acompanhar sua evolução.

🔗 ${link}

⏰ O link é válido por 3 dias.

Dúvidas? Responda esta mensagem!

Equipe *${nomeEmpresa}*`;

        const jid = firstUser.JID;
        const destino = jid?.includes("@") ? jid : cliente.telefone;

        const sendResponse = await fetch(`${WHATSAPP_API_URL}/chat/send/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instancia.user_token,
          },
          body: JSON.stringify({ Phone: destino, Body: mensagem }),
        });

        if (!sendResponse.ok) {
          console.error(`[${startTime}] Erro ao enviar mensagem:`, await sendResponse.text());
          erros++;
          resultados.push({
            agendamentoId: agendamento.id,
            status: "error",
            message: "Erro ao enviar mensagem via WhatsApp",
          });
          continue;
        }

        console.log(`[${startTime}] Check-in enviado com sucesso para ${cliente.nome}`);
        enviados++;

        // Atualizar próximo envio
        const proximoEnvio = calcularProximoEnvio(agendamento.frequencia, agendamento.intervalo_dias);
        await supabase
          .from("checkin_agendamentos")
          .update({ proximo_envio: proximoEnvio })
          .eq("id", agendamento.id);

        resultados.push({
          agendamentoId: agendamento.id,
          status: "success",
          message: `Enviado para ${cliente.nome}`,
        });

        // Criar notificação para o profissional
        const { data: perfis } = await supabase
          .from("perfis")
          .select("user_id")
          .eq("empresa_id", agendamento.empresa_id)
          .eq("ativo", true);

        if (perfis && perfis.length > 0) {
          const notifications = perfis.map((p) => ({
            user_id: p.user_id,
            empresa_id: agendamento.empresa_id,
            type: "checkin_enviado",
            title: "Check-in enviado automaticamente",
            message: `Check-in "${templateNome}" enviado para ${cliente.nome}`,
            read: false,
          }));

          await supabase.from("notifications").insert(notifications);
        }

      } catch (err) {
        console.error(`[${startTime}] Erro ao processar agendamento ${agendamento.id}:`, err);
        erros++;
        resultados.push({
          agendamentoId: agendamento.id,
          status: "error",
          message: String(err),
        });
      }
    }

    const endTime = new Date().toISOString();
    console.log(`[${endTime}] Processamento concluído. Enviados: ${enviados}, Erros: ${erros}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: agendamentosParaProcessar.length,
        enviados,
        erros,
        resultados,
        timestamp: endTime,
      }),
        enviados,
        erros,
        resultados,
        timestamp: endTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`Erro na edge function:`, error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
