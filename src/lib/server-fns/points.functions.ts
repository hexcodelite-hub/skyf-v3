import { createServerFn } from "@tanstack/react-start";
import { siteConfig } from "@/config/site";

/**
 * Fetches loyalty / watch-time points for a Kick user from the configured
 * Kick-app endpoint. Wire your endpoint URL via VITE_POINTS_SYNC_URL and the
 * server-side bearer token via KICK_POINTS_TOKEN.
 *
 * Returns `null` when sync is not configured yet so the UI can gracefully
 * fall back to the local `profiles.gems` value.
 */
export const getKickPoints = createServerFn({ method: "GET" })
  .inputValidator((input: { kickName: string }) => input)
  .handler(async ({ data }) => {
    const base = siteConfig.points.syncUrl;
    if (!base) return null;
    const token = process.env.KICK_POINTS_TOKEN;
    const url = base.includes("{name}")
      ? base.replace("{name}", encodeURIComponent(data.kickName))
      : `${base.replace(/\/$/, "")}/${encodeURIComponent(data.kickName)}`;
    try {
      const res = await fetch(url, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const json: any = await res.json();
      const raw = Number(json.points ?? json.balance ?? json.gems ?? 0);
      return { gems: Math.floor(raw * siteConfig.points.gemsPerUnit) };
    } catch (err) {
      console.error("[points] sync failed", err);
      return null;
    }
  });
