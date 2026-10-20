import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { client, profile } = await requireAdmin();
  const books = await client.from("books").select("id,status");
  if (books.error) throw new Error("Catalog totals could not be loaded.");
  const bookRows = z
    .array(z.object({ id: z.uuid(), status: z.string() }))
    .parse(books.data);
  let metrics: null | {
    orders: number;
    paid_orders: number;
    enquiries: number;
    subscribers: number;
    paid_totals: {
      currency: string;
      amount_minor: number;
      order_count: number;
    }[];
  } = null;
  if (profile.role !== "editor") {
    const { data, error } = await client.rpc("admin_metrics");
    if (error) throw new Error("Administrative totals could not be loaded.");
    metrics = z
      .object({
        orders: z.number(),
        paid_orders: z.number(),
        enquiries: z.number(),
        subscribers: z.number(),
        paid_totals: z.array(
          z.object({
            currency: z.string(),
            amount_minor: z.number(),
            order_count: z.number(),
          }),
        ),
      })
      .parse(data);
  }
  return (
    <main id="main" className="admin-main">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">The Living Archive / Overview</p>
          <h1>Your work, in view.</h1>
          <p>
            Welcome, {profile.display_name}. A clear place to care for your
            books and stories.
          </p>
        </div>
        <Link className="button" href="/admin/books/new">
          Add a book
        </Link>
      </div>
      {(await searchParams).notice === "forbidden" && (
        <p role="alert" className="admin-notice">
          Your role does not permit that operation. Your current access remains
          unchanged.
        </p>
      )}
      <div className="admin-metrics">
        <article>
          <span>Published books</span>
          <strong>
            {bookRows.filter((b) => b.status === "published").length}
          </strong>
          <Link href="/admin/books">Manage the collection →</Link>
        </article>
        <article>
          <span>Book drafts</span>
          <strong>{bookRows.filter((b) => b.status === "draft").length}</strong>
          <Link href="/admin/books">Continue editing →</Link>
        </article>
        {metrics && (
          <>
            <article>
              <span>Recorded orders</span>
              <strong>{metrics.orders}</strong>
              <Link href="/admin/orders">View order records →</Link>
            </article>
            <article>
              <span>New enquiries</span>
              <strong>{metrics.enquiries}</strong>
              <Link href="/admin/enquiries">Open correspondence →</Link>
            </article>
          </>
        )}
      </div>
      <div className="admin-two-columns">
        <section className="admin-panel">
          <p className="eyebrow">Keep the archive current</p>
          <h2>A considered publishing flow.</h2>
          <ol className="admin-workflow">
            <li>
              <strong>Prepare a draft</strong>
              <span>Edit the words, cover and collection order.</span>
            </li>
            <li>
              <strong>Preview your changes</strong>
              <span>Review the saved version in a private workspace.</span>
            </li>
            <li>
              <strong>Publish deliberately</strong>
              <span>An owner or administrator releases the new version.</span>
            </li>
          </ol>
          <Link href="/admin/content" className="text-link">
            Edit website content →
          </Link>
        </section>
        <section className="admin-panel">
          <p className="eyebrow">Integration status</p>
          <h2>Commerce comes next.</h2>
          <p>
            Live payments, customer download delivery and receipt emails are not
            enabled in Phase 3. No order or revenue figures are simulated.
          </p>
          {metrics?.paid_totals.length ? (
            <ul>
              {metrics.paid_totals.map((total) => (
                <li key={total.currency}>
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: total.currency,
                  }).format(total.amount_minor / 100)}{" "}
                  · {total.order_count} paid orders
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-help">No paid order totals are recorded.</p>
          )}
          <p className="admin-help">
            Newsletter acquisition, public enquiry delivery and traffic
            analytics require later-phase integrations.
          </p>
        </section>
      </div>
    </main>
  );
}
