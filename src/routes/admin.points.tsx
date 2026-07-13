import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Coins, Minus, Plus, Search } from "lucide-react";
import { adjustGems, searchUsers } from "@/lib/server-fns/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/points")({ component: AdminPoints });

function AdminPoints() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const { data: users = [] } = useQuery({ queryKey: ["admin-users", q], queryFn: () => searchUsers({ data: { q } }) });
  const adjustFn = useServerFn(adjustGems);

  const apply = async (userId: string, name: string, sign: 1 | -1) => {
    const raw = parseInt(amounts[userId] || "0", 10);
    if (!raw) { toast("Zadej počet Gemů"); return; }
    try {
      await adjustFn({ data: { userId, delta: raw * sign, note: "manual adjust" } });
      toast.success(`${sign > 0 ? "Přidáno" : "Odečteno"} ${raw} Gemů uživateli ${name}`);
      setAmounts((p) => ({ ...p, [userId]: "" }));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Správa Gemů</h1>
        <p className="text-sm text-muted-foreground">Přidávej nebo odebírej Gemy konkrétním hráčům.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Hledej Kick jméno..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-surface" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="p-3">Hráč</th><th className="p-3 text-right hidden sm:table-cell">Gemy</th><th className="p-3 text-right">Úprava</th></tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {u.avatar_url && <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full bg-surface-2" />}
                    <span className="font-semibold">{u.kick_name}</span>
                  </div>
                </td>
                <td className="p-3 text-right hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1 font-display font-bold text-gold"><Coins className="h-3.5 w-3.5" />{u.gems.toLocaleString("cs-CZ")}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Input type="number" placeholder="0" value={amounts[u.id] || ""} onChange={(e) => setAmounts((p) => ({ ...p, [u.id]: e.target.value }))} className="w-24 bg-surface-2" />
                    <Button size="icon" variant="outline" className="h-9 w-9 hover:border-emerald-500/50 hover:text-emerald-400" onClick={() => apply(u.id, u.kick_name, 1)}><Plus className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" className="h-9 w-9 hover:border-destructive/50 hover:text-destructive" onClick={() => apply(u.id, u.kick_name, -1)}><Minus className="h-4 w-4" /></Button>
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
