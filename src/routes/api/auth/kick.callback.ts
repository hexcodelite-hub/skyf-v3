import { createFileRoute } from "@tanstack/react-router";
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

    const cookieHeader = event.request.headers.get("Cookie") || "";
    
    const getCookieValue = (name: string) => {
      const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const cookieState = getCookieValue("kick_oauth_state");
    const verifier = getCookieValue("kick_pkce_verifier");

    console.log("TEST: Nova verzia kodu bezi!");

    if (!cookieState || cookieState !== state) return htmlError("Invalid OAuth state.");
    if (!verifier) return htmlError("Missing PKCE verifier.");

    const origin = getPublicOrigin(url.origin);
    const redirectUri = origin + siteConfig.kick.redirectPath;

    try {
      const token = await exchangeCodeForToken({ code, verifier, redirectUri });
      const user = await fetchKickUser(token.access_token);
      
      // 2. Vytvorenie odpovede a zmazanie cookies cez hlavičky (Max-Age=0)
      const response = Response.redirect(`${origin}/profile?kick_linked`, 302);
      response.headers.append("Set-Cookie", "kick_oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax");
      response.headers.append("Set-Cookie", "kick_pkce_verifier=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax");
      
      return response;
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
