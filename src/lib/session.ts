import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "suii_session";
const SECRET = process.env.AUTH_SECRET ?? "suii-local-dev-secret";

export function signSession(userId: string) {
  const hmac = createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

export function readSessionUserId(token: string | undefined) {
  if (!token) return null;
  const [userId, hmac] = token.split(".");
  if (!userId || !hmac) return null;
  const expected = createHmac("sha256", SECRET).update(userId).digest("hex");
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export function hasSessionCookie(token: string | undefined) {
  return Boolean(readSessionUserId(token));
}
