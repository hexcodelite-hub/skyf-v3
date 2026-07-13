import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Coins, Play, Radio, Users, Youtube, Trophy, ShoppingBag } from "lucide-react";
import heroImg from "@/assets/hero-skyf.jpg";
import { SocialButton } from "@/components/site/SocialButton";
import { YouTubePlayer } from "@/components/site/YouTubePlayer";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getLatestVideos } from "@/lib/server-fns/youtube.functions";
import { listLeaderboard } from "@/lib/server-fns/shop.functions";
import { siteConfig } from "@/config/site";

const SOCIALS = {
  kick: `https://kick.com/${siteConfig.channels.kickHandle}`,
  youtube: `https://www.youtube.com/channel/${siteConfig.channels.youtubeChannelId}`,
  discord: siteConfig.channels.discordInvite,
  instagram: `https://instagram.com/${siteConfig.channels.instagramHandle}`,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skyf.gg — Komunitní hub Skyfova Imperia" },
      { name: "description", content: "Sbírej Gemy sledováním streamu na Kicku, vyměňuj za CS2 skiny a poměř síly s Imperiem." },
      { property: "og:title", content: "Skyf.gg — Komunitní hub Skyfova Imperia" },
      { property: "og:description", content: "Sbírej Gemy, vyměňuj za CS2 skiny a soutěž v žebříčku." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: videos = [] } = useQuery({ queryKey: ["yt-latest"], queryFn: () => getLatestVideos() });
  const { data: top = [] } = useQuery({ queryKey: ["leaderboard-mini"], queryFn: () => listLeaderboard() });
  const totalHours = Math.floor(top.reduce((a, u) => a + (u.watch_seconds ?? 0), 0) / 3600);

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <img src={heroImg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-60 [mask-image:linear-gradient(180deg,black_20%,transparent_100%)]" width={1600} height={1200} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neon">
              <Radio className="h-3 w-3 animate-pulse" /> Live na Kick.com/cskyf
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Vítej v <span className="text-neon">Skyfovo</span><br /><span className="text-gold">Imperiu</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Sleduj streamy, sbírej Gemy a vyměňuj je za pravé CS2 skiny. Bez BS, jen komunita a hra.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={SOCIALS.kick} target="_blank" rel="noreferrer">
                <Button size="lg" className="gap-2 bg-gradient-neon text-neon-foreground shadow-neon hover:opacity-90">
                  <Play className="h-4 w-4 fill-current" /> Sledovat live
                </Button>
              </a>
              <Link to="/shop">
                <Button size="lg" variant="outline" className="gap-2 border-gold/50 text-gold hover:bg-gold/10 hover:text-gold">
                  <ShoppingBag className="h-4 w-4" /> Otevřít shop <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4">
              {[
                { l: "Členů", v: top.length.toLocaleString("cs-CZ"), i: <Users className="h-4 w-4" /> },
                { l: "Hodin sledování", v: totalHours.toLocaleString("cs-CZ"), i: <Radio className="h-4 w-4" /> },
                { l: "Nejlepší skóre", v: (top[0]?.gems ?? 0).toLocaleString("cs-CZ"), i: <Coins className="h-4 w-4" /> },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-border bg-surface/80 p-3 backdrop-blur">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{s.i}{s.l}</div>
                  <div className="mt-1 font-display text-2xl font-bold">{s.v}</div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-neon">O Skyfovi</div>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Český CS2 streamer<br />s vlastním <span className="text-gold">Imperiem</span></h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>Skyf je jedním z nejsledovanějších českých tvůrců obsahu okolo Counter-Strike 2. Streamuje denně na Kicku, tvoří highlight videa na YouTube a buduje komunitu, která si sama říká <span className="text-foreground font-semibold">Imperium</span>.</p>
            <p>Tato stránka slouží jako centrální hub — sleduj, jak roste tvůj profil, vyměňuj Gemy za CS2 skiny a soutěž s ostatními členy o vrchol žebříčku.</p>
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-neon">Nejnovější videa</div>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">YouTube feed</h2>
          </div>
          <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-neon">
            Zobrazit vše <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8">
          <YouTubePlayer
            videoId={siteConfig.youtube.featured.id ? undefined : videos[0]?.id}
            title={videos[0]?.title ?? "Skyf YouTube"}
          />
        </div>

        {videos.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-12 text-center text-muted-foreground">
            <Youtube className="mx-auto mb-2 h-8 w-8 text-red-500" />
            Videa se načítají… nebo YouTube API klíč zatím není nakonfigurován.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 2).map((v, i) => (
              <a key={v.id} href={v.url} target="_blank" rel="noreferrer"
                className={`group relative overflow-hidden rounded-xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-neon/50 hover:shadow-neon ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}>
                <div className={`relative overflow-hidden ${i === 0 ? "aspect-[16/10]" : "aspect-video"}`}>
                  <img src={v.thumbnail} alt={v.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    <Youtube className="h-3 w-3" /> #{i + 1}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-neon">{new Date(v.publishedAt).toLocaleDateString("cs-CZ")}</div>
                    <h3 className={`mt-1 font-display font-bold text-white ${i === 0 ? "text-2xl" : "text-base"}`}>{v.title}</h3>
                  </div>
                </div>
              </a>
            ))}
            {videos.slice(2).map((v, idx) => (
              <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="group flex gap-3 rounded-xl border border-border bg-surface p-3 transition-all hover:border-neon/50">
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md">
                  <img src={v.thumbnail} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[9px] font-bold text-neon">#{idx + 3}</div>
                </div>
                <div className="min-w-0">
                  <h4 className="line-clamp-2 font-display text-sm font-semibold group-hover:text-neon">{v.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(v.publishedAt).toLocaleDateString("cs-CZ")}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* SOCIALS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-neon">Social hub</div>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Sleduj Skyfa všude</h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          <SocialButton href={SOCIALS.kick} label="Kick" handle="@cskyf" accent="neon"
            icon={<svg viewBox="0 0 24 24" className="h-6 w-6 fill-neon"><path d="M4 4h4v4h2v4h2v-4h2V8h2V4h4v6h-2v2h-2v4h2v2h2v6h-4v-4h-2v-2h-2v-4h-2v4h-2v-4H4V4z"/></svg>} />
          <SocialButton href={SOCIALS.youtube} label="YouTube" handle="@skyfcs" accent="gold" icon={<Youtube className="h-6 w-6 text-red-500" />} />
          <SocialButton href={SOCIALS.discord} label="Discord" handle="Skyfovo Imperium" accent="discord"
            icon={<svg viewBox="0 0 24 24" className="h-6 w-6 fill-[oklch(0.62_0.19_275)]"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.579.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>} />
          <SocialButton href={SOCIALS.instagram} label="Instagram" handle="@skyfcs2" accent="insta"
            icon={<svg viewBox="0 0 24 24" className="h-6 w-6" fill="url(#ig)"><defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f09433"/><stop offset=".5" stopColor="#dc2743"/><stop offset="1" stopColor="#bc1888"/></linearGradient></defs><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4 1 .5.4.7.8 1 1.4.2.4.3 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.4-.4.5-.8.7-1.4 1-.4.2-1 .3-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-1-.5-.4-.7-.8-1-1.4-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.4.4-.5.8-.7 1.4-1 .4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.1a4.9 4.9 0 110 9.8 4.9 4.9 0 010-9.8zm0 8a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2zm5.1-8.2a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z"/></svg>} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-surface p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-hero opacity-70" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Trophy className="mb-3 h-8 w-8 text-gold" />
              <h3 className="font-display text-3xl font-bold md:text-4xl">Připoj se k <span className="text-gold">Top 10</span></h3>
              <p className="mt-2 max-w-lg text-muted-foreground">Sleduj denní streamy, sbírej Gemy a dostaň se mezi nejlepší členy Imperia.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/leaderboard"><Button size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold/10 hover:text-gold">Žebříček</Button></Link>
              <Link to="/auth"><Button size="lg" className="bg-gradient-neon text-neon-foreground shadow-neon">Přihlásit se</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
