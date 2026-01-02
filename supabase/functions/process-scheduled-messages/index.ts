import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Schedule {
  id: string;
  empresa_id: string;
  mensagem_id: string;
  tipo_agendamento: string;
  data_envio: string | null;
  dia_mes: string | null;
  hora_envio: string;
  filtro_clientes: { status?: string[] };
  ativo: boolean;
}

interface Client {
  id: string;
  nome: string;
  telefone: string;
  data_nascimento: string | null;
}

interface WhatsAppMessage {
  id: string;
  conteudo: string;
  empresa_id: string;
}

interface Company {
  id: string;
  nome: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const whatsappApiUrl = Deno.env.get("WHATSAPP_API_URL");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("[process-scheduled-messages] Iniciando processamento...");

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayDayMonth = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    console.log(`[process-scheduled-messages] Data atual: ${todayStr}, Dia/Mês: ${todayDayMonth}`);

    // Buscar todos os agendamentos ativos
    const { data: schedules, error: schedulesError } = await supabase
      .from("mensagens_agendamentos")
      .select("*")
      .eq("ativo", true);

    if (schedulesError) {
      console.error("[process-scheduled-messages] Erro ao buscar agendamentos:", schedulesError);
      throw schedulesError;
    }

    console.log(`[process-scheduled-messages] ${schedules?.length || 0} agendamentos ativos encontrados`);

    let totalEnviados = 0;
    let totalErros = 0;

