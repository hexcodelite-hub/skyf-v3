import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const unlockAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data, context }) => {
    const { checkPassword, setGateCookie } = await import("./gate.server");
    if (!checkPassword(data.password)) return { ok: false as const, reason: "invalid_password" };

    const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
    if (!isAdmin) return { ok: false as const, reason: "not_admin" };

    setGateCookie();

    const actor = await context.supabase.from("profiles").select("kick_name").eq("id", context.userId).maybeSingle();
    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      actor_name: actor.data?.kick_name ?? null,
      category: "auth",
      action: "unlocked admin gate",
      target: "/admin",
    });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { clearGateCookie } = await import("./gate.server");
  clearGateCookie();
  return { ok: true };
});

export const checkAdminGate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { verifyGateCookie } = await import("./gate.server");
    const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
    return { unlocked: verifyGateCookie(), isAdmin: !!isAdmin };
  });
