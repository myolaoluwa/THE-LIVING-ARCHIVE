import "server-only";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createHash, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { commerceConfig, type CommerceConfig } from "./config";

export function commerceServices() {
  const config = commerceConfig();
  if (!config) return null;
  const db = createClient(config.supabaseUrl, config.supabaseSecret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
    },
  });
  const stripe = new Stripe(config.stripeKey, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
  return { config, db, stripe };
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function cookieName(orderId: string) {
  return `archive_order_${orderId}`;
}
export function sameOrigin(request: Request, config: CommerceConfig) {
  return request.headers.get("origin") === config.origin;
}
export async function rememberOrder(orderId: string, token: string) {
  const jar = await cookies();
  jar.set(cookieName(orderId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function rateLimit(
  request: Request,
  kind: string,
  services: NonNullable<ReturnType<typeof commerceServices>>,
  limit = 10,
  seconds = 60,
) {
  const ip = (
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    "local"
  )
    .split(",")[0]
    .trim();
  for (const [key, max] of [
    [`${kind}:${ip}`, limit],
    [`${kind}:global`, Math.min(limit * 10, 1000)],
  ] as const) {
    const hash = createHmac("sha256", services.config.rateSecret)
      .update(key)
      .digest("hex");
    const result = await services.db.rpc("commerce_rate_limit", {
      p_key: hash,
      p_limit: max,
      p_seconds: seconds,
    });
    if (result.error || result.data !== true) return false;
  }
  return true;
}
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex",
  "Referrer-Policy": "no-referrer",
};
export function reply(message: string, status: number) {
  return Response.json({ message }, { status, headers: privateHeaders });
}
