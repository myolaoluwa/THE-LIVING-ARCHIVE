import "server-only";
import { z } from "zod";

export function commerceConfig() {
  if (process.env.COMMERCE_ENABLED !== "true") return null;
  const live = process.env.STRIPE_MODE === "live";
  const parsed = z
    .object({
      stripeKey: z
        .string()
        .regex(live ? /^sk_live_[A-Za-z0-9]+$/ : /^sk_test_[A-Za-z0-9]+$/),
      webhookSecret: z.string().startsWith("whsec_").min(20),
      supabaseUrl: z.url(),
      supabaseSecret: z.string().min(30),
      rateSecret: z.string().min(32),
      origin: z.url(),
    })
    .safeParse({
      stripeKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseSecret: process.env.SUPABASE_SECRET_KEY,
      rateSecret: process.env.COMMERCE_RATE_LIMIT_SECRET,
      origin: process.env.NEXT_PUBLIC_SITE_URL,
    });
  if (!parsed.success || process.env.BACKEND_ENABLED !== "true") return null;
  const c = parsed.data;
  const origin = new URL(c.origin);
  if (
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password
  )
    return null;
  if (
    origin.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(origin.hostname)
  )
    return null;
  const sb = new URL(c.supabaseUrl);
  if (
    sb.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(sb.hostname)
  )
    return null;
  let privileged = c.supabaseSecret.startsWith("sb_secret_");
  if (!privileged) {
    try {
      privileged =
        JSON.parse(
          Buffer.from(c.supabaseSecret.split(".")[1], "base64url").toString(),
        ).role === "service_role";
    } catch {}
  }
  if (!privileged) return null;
  // Live activation is deliberately separate from test configuration.
  if (
    live &&
    (process.env.LIVE_PAYMENTS_ENABLED !== "true" ||
      process.env.PURCHASE_TERMS_APPROVED !== "true" ||
      process.env.STRIPE_AUTOMATIC_TAX_ENABLED !== "true" ||
      !process.env.STRIPE_EBOOK_TAX_CODE ||
      process.env.TRANSACTIONAL_EMAIL_ENABLED !== "true" ||
      !process.env.BREVO_API_KEY ||
      !process.env.EMAIL_FROM_ADDRESS ||
      !process.env.CRON_SECRET)
  )
    return null;
  return {
    ...c,
    origin: origin.origin,
    live,
    automaticTax: process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true",
    taxCode: process.env.STRIPE_EBOOK_TAX_CODE || undefined,
  };
}
export type CommerceConfig = NonNullable<ReturnType<typeof commerceConfig>>;
