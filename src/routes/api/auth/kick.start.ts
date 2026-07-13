import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";
import { buildAuthorizeUrl, generatePkcePair, getPublicOrigin } from "@/lib/kick/kick.server";
import { supabase } from "@/lib/supabase"; 

export const Route = createFileRoute("/api/auth/kick/start")({
  server: {
    handlers: {
      GET: async (event) => {
        const url = new URL(event.request.url);
        const origin = getPublicOrigin(url.origin);
        const redirectUri = origin + siteConfig.kick.redirectPath;

        const { verifier, challenge } = generatePkcePair();
        const state = crypto.randomUUID();

        await supabase.from("oauth_states").insert({ 
          state: state, 
          verifier: verifier 
        });

        const authUrl = buildAuthorizeUrl({ redirectUri, state, challenge });

        return Response.redirect(authUrl, 302);
      },
    },
  },
});