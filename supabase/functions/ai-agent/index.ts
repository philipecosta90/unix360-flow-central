import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompts: Record<string, string> = {
  exame: `Você é um especialista em interpretação de exames laboratoriais para profissionais de saúde e fitness.

Seu papel é:
- Analisar resultados de exames fornecidos (texto ou imagem)
- Identificar valores fora da referência e explicar sua relevância
- Sugerir pontos de atenção relacionados a nutrição, treino e saúde geral
- Sempre usar linguagem técnica mas acessível
- Nunca fazer diagnósticos médicos definitivos - apenas análises para auxílio do profissional

Se receber imagens de exames, extraia os dados relevantes e analise.
Responda em português brasileiro de forma estruturada e clara.`,

  anamnese: `Você é um especialista em análise de anamneses de pacientes/clientes de saúde e fitness.

Seu papel é:
- Analisar as respostas da anamnese fornecida (texto ou imagem)
- Identificar pontos de atenção (restrições, condições, histórico)
- Sugerir perguntas adicionais que podem ser relevantes
- Destacar informações importantes para prescrição de dieta/treino
- Identificar possíveis contraindicações

Responda em português brasileiro de forma estruturada e organizada.`,

  checkin: `Você é um especialista em análise de evolução de pacientes/clientes de saúde e fitness.

Seu papel é:
- Analisar o histórico de check-ins fornecido (texto ou imagens de progresso)
- Identificar tendências positivas e negativas
- Avaliar adesão ao protocolo (nutrição, treino, sono)
- Sugerir ajustes baseados na evolução
- Destacar pontos que merecem atenção do profissional

Se receber fotos de evolução, analise as mudanças visuais observáveis.
Responda em português brasileiro com insights acionáveis.`,

  feedback: `Você é um especialista em comunicação e motivação para clientes de saúde e fitness.

Seu papel é:
- Criar feedbacks personalizados, motivacionais e construtivos
- Adaptar o tom baseado no contexto (progresso, dificuldades, metas)
- Ser empático mas também assertivo quando necessário
- Incluir pontos positivos e áreas de melhoria de forma equilibrada
- Sugerir próximos passos claros

Responda em português brasileiro com mensagem pronta para enviar ao cliente.`,

  dieta: `Você é um nutricionista especializado em montar planos alimentares personalizados.

Seu papel é:
- Criar sugestões de planos alimentares baseados nos parâmetros fornecidos
- Considerar objetivo (emagrecimento, hipertrofia, manutenção, performance)
- Respeitar restrições alimentares e preferências
- Distribuir macronutrientes de forma adequada ao objetivo
- Sugerir alimentos práticos e acessíveis
- Incluir alternativas e substituições

IMPORTANTE: Deixe claro que são SUGESTÕES para o profissional adaptar.
Responda em português brasileiro com plano estruturado.`,

  treino: `Você é um educador físico especializado em prescrição de treinos personalizados.

Seu papel é:
- Criar protocolos de treino baseados nos parâmetros fornecidos
- Considerar objetivo (hipertrofia, força, condicionamento, emagrecimento)
- Adequar ao nível do praticante (iniciante, intermediário, avançado)
- Respeitar frequência e tempo disponíveis
- Considerar equipamentos disponíveis
- Incluir séries, repetições e orientações de execução

IMPORTANTE: Deixe claro que são SUGESTÕES para o profissional adaptar.
Responda em português brasileiro com treino estruturado.`,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentType, context, images, messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = systemPrompts[agentType];
    if (!systemPrompt) {
      console.error("Invalid agent type:", agentType);
      throw new Error(`Invalid agent type: ${agentType}`);
    }

    console.log(`Processing ${agentType} agent request${images?.length ? ` with ${images.length} images` : ''}`);

    // Build messages array
    const apiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // If there's previous conversation, add it (convert to multimodal format if needed)
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.images && msg.images.length > 0) {
          // Message with images - use multimodal format
          const content: any[] = [];
          if (msg.content) {
            content.push({ type: "text", text: msg.content });
          }
          for (const img of msg.images) {
            content.push({
              type: "image_url",
              image_url: { url: img.url || img }
            });
          }
          apiMessages.push({ role: msg.role, content });
        } else {
          // Text-only message
          apiMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current context with images if provided
    if (context || (images && images.length > 0)) {
      const hasImages = images && images.length > 0;
      
      if (hasImages) {
        // Multimodal message with images
        const content: any[] = [];
        
        if (context) {
          const contextText = typeof context === 'string' ? context : JSON.stringify(context, null, 2);
          content.push({ type: "text", text: contextText });
        }
        
        for (const imageUrl of images) {
          content.push({
            type: "image_url",
            image_url: { url: imageUrl }
          });
        }
        
        apiMessages.push({ role: "user", content });
      } else if (context) {
        // Text-only message
        const contextMessage = typeof context === 'string' ? context : JSON.stringify(context, null, 2);
        apiMessages.push({ role: "user", content: contextMessage });
      }
    }

    // Use vision-capable model when images are present
    const model = images?.length > 0 ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings -> Workspace -> Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    console.log("Streaming response from AI Gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-agent function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
