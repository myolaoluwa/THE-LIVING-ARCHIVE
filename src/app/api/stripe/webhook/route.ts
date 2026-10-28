import { after } from "next/server";
import { deliverEmailBatch } from "@/lib/commerce/deliver-email";
import type Stripe from "stripe";
import { z } from "zod";
import { commerceServices, reply } from "@/lib/commerce/server";
import { normalizePayment } from "@/lib/commerce/validation";
export const runtime = "nodejs";
export const maxDuration = 60;
const sessionEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);
const chargeEvents = new Set(["charge.refunded", "charge.dispute.created"]);
export async function POST(request: Request) {
  const services = commerceServices();
  if (!services) return reply("Payment processing is not configured.", 503);
  const signature = request.headers.get("stripe-signature");
  if (
    !signature ||
    Number(request.headers.get("content-length") || 0) > 1048576
  )
    return reply("Invalid event.", 400);
  let event: Stripe.Event;
  try {
    const raw = await request.text();
    if (raw.length > 1048576) return reply("Invalid event.", 400);
    event = services.stripe.webhooks.constructEvent(
      raw,
      signature,
      services.config.webhookSecret,
    );
  } catch {
    return reply("Invalid event signature.", 400);
  }
  if (event.livemode !== services.config.live || event.account)
    return reply("Event account or mode mismatch.", 400);
  if (!sessionEvents.has(event.type) && !chargeEvents.has(event.type))
    return Response.json({ received: true });
  try {
    let sessionId: string;
    if (sessionEvents.has(event.type)) {
      const source = event.data.object as Stripe.Checkout.Session;
      if (!source.metadata?.archive_order_id)
        return Response.json({ received: true });
      sessionId = source.id;
    } else {
      const source = event.data.object as Stripe.Charge | Stripe.Dispute;
      const piId =
        typeof source.payment_intent === "string"
          ? source.payment_intent
          : source.payment_intent?.id;
      if (!piId) return Response.json({ received: true });
      const pi = await services.stripe.paymentIntents.retrieve(piId);
      const orderId = z.uuid().safeParse(pi.metadata.archive_order_id);
      if (!orderId.success) return Response.json({ received: true });
      const order = await services.db
        .from("orders")
        .select("stripe_checkout_session_id")
        .eq("id", orderId.data)
        .maybeSingle();
      if (order.error || !order.data?.stripe_checkout_session_id)
        throw new Error("Order is not bound yet");
      sessionId = order.data.stripe_checkout_session_id;
    }
    // Retrieve current account-owned state: delayed/out-of-order event payloads
    // cannot turn refunded or disputed purchases back into active downloads.
    const session = await services.stripe.checkout.sessions.retrieve(
      sessionId,
      { expand: ["payment_intent.latest_charge"] },
    );
    if (session.livemode !== services.config.live)
      throw new Error("Session mode mismatch");
    const p = normalizePayment(session, event.type);
    const result = await services.db.rpc("commerce_apply_payment", {
      p_order: p.orderId,
      p_email: p.email,
      p_event: event.id,
      p_type: event.type,
      p_session: session.id,
      p_intent: p.intent,
      p_live: session.livemode,
      p_state: p.state,
      p_subtotal: p.subtotal,
      p_tax: p.tax,
      p_total: p.total,
      p_currency: p.currency,
    });
    if (result.error) throw new Error("Payment persistence failed");
    after(async () => {
      try {
        await deliverEmailBatch();
      } catch {
        /* Durable queue is retried by the worker. */
      }
    });
    return Response.json({ received: true });
  } catch {
    // Non-2xx asks Stripe to retry. No entitlement is granted on a failed transaction.
    return reply("Event could not be processed. Please retry.", 503);
  }
}
