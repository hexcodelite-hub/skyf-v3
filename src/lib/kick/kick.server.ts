/**
 * Server-only Kick Developer (Beta) helpers.
 */
import { createHash, randomBytes } from "node:crypto";
import https from "node:https";
import { siteConfig } from "@/config/site";

export function getPublicOrigin(fallback?: string) {
  return process.env.PUBLIC_APP_URL || siteConfig.publicAppUrl || fallback || "";
}

export function generatePkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function buildAuthorizeUrl(opts: { redirectUri: string; state: string; challenge: string }) {
  const cfg = siteConfig.kick;
  const clientId = process.env.KICK_CLIENT_ID || cfg.clientId;
  if (!clientId) throw new Error("KICK_CLIENT_ID is not configured");
  const url = new URL(cfg.endpoints.authorize);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("scope", cfg.scopes.join(" "));
  url.searchParams.set("state", opts.state);
  url.searchParams.set("code_challenge", opts.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type KickTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
};

export async function exchangeCodeForToken(opts: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<KickTokenResponse> {
  const clientId = process.env.KICK_CLIENT_ID || siteConfig.kick.clientId;
  const clientSecret = process.env.KICK_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) throw new Error("Kick client credentials are not configured");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: opts.code,
    redirect_uri: opts.redirectUri,
    code_verifier: opts.verifier,
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  return new Promise((resolve, reject) => {
    const url = new URL(siteConfig.kick.endpoints.token);
    const req = https.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("Failed to parse response")); }
        } else {
          reject(new Error(`Kick token exchange failed (${res.statusCode}): ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function fetchKickUser(accessToken: string) {
  // Tu môžeme nechať fetch, pretože táto funkcia zatiaľ chybu nespôsobovala
  const res = await fetch(`${siteConfig.kick.endpoints.api}/users`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Kick /users failed (${res.status})`);
  return (await res.json()) as { data?: Array<{ user_id: number; name: string; profile_picture?: string }> };
}