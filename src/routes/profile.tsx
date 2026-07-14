import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Clock, Coins, ExternalLink, LogOut, Package, Radio, Shield } from "lucide-react";
import { getMyOrders, getMyProfile, updateTradeUrl } from "@/lib/server-fns/shop.functions";
import { getKickPoints } from "@/lib/server-fns/points.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Můj profil — Skyf.gg" },
      { name: "description", content: "Přehled tvého účtu, Gemů, inventáře a statistik ze streamu." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const kickId = localStorage.getItem("kick_user_id");
      
      if (!data.session && !kickId) {
        router.navigate({ to: "/auth" });
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-12">Načítání profilu…</main>;
  return <ProfileInner />;
}

function ProfileInner() {
  const router = useRouter();
  const { data: profile, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => {
      const kickId = typeof window !== "undefined" ? localStorage.getItem("kick_user_id") : null;
      return getMyProfile({ data: { kickId } });
    },
    enabled: typeof window !== "undefined" && !!localStorage.getItem("kick_user_id"),
  });

  const { data: orders = [], refetch: refetchOrders } = useQuery({ queryKey: ["me-orders"], queryFn: () => getMyOrders() });
  const { data: livePoints } = useQuery({
    queryKey: ["kick-points", profile?.kick_name],
    queryFn: () => getKickPoints({ data: { kickName: profile!.kick_name } }),
    enabled: !!profile?.kick_name && !!siteConfig.points.syncUrl,
    refetchInterval: siteConfig.points.pollIntervalMs,
  });
  const updateFn = useServerFn(updateTradeUrl);
  const [editingUrl, setEditingUrl] = useState(false);
  const [tradeUrl, setTradeUrl] = useState("");

  useEffect(() => { setTradeUrl(profile?.trade_url ?? ""); }, [profile?.trade_url]);

  useEffect(() => {
    if (!profile) return;
    const ch = supabase
      .channel(`profile-${profile.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${profile.id}` }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${profile.id}` }, () => refetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id, refetch, refetchOrders, profile]);

  const saveUrl = async () => {
    try {
      await updateFn({ data: { tradeUrl } });
      toast.success("Trade URL uloženo");
      setEditingUrl(false);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  const signOut = async () => { 
    document.cookie = "kick_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    await supabase.auth.signOut(); 
    router.navigate({ to: "/" }); 
  };

  if (!profile) return <main className="mx-auto max-w-6xl px-4 py-12">Načítání…</main>;

  const hours = Math.floor((profile.watch_seconds ?? 0) / 3600);
  const displayGems = livePoints?.gems ?? profile.gems;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* ... tu pokračuje tvoj pôvodný kód od riadku <div className="relative... */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 md:p-8">
         <div className="absolute inset-0 bg-gradient-hero opacity-60" />
         <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
           <div className="flex items-center gap-5">
             {profile.avatar_url ? (
               <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full bg-surface-2" />
             ) : (
               <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-neon shadow-neon">
                 <span className="font-display text-3xl font-bold text-neon-foreground">{profile.kick_name.slice(0, 2).toUpperCase()}</span>
               </div>
             )}
             <div>
               <div className="flex items-center gap-2">
                 <h1 className="font-display text-3xl font-bold">{profile.kick_name}</h1>
                 <Badge variant="outline" className="border-neon/50 text-neon">Ověřeno</Badge>
               </div>
               <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                 <span className="inline-flex items-center gap-1"><Radio className="h-3.5 w-3.5 text-neon" /> Kick</span>
                 <span>·</span>
                 <span>Člen od {new Date(profile.created_at).toLocaleDateString("cs-CZ")}</span>
               </div>
             </div>
           </div>
           <Button variant="outline" className="gap-2 self-start" onClick={signOut}><LogOut className="h-4 w-4" /> Odhlásit se</Button>
         </div>
       </div>

       <div className="mt-6 grid gap-4 sm:grid-cols-3">
         <StatCard icon={<Coins className="h-5 w-5 text-gold" />} label="Gemy" value={displayGems.toLocaleString("cs-CZ")} tone="gold" />
         <StatCard icon={<Clock className="h-5 w-5 text-neon" />} label="Hodin sledování" value={`${hours} h`} tone="neon" />
         <StatCard icon={<Package className="h-5 w-5" />} label="Objednávek" value={String(orders.length)} />
       </div>

       <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
         <div className="flex items-center gap-3 min-w-0 flex-1">
           <Shield className="h-5 w-5 text-neon shrink-0" />
           <div className="min-w-0 flex-1">
             <div className="font-semibold">Steam Trade URL</div>
             {editingUrl ? (
               <div className="mt-2 flex gap-2">
                 <Input value={tradeUrl} onChange={(e) => setTradeUrl(e.target.value)} placeholder="https://steamcommunity.com/tradeoffer/new/..." className="bg-surface-2" />
                 <Button size="sm" onClick={saveUrl} className="bg-gradient-neon text-neon-foreground shadow-neon">Uložit</Button>
                 <Button size="sm" variant="outline" onClick={() => setEditingUrl(false)}>Zrušit</Button>
               </div>
             ) : (
               <div className="text-xs text-muted-foreground truncate">{profile.trade_url || <span className="text-amber-400">Nenastaveno — nezbytné pro nákup skinů</span>}</div>
             )}
           </div>
         </div>
         {!editingUrl && <Button variant="outline" size="sm" onClick={() => setEditingUrl(true)}>Upravit</Button>}
       </div>

       <section className="mt-10">
         <div className="flex items-center justify-between">
           <h2 className="font-display text-2xl font-bold">Moje objednávky</h2>
           <Link to="/shop" className="text-sm text-neon hover:underline">Otevřít shop →</Link>
         </div>

         <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
           <table className="w-full text-sm">
             <thead className="bg-surface-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
               <tr>
                 <th className="p-3">Skin</th>
                 <th className="p-3 hidden sm:table-cell">Cena</th>
                 <th className="p-3 hidden md:table-cell">Datum</th>
                 <th className="p-3">Status</th>
               </tr>
             </thead>
             <tbody>
               {orders.length === 0 ? (
                 <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">
                   Zatím nemáš žádné skiny. <Link to="/shop" className="text-neon hover:underline">Otevři shop →</Link>
                 </td></tr>
               ) : orders.map((o: any) => (
                 <tr key={o.id} className="border-t border-border">
                   <td className="p-3">
                     <div className="font-semibold">{o.skins?.weapon} <span className="text-muted-foreground">|</span> {o.skins?.skin}</div>
                   </td>
                   <td className="p-3 hidden sm:table-cell text-gold">{o.price_gems.toLocaleString("cs-CZ")} pts</td>
                   <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(o.created_at).toLocaleDateString("cs-CZ")}</td>
                   <td className="p-3"><StatusBadge status={o.status} /></td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </section>
    </main>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "gold" | "neon" }) {
  const border = tone === "gold" ? "border-gold/40" : tone === "neon" ? "border-neon/40" : "border-border";
  return (
    <div className={`rounded-xl border ${border} bg-surface p-5`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">{icon} {label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "processing" | "shipped" }) {
  if (status === "shipped") {
    return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400"><ExternalLink className="h-3 w-3" /> Odesláno</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400"><Clock className="h-3 w-3 animate-pulse" /> Zpracovává se</span>;
}