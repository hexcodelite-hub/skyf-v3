import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Ban, Coins, LayoutDashboard, Lock, Package, Scroll, ShieldCheck, Store, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { checkAdminGate, unlockAdmin, lockAdmin } from "@/lib/server-fns/gate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Skyf.gg" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Přehled", icon: LayoutDashboard, exact: true },
  { to: "/admin/shop", label: "Shop", icon: Store },
  { to: "/admin/orders", label: "Objednávky", icon: Package },
  { to: "/admin/points", label: "Body & hráči", icon: Coins },
  { to: "/admin/permissions", label: "Práva & bany", icon: ShieldCheck },
  { to: "/admin/logs", label: "System console", icon: Scroll },
];

function AdminLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, isAdmin, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) { router.navigate({ to: "/auth" }); return; }
    setChecked(true);
  }, [loading, session, router]);

  if (loading || !checked) return <div className="grid min-h-screen place-items-center text-muted-foreground">Načítání…</div>;
  if (!isAdmin) return <NotAdmin />;
  return <AdminGate><AdminShell pathname={pathname} /></AdminGate>;
}

function NotAdmin() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="max-w-sm rounded-2xl border border-destructive/40 bg-surface p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-4 font-display text-xl font-bold">Přístup zamítnut</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tento účet nemá admin práva.</p>
        <Link to="/" className="mt-4 inline-flex text-sm text-neon hover:underline">← Zpět na web</Link>
      </div>
    </div>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-gate"], queryFn: () => checkAdminGate() });
  const unlockFn = useServerFn(unlockAdmin);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await unlockFn({ data: { password } });
      if (!res.ok) {
        toast.error(res.reason === "invalid_password" ? "Nesprávné heslo" : "Nemáš admin práva");
      } else {
        toast.success("Odemčeno");
        setPassword("");
        refetch();
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Načítání…</div>;
  if (data?.unlocked) return <>{children}</>;

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-neon/40 bg-surface p-8 shadow-neon">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-neon shadow-neon">
            <Lock className="h-6 w-6 text-neon-foreground" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Admin Gate</h1>
          <p className="mt-1 text-sm text-muted-foreground">Zadej globální admin heslo</p>
        </div>
        <Input type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Heslo" className="bg-surface-2" />
        <Button type="submit" disabled={busy} className="mt-4 w-full bg-gradient-neon text-neon-foreground shadow-neon">
          {busy ? "…" : "Odemknout"}
        </Button>
        <Link to="/" className="mt-4 inline-flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-neon">
          <ArrowLeft className="h-3 w-3" /> Zpět na web
        </Link>
      </form>
    </div>
  );
}

function AdminShell({ pathname }: { pathname: string }) {
  const { profile } = useAuth();
  const router = useRouter();
  const lockFn = useServerFn(lockAdmin);

  const lock = async () => {
    await lockFn();
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-neon shadow-neon">
              <Zap className="h-5 w-5 text-neon-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-lg font-bold leading-none">SKYF<span className="text-neon">.</span>GG</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-neon">Admin panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon">
              <ArrowLeft className="h-4 w-4" /> Zpět
            </Link>
            <Button variant="outline" size="sm" onClick={lock}>Uzamknout</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-[88px] lg:self-start">
          <nav className="rounded-xl border border-border bg-surface p-2">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-gradient-neon text-neon-foreground shadow-neon" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  }`}>
                  <Icon className="h-4 w-4" />{item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 rounded-xl border border-gold/40 bg-surface p-4">
            <div className="flex items-center gap-2 text-gold">
              <Ban className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">Přihlášen</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Jako <span className="font-semibold text-foreground">{profile?.kick_name}</span>
            </p>
          </div>
        </aside>

        <main><Outlet /></main>
      </div>
    </div>
  );
}
