/* deno-lint-ignore-file no-explicit-any */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CAKTO_WEBHOOK_SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function toCents(n: any): number | null {
  const v = typeof n === "string" ? parseFloat(n) : typeof n === "number" ? n : null;
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100);
}

function isoNow() {
  return new Date().toISOString();
}

// Util: valida UUID
function isUuid(v: unknown): v is string {
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// Gera uma chave idempotente por evento + id relevante do payload
function makeExternalEventId(event: string, data: any) {
  const base = data?.id || data?.subscription?.id || data?.refId || "unknown";
  return `${event}:${base}`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json();
    const secret = body?.secret;
    const event = body?.event as string | undefined;
    const data = body?.data ?? {};

    // 1) Validação do segredo (vem no body, não no header)
    if (!secret || secret !== CAKTO_WEBHOOK_SECRET) {
      return new Response("invalid secret", { status: 401 });
    }
    if (!event) {
      return new Response("missing event", { status: 400 });
    }

    // 2) Extração de campos comuns
    const empresaRef: string | null =
      (data?.refId ?? data?.empresaId ?? null);
    let empresa_uuid: string | null = isUuid(empresaRef) ? empresaRef : null;

    const external_event_id = makeExternalEventId(event, data);

    const customer_email: string | null =
      data?.customer?.email ?? null;

    const amount_cents: number | null = toCents(data?.amount ?? data?.offer?.price);
    const currency = "BRL";
    const method: string | null =
      data?.paymentMethod ?? data?.subscription?.paymentMethod ?? null;

    const occurred_at: string =
      data?.paidAt ?? data?.createdAt ?? isoNow();

    // Resolve empresa_uuid se não veio um UUID válido no refId
    if (!empresa_uuid && customer_email) {
      const { data: empresaRow, error: empresaErr } = await supabase
        .from("empresas")
        .select("id, created_at")
        .eq("email", customer_email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (empresaErr) console.error("cakto resolve empresa by email error", { customer_email, error: empresaErr.message });
      if (empresaRow?.id) {
        empresa_uuid = empresaRow.id as string;
      }
    }

    // 3) Idempotência: ignorar se já inserimos payments com esse external_event_id
    const { data: existingPay, error: findPayErr } = await supabase
      .from("payments")
      .select("id, empresa_id")
      .eq("external_event_id", external_event_id)
      .maybeSingle();
    if (findPayErr) throw findPayErr;
    const isDuplicate = !!existingPay;
    if (isDuplicate) {
      console.log("cakto-webhook duplicate", { event, external_event_id, empresa_id: empresa_uuid });
      // Backfill empresa_id caso tenha sido nulo anteriormente
      if (empresa_uuid && existingPay.empresa_id == null) {
        const { error: upPayErr } = await supabase
          .from("payments")
          .update({ empresa_id: empresa_uuid })
          .eq("id", existingPay.id);
        if (upPayErr) console.error("cakto backfill payment empresa_id error", { external_event_id, upPayErr: upPayErr.message });
      }
      // Não retornamos aqui para permitir atualização/ativação da assinatura
    }

    // 4) Decisão por evento
    // status para tabela payments
    let payStatus: "pending" | "approved" | "refused" | "refunded" = "pending";
    // alterações na assinatura
    let subChange:
      | null
      | {
          status?: "active" | "suspended" | "canceled" | "trial";
          is_recurring?: boolean;
          cps?: string;
          cpe?: string;
          cancel_at?: string | null;
          cakto_subscription_id?: string | null;
          cakto_customer_id?: string | null;
        } = null;

    // Datas vindas da Cakto quando for recorrência
    const cktSub = data?.subscription;
    const periodStartISO = cktSub?.updatedAt ?? data?.paidAt ?? data?.createdAt ?? isoNow();
    // Heurística de 1 mês quando não houver no payload
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const periodEndISO = cktSub?.next_payment_date
      ? new Date(cktSub.next_payment_date).toISOString()
      : new Date(new Date(periodStartISO).getTime() + monthMs).toISOString();

    switch (event) {
      case "pix_gerado":
      case "boleto_gerado":
      case "picpay_gerado":
        payStatus = "pending";
        break;

      case "purchase_approved":
        payStatus = "approved";
        // Preferencialmente ativa quando houver payload de assinatura; caso contrário, fallback para período de 1 mês
        if (data?.product?.type === "subscription" || cktSub) {
          subChange = {
            status: "active",
            is_recurring: true,
            cps: periodStartISO,
            cpe: periodEndISO,
            cakto_subscription_id: cktSub?.id ?? null,
            cakto_customer_id: data?.customer?.email ?? null,
          };
        } else {
          // Fallback: tratar compra aprovada como ativação de assinatura
          subChange = {
            status: "active",
            is_recurring: true,
            cps: periodStartISO,
            cpe: periodEndISO,
            cakto_subscription_id: null,
            cakto_customer_id: data?.customer?.email ?? null,
          };
        }
        break;

      case "purchase_refused":
        payStatus = "refused";
        break;

      case "refund":
      case "chargeback":
        payStatus = "refunded";
        subChange = { status: "suspended" };
        break;

      case "subscription_canceled":
        payStatus = "approved"; // só para registrar um payment-event; não representa cobrança
        subChange = { status: "canceled", cancel_at: isoNow() };
        break;

      case "subscription_renewed":
        payStatus = "approved";
        subChange = {
          status: "active",
          is_recurring: true,
          cps: periodStartISO,
          cpe: periodEndISO,
          cakto_subscription_id: cktSub?.id ?? null,
          cakto_customer_id: data?.customer?.email ?? null,
        };
        break;

      case "checkout_abandonment":
        // Apenas log; opcionalmente inserir como pending para analytics
        console.log("cakto checkout_abandonment", { empresa_id: empresa_uuid, external_event_id });
        break;

      default:
        console.log("cakto unknown event", { event });
        return new Response("ignored", { status: 200 });
    }

    // 5) Insert em payments (somente se não duplicado)
    if (!isDuplicate) {
      const { error: payErr } = await supabase.from("payments").insert({
        external_event_id,
        subscription_id: null,
        empresa_id: empresa_uuid,
        customer_email,
        amount_cents,
        currency,
        method,
        status: payStatus,
        occurred_at,
      });
      if (payErr) {
        console.error("cakto payments insert error", { external_event_id, err: payErr.message, empresa_uuid, cakto_subscription: cktSub?.id });
        return new Response("payment insert error", { status: 500 });
      }
    }

    // 6) Atualizar subscriptions quando aplicável
    if (subChange) {
      // precisamos do empresa_id para relacionar; se não veio, não atualiza subscription
      if (empresa_uuid) {
        const updates: any = {
          ...(subChange.status ? { status: subChange.status } : {}),
          ...(subChange.is_recurring !== undefined ? { is_recurring: subChange.is_recurring } : {}),
          ...(subChange.cps ? { current_period_start: subChange.cps } : {}),
          ...(subChange.cpe ? { current_period_end: subChange.cpe } : {}),
          ...(subChange.cancel_at ? { cancel_at: subChange.cancel_at } : {}),
          ...(subChange.cakto_subscription_id ? { cakto_subscription_id: subChange.cakto_subscription_id } : {}),
          ...(subChange.cakto_customer_id ? { cakto_customer_id: subChange.cakto_customer_id } : {}),
        };

        const { data: existingSub, error: findSubErr } = await supabase
          .from("subscriptions")
          .select("id, cakto_subscription_id")
          .eq("empresa_id", empresa_uuid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (findSubErr) throw findSubErr;

        if (existingSub) {
          const { error: upErr } = await supabase
            .from("subscriptions")
            .update(updates)
            .eq("id", existingSub.id);
          if (upErr) throw upErr;
        } else {
          const insertPayload: any = {
            empresa_id: empresa_uuid,
            ...updates,
          };
          if (cktSub?.id) {
            insertPayload.cakto_subscription_id = cktSub.id;
          }
          const { error: insErr } = await supabase.from("subscriptions").insert(insertPayload);
          if (insErr) throw insErr;
        }
      } else {
        console.log("cakto no empresa_uuid (refId) provided; skipping subscription update", { external_event_id });
      }
    }

    console.log("cakto-webhook ok", { event, external_event_id, empresa_id: empresa_uuid });
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("cakto-webhook error", { message: (e as Error).message });
    return new Response("error", { status: 500 });
  }
});