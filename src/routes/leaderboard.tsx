import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Coins, Crown, Medal, Search, Trophy } from "lucide-react";
import { listLeaderboard } from "@/lib/server-fns/shop.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Skyf.gg" },
      { name: "description", content: "Žebříček nejaktivnějších členů Skyfova Imperia podle Gemů." },
    ],
  }),
  component: Leaderboard,
});

const PAGE_SIZE = 10;

function Leaderboard() {
  const { data: list = [] } = useQuery({ queryKey: ["leaderboard"], queryFn: () => listLeaderboard() });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? list.filter((u) => u.kick_name.toLowerCase().includes(q)) : list;
  }, [query, list]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-gold" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-neon">Leaderboard</div>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Žebříček Imperia</h1>
        <p className="mt-2 text-muted-foreground">Top hráči podle Gemů. Aktualizováno v reálném čase.</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {list.slice(0, 3).map((u, i) => {
          const styles = [
            "sm:order-2 border-gold shadow-gold bg-gradient-to-b from-gold/10 to-transparent",
            "sm:order-1 border-slate-400/40",
            "sm:order-3 border-amber-700/40",
          ];
          return (
            <div key={u.id} className={`relative rounded-2xl border-2 bg-surface p-5 text-center ${styles[i]}`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1 font-display text-xs font-bold uppercase tracking-widest">#{i + 1}</div>
              <img src={u.avatar_url ?? `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(u.kick_name)}`} alt="" className="mx-auto h-20 w-20 rounded-full bg-surface-2" />
              <div className="mt-3 font-display text-lg font-bold">{u.kick_name}</div>
              <div className="mt-1 flex items-center justify-center gap-1 text-gold">
                <Coins className="h-4 w-4" />
                <span className="font-display text-xl font-bold">{u.gems.toLocaleString("cs-CZ")}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{Math.floor((u.watch_seconds ?? 0) / 3600)} h sledování</div>
            </div>
          );
        })}
        {list.length === 0 && <div className="col-span-full text-center text-muted-foreground">Zatím žádní hráči.</div>}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Hledej podle Kick jména..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="pl-9 bg-surface" />
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} hráčů</div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3 w-16">Rank</th>
              <th className="p-3">Kick uživatel</th>
              <th className="p-3 text-right hidden sm:table-cell">Sledováno</th>
              <th className="p-3 text-right">Gemy</th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Žádní hráči nenalezeni</td></tr>
            ) : pageUsers.map((u, i) => {
              const rank = (currentPage - 1) * PAGE_SIZE + i + 1;
              return (
                <tr key={u.id} className="border-t border-border hover:bg-surface-2/50">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 font-display font-bold">
                      {rankIcon(rank)}
                      <span className={rank <= 3 ? "text-gold" : "text-muted-foreground"}>#{rank}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url ?? `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(u.kick_name)}`} alt="" className="h-8 w-8 rounded-full bg-surface-2" />
                      <span className="font-semibold">{u.kick_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right text-muted-foreground hidden sm:table-cell">{Math.floor((u.watch_seconds ?? 0) / 3600)} h</td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-1 font-display font-bold text-gold">
                      <Coins className="h-3.5 w-3.5" /> {u.gems.toLocaleString("cs-CZ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Předchozí</Button>
        <div className="text-sm text-muted-foreground">Strana <span className="font-display font-bold text-foreground">{currentPage}</span> z {totalPages}</div>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Další</Button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Trophy className="h-3.5 w-3.5" /> Top 3 dostávají měsíční bonus skinů
      </div>
    </main>
  );
}
