import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  kick_name: string;
  avatar_url: string | null;
  gems: number;
  trade_url: string | null;
  watch_seconds: number;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    profile: null,
    isAdmin: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadFor(session: Session | null) {
      if (!session) {
        if (mounted) setState({ loading: false, session: null, profile: null, isAdmin: false });
        return;
      }
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, kick_name, avatar_url, gems, trade_url, watch_seconds").eq("id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ]);
      if (!mounted) return;
      const isAdmin = !!roles?.some((r) => r.role === "admin" || r.role === "owner");
      setState({ loading: false, session, profile: profile as Profile | null, isAdmin });
    }

    supabase.auth.getSession().then(({ data }) => loadFor(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => loadFor(session));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
