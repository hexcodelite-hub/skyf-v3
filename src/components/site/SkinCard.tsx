import { Coins } from "lucide-react";
import type { Skin } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const rarityLabel: Record<Skin["rarity"], string> = {
  consumer: "Consumer",
  industrial: "Industrial",
  milspec: "Mil-Spec",
  restricted: "Restricted",
  classified: "Classified",
  covert: "Covert",
  contraband: "Contraband",
};

const rarityColor: Record<Skin["rarity"], string> = {
  consumer: "text-slate-300",
  industrial: "text-sky-300",
  milspec: "text-blue-400",
  restricted: "text-violet-400",
  classified: "text-pink-400",
  covert: "text-red-400",
  contraband: "text-amber-300",
};

export function SkinCard({ skin, onBuy }: { skin: Skin; onBuy?: (s: Skin) => void }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all hover:-translate-y-1 hover:border-neon/50 hover:shadow-neon">
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{ background: skin.gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6))]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          <div className="rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
            {skin.weapon}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-widest ${rarityColor[skin.rarity]}`}>
            ★ {rarityLabel[skin.rarity]}
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
          {skin.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{skin.weapon}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-display text-xl font-bold text-gold">
            <Coins className="h-4 w-4" />
            {skin.price.toLocaleString("cs-CZ")}
          </div>
          <Button
            size="sm"
            onClick={() => onBuy?.(skin)}
            className="bg-gradient-neon text-neon-foreground shadow-neon hover:opacity-90"
          >
            Koupit
          </Button>
        </div>
      </div>
    </div>
  );
}
