import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";
import { siteConfig } from "@/config/site";
import { exchangeCodeForToken, fetchKickUser, getPublicOrigin } from "@/lib/kick/kick.server";

export const Route = createFileRoute("/api/auth/kick/callback")({
  server: {
    handlers: {
      GET: async (event) => {
        const request = event.request;
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        if (error) return htmlError(`Kick OAuth error: ${error}`);
        if (!code || !state) return htmlError("Missing code/state.");

        const cookieState = getCookie(event, "kick_oauth_state");
        const verifier = getCookie(event, "kick_pkce_verifier");
        deleteCookie(event, "kick_oauth_state");
        deleteCookie(event, "kick_pkce_verifier");
        if (!cookieState || cookieState !== state) return htmlError("Invalid OAuth state.");
        if (!verifier) return htmlError("Missing PKCE verifier.");

        const origin = getPublicOrigin(url.origin);
        const redirectUri = origin + siteConfig.kick.redirectPath;

        try {
          const token = await exchangeCodeForToken({ code, verifier, redirectUri });
          const user = await fetchKickUser(token.access_token);
          // TODO: link the Kick user to the current Supabase user (write to
          // `profiles.kick_id` / `profiles.kick_name`) once the desired
          // account-linking policy is decided. Left intentionally minimal so
          // credentials can be dropped in and the flow verified end-to-end.
          console.log("[kick] linked user", user.data?.[0]?.name);
          return Response.redirect(`${origin}/profile?kick=linked`, 302);
        } catch (err) {
          return htmlError((err as Error).message);
        }
      },
    },
  },
});

function htmlError(message: string) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Kick OAuth</title>
     <body style="font-family:system-ui;background:#0b0b10;color:#fff;padding:2rem">
       <h1>Kick přihlášení selhalo</h1><p>${escapeHtml(message)}</p>
       <p><a style="color:#7cf" href="/auth">Zpět na přihlášení</a></p>
     </body>`,
    { status: 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
