# Skyf.gg — Full Backend & Integration Plan

This turns the current mock-data site into a real, deployable app: Lovable Cloud database + auth, Kick OAuth, YouTube v3 sync, atomic Gem economy, and a hardened admin panel.

## 1. Lovable Cloud (Database + Storage + Auth)

Enable Lovable Cloud. Schemas (all with RLS + explicit grants):

- `profiles` — `id (uuid = auth.uid)`, `kick_id`, `kick_name`, `avatar_url`, `gems (int)`, `trade_url`, `watch_seconds`, `created_at`
- `user_roles` — `id`, `user_id`, `role` (`app_role` enum: `owner|admin|moderator`) — separate table, `has_role()` SECURITY DEFINER (per user-roles rules)
- `skins` — `id`, `weapon`, `skin`, `wear`, `price_gems`, `image_url`, `stock`, `active`, `created_at`
- `orders` — `id`, `buyer_id → profiles`, `skin_id`, `price_gems`, `status` (`processing|shipped`), `trade_url_snapshot`, `created_at`, `shipped_at`
- `inventory` — `id`, `user_id`, `skin_id`, `acquired_at`, `order_id`
- `bans` — `id`, `user_id`, `reason`, `duration_hours` (null = permanent), `created_by`, `expires_at`, `active`
- `ban_templates` — `id`, `label`, `reason`, `duration_hours`
- `audit_logs` — `id`, `actor_id`, `category` (`shop|order|points|permission|ban|auth`), `action`, `target`, `metadata jsonb`, `created_at`
- Storage bucket `skins` (public read) for admin skin image uploads

**Atomic purchase**: SECURITY DEFINER RPC `purchase_skin(skin_id)` that in one transaction: verifies gems ≥ price, decrements gems, decrements stock, inserts `orders` (status=processing), inserts `inventory` row, writes `audit_logs`. Prevents race conditions / negative balances.

**Gem adjust / status toggle / ban / role grant** — all as SECURITY DEFINER RPCs that check `has_role(auth.uid(),'admin')` and log to `audit_logs`.

Seed the `test` account as `owner` in a migration; clear all mock rows.

## 2. Authentication

- **Kick OAuth** via dev.kick.com — since Lovable Cloud doesn't have native Kick provider, implement as a per-user OAuth flow: TanStack server route `/api/public/auth/kick/start` (redirects to Kick authorize URL with PKCE) and `/api/public/auth/kick/callback` (exchanges code, fetches Kick profile, upserts `profiles`, mints a Supabase session via admin `signInWithIdToken`-style custom flow using service role → creates/links a Cloud user by Kick email, returns session cookie).
- Secrets needed: `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_REDIRECT_URI` — will request via secrets form after user confirms.
- Profile page reads real gems / orders / inventory from DB.

## 3. Admin Two-Step Gate

- Layout `/admin` (already `_authenticated`-worthy) gates on: (a) `has_role(user,'owner'|'admin')` AND (b) session flag `admin_unlocked=true` set by submitting the global password `1234` (stored server-side as `ADMIN_GLOBAL_PASSWORD` secret, timing-safe compare in a server fn, encrypted session cookie via `useSession`).
- Only the `test` account gets `owner` role in seed → effectively restricts access to that account until roles are granted.
- Wrong password / non-admin → redirect to `/`.

## 4. Admin CRUD + Uploads

- `/admin/shop`: create/edit/delete skins, upload image to `skins` storage bucket, toggle active, edit stock/price.
- `/admin/orders`: list orders joined with buyer + skin, toggle `processing ⇄ shipped` via RPC (logs + updates profile view).
- `/admin/points`: search users, +/- gems via RPC.
- `/admin/permissions`: grant/revoke roles via RPC; ban UI with template dropdown (`ban_templates`) + manual reason/duration fields; unban.
- `/admin/logs`: paginated `audit_logs` grouped by day, filter by category/actor/search.

## 5. YouTube Integration

- Channel ID `UCqz_7UBp0hlBDGvPr8Vi7LQ`.
- Server fn `getLatestVideos()` calls YouTube Data API v3 `search?channelId=…&order=date&maxResults=6` using `YOUTUBE_API_KEY` (secret, will request).
- Cached 10 min in-memory per worker; returns `{id,title,thumbnail,publishedAt}` for homepage grid.

## 6. Real-time UI

- Profile & admin/orders subscribe via `supabase.channel()` to `profiles` (own row) and `orders` — gems balance and order status update live after admin actions.

## 7. Deployment Readiness

- All secrets via Lovable Cloud secret store (never in code).
- All tables ship with RLS + grants in the same migration.
- `/api/public/*` routes (Kick callback, YouTube proxy if needed) verify state/PKCE.
- `robots noindex` on `/admin`.
- Remove `src/lib/mock-data.ts` usage from every route; replace with server-fn + useSuspenseQuery reads.

## Secrets I'll request after you approve

- `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET` (from dev.kick.com — create an app, redirect URI = `https://<your-app>.lovable.app/api/public/auth/kick/callback`)
- `YOUTUBE_API_KEY` (Google Cloud Console → YouTube Data API v3)
- `ADMIN_GLOBAL_PASSWORD` — I'll set to `1234` as you specified (recommend changing later)
- `SESSION_SECRET` — auto-generated

## Build order

1. Enable Cloud → migrations (schema + RLS + grants + RPCs + seed `test` owner)
2. Request Kick + YouTube secrets
3. Kick OAuth server routes + login button
4. Replace mock reads on Profile / Shop / Leaderboard with DB reads
5. `purchase_skin` wired into Shop
6. Admin two-step gate + real CRUD on all admin pages + storage uploads
7. YouTube feed on homepage
8. Realtime subscriptions
9. Verify build + smoke test

## Confirmations needed

- OK to hardcode channel `UCqz_7UBp0hlBDGvPr8Vi7LQ` and use `test` as the sole seeded owner?
- OK to store `1234` as `ADMIN_GLOBAL_PASSWORD` (weak — recommend rotating)?
- Confirm you have a Kick developer app ready (or want steps first)?

Approve and I'll start with step 1 (Cloud + migrations).
