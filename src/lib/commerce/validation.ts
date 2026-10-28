import { z } from "zod";
import type Stripe from "stripe";

export const cartSchema = z
  .array(
    z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .max(120),
  )
  .min(1)
  .max(4)
  .refine(
    (items) => new Set(items).size === items.length,
    "An ebook can only appear once.",
  );
export const checkoutSchema = z
  .object({
    attemptId: z.uuid(),
    accessToken: z.string().regex(/^[a-f0-9]{64}$/),
    slugs: cartSchema,
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    termsAccepted: z.literal(true),
  })
  .strict();
export const saleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  price_minor: z.number().int().positive(),
  currency: z.enum(["USD", "EUR", "GBP", "ZAR"]),
});
export type SaleBook = z.infer<typeof saleSchema>;
export const quoteSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  email: z.email(),
  currency: z.enum(["USD", "EUR", "GBP", "ZAR"]),
  subtotal_minor: z.number().int().positive(),
  expires_at: z.number().int(),
  session_id: z.string().nullable(),
  session_url: z.string().nullable(),
  items: z
    .array(
      z.object({
        edition_id: z.uuid(),
        title: z.string(),
        price_minor: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(4),
});
export function checkoutDestination(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "checkout.stripe.com" ||
    url.username ||
    url.password
  )
    throw new Error("Unexpected payment destination");
  return url.href;
}
export function normalizePayment(
  session: Stripe.Checkout.Session,
  eventType: string,
) {
  if (
    session.mode !== "payment" ||
    !session.client_reference_id ||
    !session.metadata?.archive_order_id ||
    session.client_reference_id !== session.metadata.archive_order_id
  )
    throw new Error("Checkout identity mismatch");
  const orderId = z.uuid().parse(session.client_reference_id);
  const subtotal = session.amount_subtotal,
    total = session.amount_total;
  const tax = session.total_details?.amount_tax ?? 0;
  if (
    !Number.isSafeInteger(subtotal) ||
    !Number.isSafeInteger(total) ||
    !Number.isSafeInteger(tax) ||
    subtotal! <= 0 ||
    tax < 0 ||
    total !== subtotal! + tax ||
    (session.total_details?.amount_discount ?? 0) !== 0 ||
    (session.total_details?.amount_shipping ?? 0) !== 0 ||
    !session.currency
  )
    throw new Error("Checkout total mismatch");
  const pi =
    typeof session.payment_intent === "object" ? session.payment_intent : null;
  const intent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (pi?.id ?? null);
  const charge =
    pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  let state:
    | "paid"
    | "processing"
    | "failed"
    | "expired"
    | "refunded"
    | "partially_refunded"
    | "disputed" = "processing";
  if (charge?.disputed || eventType === "charge.dispute.created")
    state = "disputed";
  else if (charge && charge.amount_refunded > 0)
    state = charge.refunded ? "refunded" : "partially_refunded";
  else if (session.payment_status === "paid" && session.status === "complete")
    state = "paid";
  else if (eventType === "checkout.session.async_payment_failed")
    state = "failed";
  else if (session.status === "expired") state = "expired";
  if (state === "paid" && !intent) throw new Error("Missing payment intent");
  const email = session.customer_details?.email || session.customer_email || "";
  if (state === "paid" && !z.email().safeParse(email).success)
    throw new Error("Missing purchase email");
  return {
    orderId,
    email: email.toLowerCase(),
    state,
    subtotal: subtotal!,
    total: total!,
    tax,
    currency: session.currency,
    intent,
  };
}
