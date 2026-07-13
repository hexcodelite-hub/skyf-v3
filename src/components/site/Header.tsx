import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, User, X, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const links = [
  { to: "/", label: "Domů" },
  { to: "/shop", label: "Shop" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { session, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Odhlášen");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-neon shadow-neon">
            <Zap className="h-5 w-5 text-neon-foreground" strokeWidth={2.5} />
          </div>
          <div className="font-display text-xl font-bold tracking-tight">
            SKYF<span className="text-neon">.</span><span className="text-gold">GG</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "px-3 py-2 text-sm font-semibold text-neon" }}
            >{l.label}</Link>
          ))}
          {session && (
            <Link to="/profile" className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "px-3 py-2 text-sm font-semibold text-neon" }}>Profil</Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {loading ? null : session ? (
            <>
              {profile && (
                <Link to="/profile" className="hidden lg:flex items-center gap-2 rounded-md border border-gold/40 bg-surface px-3 py-1.5 text-sm">
                  <span className="font-display text-gold font-bold">{profile.gems.toLocaleString("cs-CZ")}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Gems</span>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" /> {profile?.kick_name ?? "Profil"}
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button size="sm" className="bg-gradient-neon shadow-neon hover:opacity-90">Admin</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="gap-1">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gap-2 bg-gradient-neon shadow-neon">
                <LogIn className="h-4 w-4" /> Přihlásit
              </Button>
            </Link>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 px-4 py-3">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
                activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold bg-surface text-neon" }}>{l.label}</Link>
            ))}
            {session ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-surface">Profil</Link>
                {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="mt-2 rounded-md bg-gradient-neon px-3 py-2 text-center text-sm font-semibold text-neon-foreground shadow-neon">Admin</Link>}
                <button onClick={signOut} className="mt-2 rounded-md border border-border px-3 py-2 text-sm">Odhlásit se</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="mt-2 rounded-md bg-gradient-neon px-3 py-2 text-center text-sm font-semibold text-neon-foreground shadow-neon">Přihlásit se</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
