import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Ban, Coins, Package, ShieldCheck, ShoppingBag, Terminal } from "lucide-react";
import { listAuditLogs } from "@/lib/server-fns/admin.functions";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/logs")({ component: AdminLogs });

type Category = "shop" | "order" | "points" | "permission" | "ban" | "auth";
const categoryMeta: Record<Category, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  shop: { icon: ShoppingBag, color: "text-neon", label: "Shop" },
  order: { icon: Package, color: "text-gold", label: "Objednávka" },
  points: { icon: Coins, color: "text-gold", label: "Gemy" },
  permission: { icon: ShieldCheck, color: "text-neon", label: "Práva" },
  ban: { icon: Ban, color: "text-destructive", label: "Ban" },
  auth: { icon: Terminal, color: "text-neon", label: "Auth" },
};

function AdminLogs() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const { data: logs = [] } = useQuery({ queryKey: ["audit", cat, q], queryFn: () => listAuditLogs({ data: { category: cat, q } }) });

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const l of logs) {
      const day = new Date(l.created_at).toLocaleDateString("cs-CZ");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(l);
    }
    return [...map.entries()];
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Terminal className="h-6 w-6 text-neon" />
        <div>
          <h1 className="font-display text-3xl font-bold">System console</h1>
          <p className="text-sm text-muted-foreground">Detailní audit log všech aktivit.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Hledej v logu..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm bg-surface" />
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
          {(["all", "shop", "order", "points", "permission", "ban", "auth"] as const).map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                cat === c ? "bg-gradient-neon text-neon-foreground shadow-neon" : "text-muted-foreground hover:text-foreground"
              }`}>
              {c === "all" ? "Vše" : categoryMeta[c as Category].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {grouped.length === 0 && <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted-foreground">Žádné záznamy</div>}
        {grouped.map(([day, entries]) => (
          <div key={day}>
            <div className="mb-3 flex items-center gap-3">
              <div className="font-display text-sm font-bold uppercase tracking-widest text-neon">{day}</div>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{entries.length} záznamů</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-surface font-mono text-sm">
              {entries.map((l: any) => {
                const meta = categoryMeta[l.category as Category];
                const Icon = meta.icon;
                return (
                  <div key={l.id} className="flex items-start gap-3 border-t border-border/50 px-4 py-2.5 first:border-t-0 hover:bg-surface-2/50">
                    <span className="text-xs text-muted-foreground pt-0.5 w-20 shrink-0">{new Date(l.created_at).toLocaleTimeString("cs-CZ")}</span>
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${meta.color}`} />
                    <div className="min-w-0 flex-1">
                      <div>
                        <span className="text-neon">{l.actor_name ?? "system"}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span>{l.action}</span>
                      </div>
                      {l.target && <div className="text-xs text-muted-foreground">{l.target}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
