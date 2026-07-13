import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Coins, Package } from "lucide-react";
import { listActiveSkins, purchaseSkin } from "@/lib/server-fns/shop.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Skyf.gg" },
      { name: "description", content: "Vyměň své loyalty Gemy za CS2 skiny. Denně se přidávají nové položky." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const router = useRouter();
  const { profile, session } = useAuth();
  const { data: skins = [], isLoading } = useQuery({
    queryKey: ["shop-skins"],
    queryFn: () => listActiveSkins(),
  });
  const buyFn = useServerFn(purchaseSkin);

  const buy = async (id: string, label: string) => {
    if (!session) { router.navigate({ to: "/auth" }); return; }
    if (!profile?.trade_url) {
      toast.error("Nejprve nastav Steam trade URL v profilu");
      router.navigate({ to: "/profile" });
      return;
    }
    try {
      await buyFn({ data: { skinId: id } });
      toast.success(`Zakoupeno: ${label}`, { description: "Admin ti zašle skin přes Steam trade nabídku." });
      router.invalidate();
    } catch (e: any) {
      const map: Record<string, string> = {
        insufficient_gems: "Nedostatek Gemů", out_of_stock: "Vyprodáno",
        user_banned: "Účet je zabanován", missing_trade_url: "Chybí Steam trade URL",
        skin_unavailable: "Skin není dostupný",
      };
      toast.error(map[e.message] ?? e.message);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-neon">Shop</div>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">CS2 Skiny za Gemy</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Vyber si z aktuálně dostupných skinů. Po nákupu ti admin pošle Steam trade nabídku podle uloženého trade linku.
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-surface px-4 py-3">
            <Coins className="h-5 w-5 text-gold" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tvůj zůstatek</div>
              <div className="font-display text-xl font-bold text-gold">{profile.gems.toLocaleString("cs-CZ")}</div>
            </div>
          </div>
        )}
      </div>

      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[16/12] animate-pulse rounded-xl border border-border bg-surface" />
        ))}
        {!isLoading && skins.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-8 w-8 text-neon" />
            Shop je zatím prázdný. Admin přidá první skiny brzy.
          </div>
        )}
        {skins.map((s) => (
          <div key={s.id} className="group relative overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all hover:-translate-y-1 hover:border-neon/50 hover:shadow-neon">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-neon/20 via-surface-2 to-gold/10">
              {s.image_url ? (
                <img src={s.image_url} alt={`${s.weapon} ${s.skin}`} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="grid h-full place-items-center text-6xl opacity-30">🔫</div>
              )}
              <div className="absolute right-3 top-3 rounded-full border border-border bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                {s.stock} ks
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-display text-lg font-semibold leading-tight">{s.skin}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.weapon}{s.wear ? ` · ${s.wear}` : ""}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-display text-xl font-bold text-gold">
                  <Coins className="h-4 w-4" />
                  {s.price_gems.toLocaleString("cs-CZ")}
                </div>
                <Button size="sm" disabled={s.stock <= 0} onClick={() => buy(s.id, `${s.weapon} | ${s.skin}`)}
                  className="bg-gradient-neon text-neon-foreground shadow-neon hover:opacity-90">
                  {s.stock <= 0 ? "Vyprodáno" : "Koupit"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {!session && (
        <div className="mt-12 rounded-xl border border-neon/40 bg-surface p-6 text-center">
          <p className="text-muted-foreground">Pro nákup se musíš <Link to="/auth" className="text-neon underline">přihlásit</Link>.</p>
        </div>
      )}
    </main>
  );
}
