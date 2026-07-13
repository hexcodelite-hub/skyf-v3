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

        const response = Response.redirect(authUrl, 302);
        response.headers.append("Set-Cookie", `kick_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`);
        response.headers.append("Set-Cookie", `kick_pkce_verifier=${verifier}; Path=/; HttpOnly; Secure; SameSite=Lax`);
        
        return response;
      },
    },
  },
});