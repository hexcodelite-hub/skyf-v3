import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";
import { exchangeCodeForToken, fetchKickUser, getPublicOrigin } from "@/lib/kick/kick.server";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/api/auth/kick/callback")({
  server: {
    handlers: {
      GET: async (event) => {
        const url = new URL(event.request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) return htmlError(`Kick OAuth error: ${error}`);
        if (!code || !state) return htmlError("Missing code/state.");

        const { data, error: dbError } = await supabase
          .from("oauth_states")
          .select("verifier")
          .eq("state", state)
          .single();

        if (dbError || !data) return htmlError("Invalid or expired OAuth state.");

        const verifier = data.verifier;
        await supabase.from("oauth_states").delete().eq("state", state);

        const origin = getPublicOrigin(url.origin);
        const redirectUri = origin + siteConfig.kick.redirectPath;

        try {
          const token = await exchangeCodeForToken({ code, verifier, redirectUri });
          const user = await fetchKickUser(token.access_token);
          const kickUser = user.data[0];

          await supabase.from("users").upsert({
            id: kickUser.user_id,
            username: kickUser.name,
            email: kickUser.email,
            avatar_url: kickUser.profile_picture,
          });

          // Návrat presmerovania cez štandardný Response objekt
          return new Response(null, {
            status: 302,
            headers: {
              "Location": `${origin}/profile?kick_linked=true`,
              "Set-Cookie": `kick_user_id=${kickUser.user_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
            },
          });
        } catch (err: any) {
          console.log("CHYBA V KICK CALLBACK:", err);
          return htmlError(err.message || "Unknown error");
        }
      },
    },
  },
});

function htmlError(message: string) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Kick OAuth</title>
     <body style="font-family:system-ui;background:#0b0b10;color:#fff;padding:2rem">
       <h1>Kick prihlásenie zlyhalo</h1><p>${escapeHtml(message)}</p>
       <p><a style="color:#7cf" href="/auth">Späť na prihlásenie</a></p>
     </body>`,
    { status: 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}