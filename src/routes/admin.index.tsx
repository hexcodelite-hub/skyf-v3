import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Coins, Package, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { getAdminOverview } from "@/lib/server-fns/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => getAdminOverview() });

  if (isLoading || !data) return <div className="text-muted-foreground">Načítání…</div>;

  const stats = [
    { label: "Registrovaných", value: data.users.toLocaleString("cs-CZ"), icon: Users, tone: "neon" as const },
    { label: "Aktivních skinů", value: String(data.skins), icon: ShoppingBag, tone: "neon" as const },
    { label: "K odeslání", value: String(data.pending), icon: Package, tone: "gold" as const },
    { label: "Tržby 30 dní", value: `${data.revenue.toLocaleString("cs-CZ")} pts`, icon: TrendingUp, tone: "gold" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Přehled</h1>
        <p className="text-sm text-muted-foreground">Aktuální stav Imperia a rychlé statistiky.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const border = s.tone === "gold" ? "border-gold/40" : "border-neon/40";
          return (
            <div key={s.label} className={`rounded-xl border ${border} bg-surface p-5`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.tone === "gold" ? "text-gold" : "text-neon"}`} />
              </div>
              <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Top hráči</h2>
            <Coins className="h-4 w-4 text-gold" />
          </div>
          <div className="space-y-2">
            {data.topPlayers.map((u: any, i: number) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-bold text-neon w-6">#{i + 1}</span>
                  {u.avatar_url && <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full" />}
                  <span className="font-semibold">{u.kick_name}</span>
                </div>
                <span className="font-display font-bold text-gold">{u.gems.toLocaleString("cs-CZ")}</span>
              </div>
            ))}
            {data.topPlayers.length === 0 && <div className="text-sm text-muted-foreground">Zatím žádní hráči</div>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Poslední aktivita</h2>
            <Activity className="h-4 w-4 text-neon" />
          </div>
          <div className="space-y-2">
            {data.recentLogs.map((l: any) => (
              <div key={l.id} className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{l.actor_name ?? "system"}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString("cs-CZ")}</span>
                </div>
                <div className="text-xs text-muted-foreground">{l.action} — <span className="text-foreground">{l.target}</span></div>
              </div>
            ))}
            {data.recentLogs.length === 0 && <div className="text-sm text-muted-foreground">Žádná aktivita</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
