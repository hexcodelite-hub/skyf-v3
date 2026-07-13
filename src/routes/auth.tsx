import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radio, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Přihlášení — Skyf.gg" },
      { name: "description", content: "Přihlas se do Skyfova Imperia a sbírej loyalty Gemy." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kickName, setKickName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 1. Skontroluj Supabase
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/profile" });
        return;
      }
      
      // 2. Ak nie je Supabase session, skontroluj naše kick_user_id
      const kickId = localStorage.getItem("kick_user_id");
      if (kickId) {
        navigate({ to: "/profile" });
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { kick_name: kickName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Účet vytvořen. Ověř e-mail (pokud je vyžadováno) a přihlaš se.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Přihlášen");
        navigate({ to: "/profile" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Chyba přihlášení");
    } finally {
      setBusy(false);
    }
  };

  const kickConfigured = !!siteConfig.kick.clientId;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-neon shadow-neon">
            <Zap className="h-6 w-6 text-neon-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">
            {mode === "signin" ? "Vítej zpět" : "Vytvořit účet"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Přihlaš se a pokračuj sbírat Gemy" : "Zaregistruj se do Skyfova Imperia"}
          </p>
        </div>

        <div className="grid gap-2">
          <a href="/api/auth/kick/start" aria-disabled={!kickConfigured}
             onClick={(e) => { if (!kickConfigured) { e.preventDefault(); toast.error("Kick OAuth zatím není nakonfigurován (chybí VITE_KICK_CLIENT_ID)."); } }}>
            <Button type="button" variant="outline"
              className="w-full gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400">
              <Radio className="h-4 w-4" /> Pokračovat přes Kick
            </Button>
          </a>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> nebo <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-3" onSubmit={submit}>
          {mode === "signup" && (
            <div>
              <Label htmlFor="kn">Kick jméno</Label>
              <Input id="kn" required value={kickName} onChange={(e) => setKickName(e.target.value)} className="bg-surface-2" />
            </div>
          )}
          <div>
            <Label htmlFor="em">Email</Label>
            <Input id="em" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-surface-2" />
          </div>
          <div>
            <Label htmlFor="pw">Heslo</Label>
            <Input id="pw" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-surface-2" />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-neon text-neon-foreground shadow-neon">
            {busy ? "…" : mode === "signin" ? "Přihlásit se" : "Registrovat se"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Nemáš účet? Zaregistruj se" : "Už máš účet? Přihlas se"}
        </button>
      </div>
    </main>
  );
}
