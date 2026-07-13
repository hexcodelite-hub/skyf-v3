
-- 1) Profiles: remove public read, add scoped policies
DROP POLICY IF EXISTS "profiles readable by everyone" ON public.profiles;

CREATE POLICY "users read own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "admins read all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- 2) Safe public leaderboard view (excludes trade_url and other sensitive fields)
CREATE OR REPLACE VIEW public.public_leaderboard
WITH (security_invoker = false) AS
SELECT id, kick_name, avatar_url, gems, watch_seconds
FROM public.profiles;

GRANT SELECT ON public.public_leaderboard TO anon, authenticated;

-- 3) Lock down SECURITY DEFINER functions
-- Trigger functions: not callable by clients
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_updated_at() FROM PUBLIC, anon, authenticated;

-- Admin/user RPCs: revoke from PUBLIC and anon; keep authenticated (functions self-check role)
REVOKE ALL ON FUNCTION public.admin_grant_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_revoke_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_ban_user(uuid, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_unban_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_adjust_gems(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_order_status(uuid, order_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purchase_skin(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unban_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_gems(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_order_status(uuid, order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_skin(uuid) TO authenticated;

-- Role-check helpers: needed inside RLS policies for authenticated users; keep authenticated grant, remove anon/public
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
