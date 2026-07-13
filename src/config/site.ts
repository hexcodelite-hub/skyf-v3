/**
 * Central site configuration.
 *
 * Edit values here (or override via the corresponding VITE_* env vars in .env)
 * to change channels, featured videos, OAuth endpoints, and points-sync
 * endpoints without touching component code.
 *
 * Secrets (client_secret, api keys, tokens) MUST NOT live in this file — they
 * belong in server-only environment variables read via `process.env.*` inside
 * server functions / server routes.
 */

const env = import.meta.env;

export const siteConfig = {
  // ── App ───────────────────────────────────────────────────────────────
  // Public origin of this deployment (e.g. "https://skyf.gg"). Used to
  // build the OAuth redirect URI. Leave empty to auto-detect from the
  // incoming request origin at runtime.
  publicAppUrl: env.VITE_PUBLIC_APP_URL ?? "",

  // ── Channels / socials ────────────────────────────────────────────────
  channels: {
    kickHandle: env.VITE_KICK_CHANNEL ?? "cskyf",
    youtubeChannelId: env.VITE_YOUTUBE_CHANNEL_ID ?? "UCqz_7UBp0hlBDGvPr8Vi7LQ",
    discordInvite: env.VITE_DISCORD_INVITE ?? "https://discord.gg/skyf",
    instagramHandle: env.VITE_INSTAGRAM_HANDLE ?? "skyfcs2",
  },

  // ── YouTube player ────────────────────────────────────────────────────
  // Featured video shown in the hero player. Either a single video ID or a
  // playlist ID (set `kind` to "playlist"). To rotate content just edit here.
  youtube: {
    featured: {
      kind: (env.VITE_YT_FEATURED_KIND ?? "video") as "video" | "playlist",
      // Leave empty string to auto-fall-back to the latest video from the API.
      id: env.VITE_YT_FEATURED_ID ?? "",
    },
    // Additional pinned video IDs rendered as a strip under the player.
    // Comma-separated list in VITE_YT_PINNED_IDS overrides this default.
    pinnedIds: (env.VITE_YT_PINNED_IDS ?? "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean),
  },

  // ── Kick Developer (Beta) OAuth ──────────────────────────────────────
  // Docs: https://docs.kick.com/getting-started/kick-apps-setup
  //
  // Client ID / redirect URI can be overridden per-environment. Client secret
  // and any bearer tokens are read on the server (process.env.KICK_CLIENT_SECRET,
  // process.env.KICK_API_TOKEN). Never expose those to the client bundle.
  kick: {
    clientId: env.VITE_KICK_CLIENT_ID ?? "",
    // Must match the redirect URI registered in the Kick developer portal.
    redirectPath: env.VITE_KICK_REDIRECT_PATH ?? "/api/auth/kick/callback",
    // Scopes requested during authorization. See Kick docs for the full list.
    scopes: (env.VITE_KICK_SCOPES ?? "user:read channel:read events:subscribe")
      .split(/\s+/)
      .filter(Boolean),
    endpoints: {
      authorize: env.VITE_KICK_AUTHORIZE_URL ?? "https://id.kick.com/oauth/authorize",
      token: env.VITE_KICK_TOKEN_URL ?? "https://id.kick.com/oauth/token",
      // Public API base — used by server helpers to call Kick on behalf of the app.
      api: env.VITE_KICK_API_BASE ?? "https://api.kick.com/public/v1",
    },
  },

  // ── Points sync ──────────────────────────────────────────────────────
  // If your Kick app exposes an endpoint that returns the current watch-time
  // / loyalty points for a user, configure it here. The server-side sync
  // job will POST/GET this endpoint using process.env.KICK_POINTS_TOKEN
  // for authorization (never put the token in this file).
  points: {
    // Full URL of your Kick-app points endpoint. Leave empty to disable sync.
    syncUrl: env.VITE_POINTS_SYNC_URL ?? "",
    // How often the client polls for updated points (ms).
    pollIntervalMs: Number(env.VITE_POINTS_POLL_MS ?? 60_000),
    // How much a gem is worth relative to Kick "loyalty" units. Adjust per app.
    gemsPerUnit: Number(env.VITE_POINTS_GEMS_PER_UNIT ?? 1),
  },
} as const;

export type SiteConfig = typeof siteConfig;
