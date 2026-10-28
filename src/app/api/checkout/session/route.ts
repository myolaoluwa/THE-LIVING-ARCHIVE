import {
  checkoutSchema,
  quoteSchema,
  checkoutDestination,
} from "@/lib/commerce/validation";
import {
  commerceServices,
  privateHeaders,
  rateLimit,
  rememberOrder,
  reply,
  sameOrigin,
  tokenHash,
} from "@/lib/commerce/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const services = commerceServices();
  if (!services) return reply("Direct checkout is not available yet.", 503);
  if (!sameOrigin(request, services.config))
    return reply("Request not allowed.", 403);
  if (!(await rateLimit(request, "checkout", services)))
    return reply("Please wait before trying again.", 429);
  if (Number(request.headers.get("content-length") || 0) > 4096)
    return reply("Invalid checkout.", 400);
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096) return reply("Invalid checkout.", 400);
    body = JSON.parse(text);
  } catch {
    return reply("Invalid checkout.", 400);
  }
  const input = checkoutSchema.safeParse(body);
  if (!input.success)
    return reply(
      "Check your email, selected ebooks and purchase acknowledgement.",
      400,
    );
  const { attemptId, accessToken, slugs, email } = input.data;
  if (
    !services.config.live &&
    email !== process.env.STRIPE_TEST_BUYER_EMAIL?.trim().toLowerCase()
  )
    return reply("Use the configured test buyer email for test checkout.", 400);
  const hash = tokenHash(accessToken);
  const quoteResult = await services.db.rpc("commerce_begin_checkout", {
    p_id: attemptId,
    p_hash: hash,
    p_slugs: [...slugs].sort(),
    p_email: email,
    p_live: services.config.live,
  });
  const parsed = quoteSchema.safeParse(quoteResult.data);
  if (quoteResult.error || !parsed.success)
    return reply(
      "One or more ebooks are unavailable. Refresh your cart before trying again.",
      409,
    );
  const quote = parsed.data;
  try {
    let url: string;
    if (quote.session_id && quote.session_url) {
      const existing = await services.stripe.checkout.sessions.retrieve(
        quote.session_id,
      );
      if (
        existing.status !== "open" ||
        existing.livemode !== services.config.live
      )
        return reply("This checkout has ended. Start a new checkout.", 409);
      url = checkoutDestination(quote.session_url);
    } else {
      const session = await services.stripe.checkout.sessions.create(
        {
          mode: "payment",
          allowed_payment_method_types: ["card"],
          adaptive_pricing: { enabled: false },
          customer_email: quote.email,
          client_reference_id: quote.id,
          metadata: { archive_order_id: quote.id },
          payment_intent_data: { metadata: { archive_order_id: quote.id } },
          line_items: quote.items.map((item) => ({
            quantity: 1,
            price_data: {
              currency: quote.currency.toLowerCase(),
              unit_amount: item.price_minor,
              tax_behavior: "exclusive",
              product_data: {
                name: item.title,
                description: "Digital ebook — private download",
                metadata: { edition_id: item.edition_id },
                ...(services.config.taxCode
                  ? { tax_code: services.config.taxCode }
                  : {}),
              },
            },
          })),
          automatic_tax: { enabled: services.config.automaticTax },
          success_url: `${services.config.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${services.config.origin}/checkout/cancel`,
          expires_at: quote.expires_at,
        },
        { idempotencyKey: `archive-checkout-${quote.id}` },
      );
      if (!session.url || session.livemode !== services.config.live)
        throw new Error("Unexpected checkout session");
      url = checkoutDestination(session.url);
      const bound = await services.db.rpc("commerce_bind_session", {
        p_id: quote.id,
        p_hash: hash,
        p_session: session.id,
        p_url: url,
      });
      if (bound.error) throw new Error("Session persistence failed");
    }
    await rememberOrder(quote.id, accessToken);
    return Response.json({ url }, { headers: privateHeaders });
  } catch {
    // Keep the same attempt/idempotency key on retries; never return provider secrets.
    return reply(
      "Checkout could not be opened. Retry once, or contact the author if this continues.",
      502,
    );
  }
}
