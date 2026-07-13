import { setCookie, deleteCookie, getCookie } from "@tanstack/react-start/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "skyf_admin_gate";

function sign(ts: string) {
  return createHmac("sha256", process.env.SESSION_SECRET || "").update(ts).digest("hex");
}

export function verifyGateCookie(): boolean {
  const cookie = getCookie(COOKIE_NAME);
  if (!cookie) return false;
  const [ts, sig] = cookie.split(".");
  if (!ts || !sig) return false;
  const expected = sign(ts);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const t = parseInt(ts, 10);
  return !!t && Date.now() - t < 1000 * 60 * 60 * 8;
}

export function setGateCookie() {
  const ts = Date.now().toString();
  setCookie(COOKIE_NAME, `${ts}.${sign(ts)}`, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8,
  });
}

export function clearGateCookie() {
  deleteCookie(COOKIE_NAME, { path: "/" });
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_GLOBAL_PASSWORD ?? "";
  const a = Buffer.from(password || "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
