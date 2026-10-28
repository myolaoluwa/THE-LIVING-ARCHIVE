import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { uuid } from "@/lib/admin/validation";
import { checkedRows, field, dateLabel } from "@/lib/admin/data";
export default async function OrderDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { client } = await requireAdmin("manage");
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const order = await client
    .from("orders")
    .select(
      "id,public_reference,customer_email,customer_name,currency,subtotal_minor,tax_minor,total_minor,payment_status,fulfillment_status,stripe_livemode,created_at",
    )
    .eq("id", id.data)
    .maybeSingle();
  if (order.error) throw new Error("The order could not be loaded.");
  if (!order.data) notFound();
  const row = order.data;
  const items = checkedRows(
    await client
      .from("order_items")
      .select(
        "id,book_title_snapshot,edition_format_snapshot,unit_price_minor,quantity,currency",
      )
      .eq("order_id", id.data),
  );
  const money = (amount: unknown) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: row.currency,
    }).format(Number(amount) / 100);
  return (
    <main id="main" className="admin-main">
      <Link href="/admin/orders" className="text-link">
        ← Recorded orders
      </Link>
      <div className="admin-page-heading">
        <h1>Order {row.public_reference}</h1>
      </div>
      <section className="admin-panel">
        <dl className="admin-facts">
          <div>
            <dt>Customer</dt>
            <dd>
              {row.customer_name || "—"} · {row.customer_email}
            </dd>
          </div>
          <div>
            <dt>Mode</dt><dd>{row.stripe_livemode ? "Live payment" : "Stripe test order — no real payment"}</dd>
          </div><div>
            <dt>Payment</dt>
            <dd>{row.payment_status}</dd>
          </div>
          <div>
            <dt>Fulfillment</dt>
            <dd>{row.fulfillment_status}</dd>
          </div>
          <div>
            <dt>Order date</dt>
            <dd>{dateLabel(row.created_at)}</dd>
          </div>
          <div>
            <dt>Subtotal</dt>
            <dd>{money(row.subtotal_minor)}</dd>
          </div>
          <div>
            <dt>Tax</dt>
            <dd>{money(row.tax_minor)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{money(row.total_minor)}</dd>
          </div>
        </dl>
      </section>
      <section className="admin-panel">
        <h2>Purchased edition snapshots</h2>
        {items.map((item) => (
          <article key={field(item, "id")}>
            <h3>{field(item, "book_title_snapshot")}</h3>
            <p>
              {field(item, "edition_format_snapshot")} ·{" "}
              {money(item.unit_price_minor)} · quantity{" "}
              {field(item, "quantity")}
            </p>
          </article>
        ))}
      </section>
      <p className="admin-notice">
        Stripe webhooks verify payments and reconcile refunds. Initiate refunds in Stripe. Buyers can request fresh download access on the purchase recovery page once Brevo is configured. No manual “mark paid” action is available.
      </p>
    </main>
  );
}