    for (const schedule of schedules || []) {
      try {
        console.log(`[process-scheduled-messages] Processando agendamento ${schedule.id} tipo=${schedule.tipo_agendamento}`);

        let clientsToSend: Client[] = [];
        const statusFilter = schedule.filtro_clientes?.status || ["ativo"];

        // Determinar se deve processar hoje
        let shouldProcess = false;

        if (schedule.tipo_agendamento === "aniversario") {
          // Buscar clientes que fazem aniversário hoje
          const { data: birthdayClients, error: clientsError } = await supabase
            .from("clientes")
            .select("id, nome, telefone, data_nascimento")
            .eq("empresa_id", schedule.empresa_id)
            .in("status", statusFilter)
            .not("telefone", "is", null)
            .not("data_nascimento", "is", null);

          if (clientsError) {
            console.error(`[process-scheduled-messages] Erro ao buscar aniversariantes:`, clientsError);
            continue;
          }

          // Filtrar apenas os que fazem aniversário hoje
          clientsToSend = (birthdayClients || []).filter((client) => {
            if (!client.data_nascimento) return false;
            const birthDate = new Date(client.data_nascimento);
            return (
              birthDate.getDate() === today.getDate() &&
              birthDate.getMonth() === today.getMonth()
            );
          });

          shouldProcess = clientsToSend.length > 0;
          console.log(`[process-scheduled-messages] ${clientsToSend.length} aniversariantes hoje`);
        } else if (schedule.tipo_agendamento === "unico") {
          // Verificar se é hoje
          shouldProcess = schedule.data_envio === todayStr;
          if (shouldProcess) {
            const { data: clients, error } = await supabase
              .from("clientes")
              .select("id, nome, telefone, data_nascimento")
              .eq("empresa_id", schedule.empresa_id)
              .in("status", statusFilter)
              .not("telefone", "is", null);

            if (!error) clientsToSend = clients || [];
          }
        } else if (schedule.tipo_agendamento === "data_fixa") {
          // Verificar se o dia/mês é hoje
          shouldProcess = schedule.dia_mes === todayDayMonth;
          if (shouldProcess) {
            const { data: clients, error } = await supabase
              .from("clientes")
              .select("id, nome, telefone, data_nascimento")
              .eq("empresa_id", schedule.empresa_id)
              .in("status", statusFilter)
              .not("telefone", "is", null);

            if (!error) clientsToSend = clients || [];
          }
        }

        if (!shouldProcess || clientsToSend.length === 0) {
          console.log(`[process-scheduled-messages] Nada a enviar para agendamento ${schedule.id}`);
          continue;
        }

        // Buscar mensagem
        const { data: message, error: messageError } = await supabase
          .from("whatsapp_mensagens")
          .select("*")
          .eq("id", schedule.mensagem_id)
          .single();

        if (messageError || !message) {
          console.error(`[process-scheduled-messages] Mensagem não encontrada: ${schedule.mensagem_id}`);
          continue;
        }

        // Buscar empresa
        const { data: company } = await supabase
          .from("empresas")
          .select("id, nome")
          .eq("id", schedule.empresa_id)
          .single();

        // Buscar instância WhatsApp
        const { data: instance } = await supabase
          .from("whatsapp_instances")
          .select("*")
          .eq("empresa_id", schedule.empresa_id)
          .eq("status", "connected")
          .limit(1)
          .single();

        if (!instance || !whatsappApiUrl) {
          console.warn(`[process-scheduled-messages] Instância WhatsApp não conectada para empresa ${schedule.empresa_id}`);
          continue;
        }

        // Enviar para cada cliente
        for (const client of clientsToSend) {
          try {
            let content = message.conteudo;

            // Substituir variáveis
            content = content.replace(/{clienteNome}/g, client.nome);
            content = content.replace(/{nomeEmpresa}/g, company?.nome || "");
            content = content.replace(/{dataAtual}/g, today.toLocaleDateString("pt-BR"));

            // Calcular idade se for aniversário
            if (client.data_nascimento && schedule.tipo_agendamento === "aniversario") {
              const birthDate = new Date(client.data_nascimento);
              const age = today.getFullYear() - birthDate.getFullYear();
              content = content.replace(/{idade}/g, String(age));
            }

            // Enviar mensagem via WhatsApp
            const phone = client.telefone.replace(/\D/g, "");
            const response = await fetch(`${whatsappApiUrl}/chat/send/text/${instance.nome}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Token": instance.user_token,
              },
              body: JSON.stringify({
                id: `${phone}@s.whatsapp.net`,
                message: content,
              }),
            });

            if (response.ok) {
              totalEnviados++;
              console.log(`[process-scheduled-messages] Mensagem enviada para ${client.nome}`);
            } else {
              totalErros++;
              console.error(`[process-scheduled-messages] Erro ao enviar para ${client.nome}:`, await response.text());
            }
          } catch (clientError) {
            totalErros++;
            console.error(`[process-scheduled-messages] Erro ao processar cliente ${client.id}:`, clientError);
          }
        }

        // Atualizar último envio
        const updateData: Record<string, any> = {
          ultimo_envio: new Date().toISOString(),
        };

        // Calcular próximo envio
        if (schedule.tipo_agendamento === "unico") {
          // Desativar agendamentos únicos após envio
          updateData.ativo = false;
        } else if (schedule.tipo_agendamento === "aniversario") {
          // Próximo envio é amanhã
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          updateData.proximo_envio = tomorrow.toISOString().split("T")[0];
        } else if (schedule.tipo_agendamento === "data_fixa") {
          // Próximo ano
          const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
          updateData.proximo_envio = nextYear.toISOString().split("T")[0];
        }

        await supabase
          .from("mensagens_agendamentos")
          .update(updateData)
          .eq("id", schedule.id);

        // Criar notificação
        if (totalEnviados > 0) {
          const { data: profileData } = await supabase
            .from("perfis")
            .select("user_id")
            .eq("empresa_id", schedule.empresa_id)
            .eq("nivel_permissao", "admin")
            .limit(1)
            .single();

          if (profileData) {
            await supabase.from("notifications").insert({
              user_id: profileData.user_id,
              empresa_id: schedule.empresa_id,
              type: "message_scheduled",
              title: "Mensagens agendadas enviadas",
              message: `${totalEnviados} mensagens enviadas via agendamento automático.`,
            });
          }
        }
      } catch (scheduleError) {
        console.error(`[process-scheduled-messages] Erro no agendamento ${schedule.id}:`, scheduleError);
        totalErros++;
      }
    }

    console.log(`[process-scheduled-messages] Concluído: ${totalEnviados} enviados, ${totalErros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        enviados: totalEnviados,
        erros: totalErros,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[process-scheduled-messages] Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
