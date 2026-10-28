import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import {
  checkoutSchema,
  checkoutDestination,
  normalizePayment,
} from "../src/lib/commerce/validation";
import { purchaseEmail } from "../src/lib/commerce/email";
const order = "cccccccc-0000-4000-8000-000000000001";
const input = {
  attemptId: order,
  accessToken: "a".repeat(64),
  slugs: ["4daniel-book-one"],
  email: "Buyer@example.test",
  termsAccepted: true,
};
function session(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_fixture",
    customer_email: "buyer@example.test",
    mode: "payment",
    client_reference_id: order,
    metadata: { archive_order_id: order },
    amount_subtotal: 777,
    amount_total: 777,
    currency: "usd",
    total_details: { amount_tax: 0, amount_shipping: 0, amount_discount: 0 },
    payment_status: "paid",
    status: "complete",
    payment_intent: "pi_fixture",
    ...overrides,
  } as Stripe.Checkout.Session;
}
test("checkout accepts ebook slugs only and rejects client prices, duplicates and missing acknowledgement", () => {
  assert.equal(checkoutSchema.parse(input).email, "buyer@example.test");
  for (const value of [
    { ...input, price: 1 },
    { ...input, slugs: ["4daniel-book-one", "4daniel-book-one"] },
    { ...input, termsAccepted: false },
    { ...input, accessToken: "guess" },
    { ...input, slugs: [] },
    { ...input, slugs: ["../../etc/passwd"] },
  ])
    assert.equal(checkoutSchema.safeParse(value).success, false);
});
test("payment redirects stay on Stripe Checkout", () => {
  assert.equal(
    checkoutDestination("https://checkout.stripe.com/c/pay/cs_test_fixture"),
    "https://checkout.stripe.com/c/pay/cs_test_fixture",
  );
  for (const url of [
    "https://checkout.stripe.com.evil.test/",
    "https://evil.test/",
    "javascript:alert(1)",
    "http://checkout.stripe.com/",
    "https://user:password@checkout.stripe.com/",
  ])
    assert.throws(() => checkoutDestination(url));
});
test("payment normalization rejects altered totals and never treats an unpaid redirect as payment", () => {
  assert.equal(
    normalizePayment(session(), "checkout.session.completed").state,
    "paid",
  );
  assert.equal(
    normalizePayment(
      session({ payment_status: "unpaid", status: "open" }),
      "checkout.session.completed",
    ).state,
    "processing",
  );
  for (const changed of [
    { amount_total: 1 },
    { currency: null },
    { client_reference_id: "other" },
    { mode: "subscription" },
    { payment_intent: null },
    {
      total_details: { amount_tax: 0, amount_shipping: 0, amount_discount: 10 },
    },
  ] as Partial<Stripe.Checkout.Session>[])
    assert.throws(() =>
      normalizePayment(session(changed), "checkout.session.completed"),
    );
});
test("current refund and dispute state override a stale successful event", () => {
  const pi = {
    id: "pi_fixture",
    latest_charge: {
      id: "ch_fixture",
      amount_refunded: 100,
      refunded: false,
      disputed: false,
    },
  } as Stripe.PaymentIntent;
  assert.equal(
    normalizePayment(
      session({ payment_intent: pi }),
      "checkout.session.completed",
    ).state,
    "partially_refunded",
  );
  assert.equal(
    normalizePayment(session(), "charge.dispute.created").state,
    "disputed",
  );
});
test("Stripe SDK verifies raw signatures and rejects tampering and expired signatures", () => {
  const stripe = new Stripe("sk_test_fixture");
  const secret = "whsec_test_fixture";
  const payload = JSON.stringify({
    id: "evt_fixture",
    object: "event",
    type: "checkout.session.completed",
    data: { object: session() },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(
    stripe.webhooks.constructEvent(payload, header, secret).id,
    "evt_fixture",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload, header, "whsec_wrong"),
  );
  const old = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp: 1,
  });
  assert.throws(() => stripe.webhooks.constructEvent(payload, old, secret));
});
test("receipt HTML escapes titles and uses a private single-use recovery link", () => {
  const email = purchaseEmail({
    reference: "LA-test",
    titles: ['<script>alert("x")</script>'],
    amount: "$7.77 USD",
    accessUrl: "https://example.test/order/recover#token=secret",
    support: "support@example.test",
    receipt: true,
    testMode: true,
  });
  assert.ok(!email.html.includes("<script>"));
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.ok(email.subject.startsWith("[TEST]"));
  assert.ok(email.text.includes("expires in 30 minutes"));
  assert.ok(!email.html.includes("/storage/v1/object/public/"));
});
