import { SOCIALS } from "@/lib/mock-data";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="font-display text-2xl font-bold">
              SKYF<span className="text-neon">.</span>
              <span className="text-gold">GG</span>
            </div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Komunitní hub pro fanoušky českého CS2 streamera Skyfa. Sbírej body,
              vyměňuj za skiny a buď součástí Imperia.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" className="hover:text-neon">YouTube</a>
            <a href={SOCIALS.kick} target="_blank" rel="noreferrer" className="hover:text-neon">Kick</a>
            <a href={SOCIALS.discord} target="_blank" rel="noreferrer" className="hover:text-neon">Discord</a>
            <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" className="hover:text-neon">Instagram</a>
          </div>
        </div>
        <div className="mt-8 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Skyfovo Imperium. Neoficiální komunitní projekt.
          Není přidruženo k Valve Corporation ani CS2.
        </div>
      </div>
    </footer>
  );
}
