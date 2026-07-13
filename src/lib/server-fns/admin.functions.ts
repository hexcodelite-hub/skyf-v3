import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
async function assertAdminGateAndRole(context: { supabase: any; userId: string }) {
  const { verifyGateCookie } = await import("./gate.server");
  if (!verifyGateCookie()) throw new Error("admin_gate_locked");
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

// ---- Stats & data (admin gate + role required) ----

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminGateAndRole(context);
    const [{ count: users }, { count: skins }, { count: pending }, { data: recentLogs }, { data: topPlayers }, { data: revenueRow }] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("skins").select("id", { count: "exact", head: true }).eq("active", true),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "processing"),
      context.supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(6),
      context.supabase.from("profiles").select("id, kick_name, avatar_url, gems").order("gems", { ascending: false }).limit(5),
      context.supabase.from("orders").select("price_gems").gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
    ]);
    const revenue = (revenueRow ?? []).reduce((a: number, r: any) => a + (r.price_gems || 0), 0);
    return { users: users ?? 0, skins: skins ?? 0, pending: pending ?? 0, revenue, recentLogs: recentLogs ?? [], topPlayers: topPlayers ?? [] };
  });

export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminGateAndRole(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, price_gems, status, created_at, shipped_at, trade_url_snapshot, buyer:profiles!orders_buyer_id_fkey(id, kick_name, avatar_url), skin:skins(id, weapon, skin, wear, image_url)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; status: "processing" | "shipped" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const { error } = await context.supabase.rpc("admin_set_order_status", { _order_id: data.orderId, _status: data.status });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Skins CRUD ----

export const upsertSkin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; weapon: string; skin: string; wear?: string | null; price_gems: number; image_url?: string | null; stock: number; active: boolean }) => {
    if (!d.weapon?.trim() || !d.skin?.trim()) throw new Error("Weapon and skin required");
    if (d.price_gems < 0 || d.stock < 0) throw new Error("Neplatné hodnoty");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const payload = {
      weapon: data.weapon.trim(),
      skin: data.skin.trim(),
      wear: data.wear?.trim() || null,
      price_gems: data.price_gems,
      image_url: data.image_url || null,
      stock: data.stock,
      active: data.active,
    };
    if (data.id) {
      const { error } = await context.supabase.from("skins").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("skins").insert(payload);
      if (error) throw new Error(error.message);
    }
    const actor = await context.supabase.from("profiles").select("kick_name").eq("id", context.userId).maybeSingle();
    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      actor_name: actor.data?.kick_name ?? null,
      category: "shop",
      action: data.id ? "updated skin" : "created skin",
      target: `${payload.weapon} | ${payload.skin}`,
    });
    return { ok: true };
  });

export const deleteSkin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const { data: skin } = await context.supabase.from("skins").select("weapon, skin").eq("id", data.id).maybeSingle();
    const { error } = await context.supabase.from("skins").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const actor = await context.supabase.from("profiles").select("kick_name").eq("id", context.userId).maybeSingle();
    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      actor_name: actor.data?.kick_name ?? null,
      category: "shop",
      action: "deleted skin",
      target: skin ? `${skin.weapon} | ${skin.skin}` : data.id,
    });
    return { ok: true };
  });

// ---- Points ----

export const searchUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const q = (data.q || "").trim();
    let query = context.supabase.from("profiles").select("id, kick_name, avatar_url, gems").order("gems", { ascending: false }).limit(50);
    if (q) query = query.ilike("kick_name", `%${q}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adjustGems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; delta: number; note?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const { error } = await context.supabase.rpc("admin_adjust_gems", { _user_id: data.userId, _delta: data.delta, _note: data.note ?? "" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Roles / bans ----

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminGateAndRole(context);
    const { data, error } = await context.supabase.from("user_roles").select("role, user:profiles!user_roles_user_id_fkey(id, kick_name, avatar_url)");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listBans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminGateAndRole(context);
    const { data, error } = await context.supabase
      .from("bans")
      .select("id, reason, duration_hours, expires_at, active, created_at, user:profiles!bans_user_id_fkey(id, kick_name, avatar_url)")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listBanTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminGateAndRole(context);
    const { data, error } = await context.supabase.from("ban_templates").select("*").order("label");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "owner" | "admin" | "moderator" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const { error } = await context.supabase.rpc("admin_grant_role", { _user_id: data.userId, _role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "owner" | "admin" | "moderator" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const { error } = await context.supabase.rpc("admin_revoke_role", { _user_id: data.userId, _role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const banUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; reason: string; durationHours: number | null }) => {
    if (!d.reason?.trim()) throw new Error("Reason required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const { error } = await context.supabase.rpc("admin_ban_user", { _user_id: data.userId, _reason: data.reason.trim(), _duration_hours: (data.durationHours ?? null) as number });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unbanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const { error } = await context.supabase.rpc("admin_unban_user", { _user_id: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Audit logs ----

type AuditCategory = "shop" | "order" | "points" | "permission" | "ban" | "auth";
const AUDIT_CATEGORIES: AuditCategory[] = ["shop", "order", "points", "permission", "ban", "auth"];

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { category?: string; q?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    let query = context.supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
    if (data.category && data.category !== "all" && (AUDIT_CATEGORIES as string[]).includes(data.category)) {
      query = query.eq("category", data.category as AuditCategory);
    }
    if (data.q) query = query.or(`action.ilike.%${data.q}%,target.ilike.%${data.q}%,actor_name.ilike.%${data.q}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---- Storage upload helper (signed url path) ----
export const createSkinImageUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { filename: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminGateAndRole(context);
    const safe = data.filename.replace(/[^a-z0-9._-]+/gi, "_");
    const path = `${Date.now()}-${safe}`;
    const { data: signed, error } = await context.supabase.storage.from("skins").createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    const publicUrl = context.supabase.storage.from("skins").getPublicUrl(path).data.publicUrl;
    return { path, token: signed.token, publicUrl, signedUrl: signed.signedUrl };
  });
