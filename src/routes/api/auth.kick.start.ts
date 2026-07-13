import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { siteConfig } from "@/config/site";
import { buildAuthorizeUrl, generatePkcePair, getPublicOrigin } from "@/lib/kick/kick.server";

export const Route = createFileRoute("/api/auth/kick/start")({
  server: {
    handlers: {
      GET: async (event) => {
        const request = event.request;
        const { verifier, challenge } = generatePkcePair();
        const state = randomBytes(16).toString("hex");

        const origin = "https://skyf-v3.netlify.app";
        const redirectUri = "https://skyf-v3.netlify.app/api/auth/kick/callback";

        setCookie("kick_pkce_verifier", verifier, {
         httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600, domain: "skyf-v3.netlify.app"
        });
        setCookie("kick_oauth_state", state, {
         httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600, domain: "skyf-v3.netlify.app"
       });

        try {
          const url = buildAuthorizeUrl({ redirectUri, state, challenge });
          return Response.redirect(url, 302);
        } catch (err) {
          return new Response(
            `Kick OAuth not configured yet: ${(err as Error).message}. ` +
              `Set KICK_CLIENT_ID / KICK_CLIENT_SECRET in project secrets and try again.`,
            { status: 503 },
          );
        }
      },
    },
  },
});
