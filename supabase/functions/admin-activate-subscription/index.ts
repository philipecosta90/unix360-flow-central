/* deno-lint-ignore-file no-explicit-any */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin client (bypasses RLS)
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    // User-scoped client to validate permissions (RLS applies here)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = await req.json();
    const empresa_id: string | undefined = body?.empresa_id;
    const days: number = Number(body?.days ?? 30);

    if (!empresa_id) {
      return new Response(JSON.stringify({ error: "empresa_id obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check super admin privileges
    const { data: isSuperAdmin, error: superErr } = await userClient.rpc("is_super_admin");
    if (superErr) {
      console.error("admin-activate-subscription is_super_admin error", superErr.message);
      return new Response(JSON.stringify({ error: "Falha ao validar permissão" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate empresa exists
    const { data: empresa, error: empErr } = await admin
      .from("empresas")
      .select("id")
      .eq("id", empresa_id)
      .maybeSingle();

    if (empErr) {
      console.error("admin-activate-subscription empresa lookup error", empErr.message);
      return new Response(JSON.stringify({ error: "Erro ao localizar empresa" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!empresa?.id) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    // Check for existing subscription
    const { data: existingSub, error: findErr } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("empresa_id", empresa_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findErr) {
      console.error("admin-activate-subscription find subscription error", findErr.message);
      return new Response(JSON.stringify({ error: "Erro ao buscar assinatura" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let subscriptionId: string | null = null;

    if (existingSub?.id) {
      // Update
      const { error: upErr } = await admin
        .from("subscriptions")
        .update({
          status: "active",
          is_recurring: true,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at: null,
        })
        .eq("id", existingSub.id);

      if (upErr) {
        console.error("admin-activate-subscription update error", upErr.message);
        return new Response(JSON.stringify({ error: "Erro ao atualizar assinatura" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      subscriptionId = existingSub.id;

      // Log action
      await admin.rpc("log_subscription_action", {
        p_subscription_id: existingSub.id,
        p_action: "ADMIN_ACTIVATE",
        p_old_status: existingSub.status,
        p_new_status: "active",
      });
    } else {
      // Insert
      const { data: inserted, error: insErr } = await admin
        .from("subscriptions")
        .insert({
          empresa_id,
          status: "active",
          is_recurring: true,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at: null,
        })
        .select("id")
        .maybeSingle();

      if (insErr) {
        console.error("admin-activate-subscription insert error", insErr.message);
        return new Response(JSON.stringify({ error: "Erro ao criar assinatura" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      subscriptionId = inserted?.id ?? null;

      if (subscriptionId) {
        await admin.rpc("log_subscription_action", {
          p_subscription_id: subscriptionId,
          p_action: "ADMIN_CREATE_ACTIVE",
          p_old_status: null,
          p_new_status: "active",
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, subscription_id: subscriptionId, empresa_id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error("admin-activate-subscription error", (e as Error).message);
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
