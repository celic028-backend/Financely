import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Server-side push. Pozива ga pg_cron sa telom { kind }.
//  - due     : ponavljanja koja dospevaju danas, a nisu evidentirana ovog meseca
//  - daily   : korisnik nije ništa uneo danas
//  - monthly : rezime prošlog meseca
//  - goal    : trošiš brže nego što cilj štednje dozvoljava
// Poštuje notify_* prekidače iz profila. Bez VAPID ključeva → 501.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@financely.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MESECI = [
  "januar", "februar", "mart", "april", "maj", "jun",
  "jul", "avgust", "septembar", "oktobar", "novembar", "decembar",
];

function belgradeToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Belgrade" });
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Datum dospeća za mesec (y, m 0-based) → YYYY-MM-DD. */
function dueDay(schedule: string, y: number, m: number): string {
  if (schedule === "last_thursday") {
    const last = new Date(y, m + 1, 0);
    const diff = (last.getDay() - 4 + 7) % 7;
    last.setDate(last.getDate() - diff);
    return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
  }
  const d = parseInt(schedule.split(":")[1], 10);
  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  return `${y}-${pad(m + 1)}-${pad(day)}`;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(Math.round(n));
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface Sub {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
}

async function sendToUser(subs: Sub[], payload: Record<string, unknown>): Promise<void> {
  const body = JSON.stringify(payload);
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      );
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: "push not configured" }), {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const kind: string = (await req.json().catch(() => ({}))).kind ?? "due";
  const today = belgradeToday();
  const [ty, tm] = today.split("-").map(Number);
  const monthKey = today.slice(0, 7);

  // Pretplate grupisane po korisniku.
  const { data: subsData } = await admin.from("push_subscriptions").select("*");
  const byUser = new Map<string, Sub[]>();
  for (const s of (subsData ?? []) as Sub[]) {
    const list = byUser.get(s.user_id) ?? [];
    list.push(s);
    byUser.set(s.user_id, list);
  }
  if (byUser.size === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("*")
    .in("user_id", [...byUser.keys()]);

  let sent = 0;

  for (const p of profiles ?? []) {
    const subs = byUser.get(p.user_id);
    if (!subs?.length) continue;

    if (kind === "due" && (p.notify_due ?? true)) {
      const { data: rec } = await admin
        .from("recurring_items")
        .select("*")
        .eq("user_id", p.user_id)
        .eq("active", true);
      const { data: txs } = await admin
        .from("transactions")
        .select("category_id, occurred_on")
        .eq("user_id", p.user_id)
        .gte("occurred_on", `${monthKey}-01`);
      const due: string[] = [];
      for (const item of rec ?? []) {
        const dd = dueDay(item.schedule, ty, tm - 1);
        if (dd !== today) continue;
        const already = (txs ?? []).some((t) => t.category_id === item.category_id);
        if (!already) due.push(item.name);
      }
      if (due.length) {
        await sendToUser(subs, {
          title: "Danas stiže",
          body: due.join(", "),
          tag: "due",
          url: "/dodaj",
        });
        sent++;
      }
    }

    if (kind === "daily" && (p.notify_daily ?? false)) {
      const { count } = await admin
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", p.user_id)
        .eq("occurred_on", today);
      if (!count) {
        await sendToUser(subs, {
          title: "Kako je prošao dan?",
          body: "Dodaj današnje troškove za par sekundi.",
          tag: "daily",
          url: "/dodaj",
        });
        sent++;
      }
    }

    if (kind === "goal" && (p.notify_goal ?? true)) {
      const { data: goal } = await admin
        .from("savings_goals")
        .select("*")
        .eq("user_id", p.user_id)
        .maybeSingle();
      if (goal) {
        const { data: txs } = await admin
          .from("transactions")
          .select("amount, type, occurred_on")
          .eq("user_id", p.user_id)
          .gte("occurred_on", `${monthKey}-01`);
        let inc = 0, exp = 0;
        for (const t of txs ?? []) {
          if (t.type === "income") inc += t.amount;
          else exp += t.amount;
        }
        const target = goal.mode === "percent"
          ? Math.round(inc * (goal.rate ?? 0))
          : (goal.fixed_amount ?? 0);
        if (target > 0 && inc - exp < target) {
          await sendToUser(subs, {
            title: "Pazi na cilj štednje",
            body: "Trošiš brže nego što cilj ovog meseca dozvoljava.",
            tag: "goal",
            url: "/",
          });
          sent++;
        }
      }
    }

    if (kind === "monthly" && (p.notify_monthly ?? true)) {
      const prev = new Date(ty, tm - 2, 1);
      const prevKey = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
      const { data: txs } = await admin
        .from("transactions")
        .select("amount, type, occurred_on")
        .eq("user_id", p.user_id)
        .gte("occurred_on", `${prevKey}-01`)
        .lt("occurred_on", `${monthKey}-01`);
      let inc = 0, exp = 0;
      for (const t of txs ?? []) {
        if (t.type === "income") inc += t.amount;
        else exp += t.amount;
      }
      if (inc > 0 || exp > 0) {
        await sendToUser(subs, {
          title: `Rezime — ${MESECI[prev.getMonth()]}`,
          body: `Prihod ${fmt(inc)} din · trošak ${fmt(exp)} din · ostalo ${fmt(inc - exp)} din`,
          tag: "monthly",
          url: "/analitika",
        });
        sent++;
      }
    }
  }

  return new Response(JSON.stringify({ kind, sent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
