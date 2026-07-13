import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { siteConfig } from "@/config/site";
import { buildAuthorizeUrl, generatePkcePair, getPublicOrigin } from "@/lib/kick/kick.server";

export const Route = createFileRoute("/api/auth/kick/start")({
  server: {
    handlers: {
      GET: async (event) => {
        const url = new URL(event.request.url);
        const origin = getPublicOrigin(url.origin);
        const redirectUri = origin + siteConfig.kick.redirectPath;

        const { verifier, challenge } = generatePkcePair();
        const state = crypto.randomUUID();

        const authUrl = buildAuthorizeUrl({ redirectUri, state, challenge });

        event.cookies.set("kick_oauth_state", state, { httpOnly: true, secure: true });
        event.cookies.set("kick_pkce_verifier", verifier, { httpOnly: true, secure: true });
        return Response.redirect(authUrl, 302);
      },
    },
  },
});