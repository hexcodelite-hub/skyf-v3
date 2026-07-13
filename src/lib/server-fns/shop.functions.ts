import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listActiveSkins = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data, error } = await sb.from("skins").select("*").eq("active", true).order("price_gems", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  // Use admin client to bypass RLS but project ONLY safe columns (never trade_url).
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, kick_name, avatar_url, gems, watch_seconds")
    .order("gems", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const purchaseSkin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { skinId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: orderId, error } = await context.supabase.rpc("purchase_skin", { _skin_id: data.skinId });
    if (error) throw new Error(error.message);
    return { orderId };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, price_gems, status, created_at, shipped_at, skins(weapon, skin, wear, image_url)")
      .eq("buyer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateTradeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tradeUrl: string }) => {
    const v = String(d.tradeUrl || "").trim();
    if (v.length > 500) throw new Error("Trade URL příliš dlouhé");
    if (v && !/^https?:\/\/steamcommunity\.com\/tradeoffer\/new\//i.test(v)) throw new Error("Neplatný Steam trade URL");
    return { tradeUrl: v };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update({ trade_url: data.tradeUrl || null }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
