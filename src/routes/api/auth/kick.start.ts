import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { siteConfig } from "@/config/site";
import { getKickAuthUrl, getPublicOrigin } from "@/lib/kick/kick.server";

export const Route = createFileRoute("/api/auth/kick/start")({
  server: {
    handlers: {
      GET: async (event) => {
        const url = new URL(event.request.url);
        const origin = getPublicOrigin(url.origin);
        const redirectUri = origin + siteConfig.kick.redirectPath;

        // 1. Získaj autorizačnú URL a hodnoty pre bezpečnosť
        const { url: authUrl, state, verifier } = await getKickAuthUrl(redirectUri);

        // 2. Ulož state a verifier do cookies (pre kontrolu v callbacku)
        setCookie("kick_oauth_state", state, { httpOnly: true, secure: true });
        setCookie("kick_pkce_verifier", verifier, { httpOnly: true, secure: true });

        // 3. Presmeruj používateľa na Kick
        return Response.redirect(authUrl, 302);
      },
    },
  },
});