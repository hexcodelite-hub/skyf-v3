import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
import { listAllOrders, setOrderStatus } from "@/lib/server-fns/admin.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: () => listAllOrders() });
  const setFn = useServerFn(setOrderStatus);
  const [filter, setFilter] = useState<"all" | "processing" | "shipped">("all");

  const filtered = orders.filter((o: any) => filter === "all" ? true : o.status === filter);

  const toggle = async (id: string, current: string) => {
    try {
      await setFn({ data: { orderId: id, status: current === "shipped" ? "processing" : "shipped" } });
      toast.success(current === "shipped" ? "Vráceno na Processing" : "Označeno jako Odesláno");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Objednávky</h1>
        <p className="text-sm text-muted-foreground">Klikni na trade link a odešli skin.</p>
      </div>

      <div className="flex gap-2">
        {(["all", "processing", "shipped"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}
            className={filter === f ? "bg-gradient-neon text-neon-foreground shadow-neon" : ""}>
            {f === "all" ? "Vše" : f === "processing" ? "Ke zpracování" : "Odeslané"}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3">Kupec</th><th className="p-3">Skin</th>
              <th className="p-3 hidden md:table-cell">Datum</th>
              <th className="p-3">Trade link</th><th className="p-3">Status</th><th className="p-3 text-right">Akce</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Žádné objednávky</td></tr>}
            {filtered.map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 font-semibold">{o.buyer?.kick_name}</td>
                <td className="p-3">
                  <div>{o.skin?.weapon} <span className="text-muted-foreground">|</span> {o.skin?.skin}</div>
                  <div className="text-xs text-gold">{o.price_gems.toLocaleString("cs-CZ")} pts</div>
                </td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(o.created_at).toLocaleString("cs-CZ")}</td>
                <td className="p-3">
                  {o.trade_url_snapshot ? (
                    <a href={o.trade_url_snapshot} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-neon/40 bg-neon/10 px-2 py-1 text-xs font-semibold text-neon hover:bg-neon/20">
                      Otevřít <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="p-3">
                  {o.status === "shipped"
                    ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">Odesláno</span>
                    : <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400">Processing</span>}
                </td>
                <td className="p-3">
                  <div className="flex justify-end">
                    {o.status === "shipped"
                      ? <Button size="sm" variant="outline" className="gap-1" onClick={() => toggle(o.id, o.status)}><RotateCcw className="h-3.5 w-3.5" /> Vrátit</Button>
                      : <Button size="sm" className="gap-1 bg-gradient-neon text-neon-foreground shadow-neon" onClick={() => toggle(o.id, o.status)}><Check className="h-3.5 w-3.5" /> Odesláno</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
