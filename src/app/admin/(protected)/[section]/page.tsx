import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { checkedRows, field, dateLabel, type DbRow } from "@/lib/admin/data";
import { ActionForm } from "@/components/admin/action-form";
import { markEnquiry, saveSettings, saveProfile } from "@/app/admin/actions";
const allowed = z.enum([
  "orders",
  "customers",
  "enquiries",
  "subscribers",
  "analytics",
  "settings",
  "team",
  "audit",
  "content",
]);
const statusOptions = [
  "pending",
  "payment_processing",
  "paid",
  "payment_failed",
  "canceled",
  "partially_refunded",
  "refunded",
];
const labels: Record<string, string> = {
  orders: "Orders",
  customers: "Customers",
  enquiries: "Enquiries",
  subscribers: "Subscribers",
  analytics: "Analytics",
  settings: "Site settings",
  team: "Team & access",
  audit: "Activity log",
  content: "Website content",
};
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="admin-empty">{children}</p>;
}
function ProfileForm({ row }: { row?: DbRow }) {
  const value = (k: string) => (row ? field(row, k) : "");
  return (
    <ActionForm action={saveProfile} label="Save access profile">
      <label>
        Existing Supabase Auth user ID
        <input
          name="auth_user_id"
          defaultValue={value("auth_user_id")}
          readOnly={!!row}
          required
        />
        <small>
          Create or invite the user securely in Supabase Auth first. No account
          is created by this form.
        </small>
      </label>
      <label>
        Display name
        <input
          name="display_name"
          defaultValue={value("display_name")}
          maxLength={120}
          required
        />
      </label>
      <label>
        Role
        <select name="role" defaultValue={value("role") || "editor"}>
          <option value="editor">Editor — drafts and covers</option>
          <option value="administrator">
            Administrator — publishing, files and operations
          </option>
          <option value="owner">
            Owner — full administration and access settings
          </option>
        </select>
      </label>
      <label className="admin-checkbox">
        <input
          type="checkbox"
          name="active"
          defaultChecked={row ? row.active === true : true}
        />
        Active staff access
      </label>
    </ActionForm>
  );
}
export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const parsed = allowed.safeParse((await params).section);
  if (!parsed.success) notFound();
  const section = parsed.data;
  const { client } = await requireAdmin(
    ["settings", "team", "audit"].includes(section)
      ? "owner"
      : section === "content"
        ? "edit"
        : "manage",
  );
  const query = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(query.page || "1", 10) || 1),
  );
  let body: React.ReactNode;
  if (section === "content") {
    const drafts = checkedRows(
      await client
        .from("content_drafts")
        .select("page_slug,title,version,updated_at")
        .order("page_slug"),
    );
    body = (
      <div className="admin-content-grid">
        {drafts.map((row) => (
          <article className="admin-panel" key={field(row, "page_slug")}>
            <p className="eyebrow">{field(row, "page_slug")}</p>
            <h2>{field(row, "title")}</h2>
            <p>
              Saved draft version {field(row, "version")} ·{" "}
              {dateLabel(row.updated_at)}
            </p>
            <Link
              className="text-link"
              href={`/admin/content/${field(row, "page_slug")}`}
            >
              Edit content →
            </Link>
          </article>
        ))}
      </div>
    );
  } else if (section === "settings") {
    const settings = Object.fromEntries(
      checkedRows(await client.from("site_settings").select("key,value")).map(
        (row) => [field(row, "key"), field(row, "value")],
      ),
    );
    body = (
      <section className="admin-panel">
        <h2>Public website settings</h2>
        <p className="admin-help">
          These values can appear on the public website. Passwords, secret keys
          and payment credentials do not belong here.
        </p>
        <ActionForm action={saveSettings}>
          <label>
            Site name
            <input
              name="site_name"
              defaultValue={settings.site_name || "The Living Archive"}
              required
              maxLength={120}
            />
          </label>
          <label>
            Approved public contact email
            <input
              name="contact_email"
              type="email"
              defaultValue={settings.contact_email || ""}
            />
            <small>
              The contact page prepares a reader’s email draft. Server-side
              message delivery belongs to a later integration.
            </small>
          </label>
          <label>
            Newsletter invitation
            <textarea
              name="newsletter_intro"
              rows={4}
              defaultValue={settings.newsletter_intro || ""}
            />
            <small>
              Stored for the later newsletter integration. No subscriptions are
              collected yet.
            </small>
          </label>
        </ActionForm>
      </section>
    );
  } else if (section === "team") {
    const profiles = checkedRows(
      await client
        .from("admin_profiles")
        .select("auth_user_id,display_name,role,active")
        .order("created_at"),
    );
    body = (
      <section className="admin-panel">
        <h2>People who can manage the archive</h2>
        <p className="admin-help">
          Staff sign in with email and password. Only owners manage roles. The
          database prevents removal of the last active owner.
        </p>
        {profiles.map((row) => (
          <details
            className="admin-disclosure"
            key={field(row, "auth_user_id")}
          >
            <summary>
              {field(row, "display_name")} · {field(row, "role")} ·{" "}
              {row.active ? "active" : "inactive"}
            </summary>
            <ProfileForm row={row} />
          </details>
        ))}
        <details className="admin-disclosure">
          <summary>Authorize an existing account</summary>
          <ProfileForm />
        </details>
      </section>
    );
  } else if (section === "analytics") {
    const { data, error } = await client.rpc("admin_metrics");
    if (error) throw new Error("Recorded totals could not be loaded.");
    const metrics = z
      .object({
        orders: z.number(),
        paid_orders: z.number(),
        enquiries: z.number(),
        subscribers: z.number(),
      })
      .parse(data);
    body = (
      <>
        <section className="admin-panel">
          <h2>Recorded activity</h2>
          <dl className="admin-facts">
            <div>
              <dt>Orders in the database</dt>
              <dd>{metrics.orders}</dd>
            </div>
            <div>
              <dt>Verified paid orders</dt>
              <dd>{metrics.paid_orders}</dd>
            </div>
            <div>
              <dt>New enquiries</dt>
              <dd>{metrics.enquiries}</dd>
            </div>
            <div>
              <dt>Confirmed subscribers</dt>
              <dd>{metrics.subscribers}</dd>
            </div>
          </dl>
        </section>
        <section className="admin-panel">
          <h2>Traffic analytics is not connected</h2>
          <p>
            Visitor counts, sales trends and conversion charts require
            later-phase integrations. No example charts, traffic or revenue have
            been generated.
          </p>
        </section>
      </>
    );
  } else {
    const config = {
      orders: {
        table: "orders",
        columns:
          "id,public_reference,customer_email,currency,total_minor,payment_status,fulfillment_status,created_at",
        order: "created_at",
      },
      customers: {
        table: "customers",
        columns: "id,email,name,created_at",
        order: "created_at",
      },
      enquiries: {
        table: "contact_messages",
        columns: "id,name,email,category,subject,message,status,created_at",
        order: "created_at",
      },
      subscribers: {
        table: "subscribers",
        columns:
          "id,email,consent_status,consent_timestamp,unsubscribe_timestamp,created_at",
        order: "created_at",
      },
      audit: {
        table: "audit_logs",
        columns:
          "id,actor_id,actor_role,action,table_name,record_id,changed_fields,occurred_at",
        order: "occurred_at",
      },
    }[section];
    let request = client
      .from(config.table)
      .select(config.columns, { count: "exact" })
      .order(config.order, { ascending: false })
      .range((page - 1) * 50, page * 50 - 1);
    if (
      section === "orders" &&
      query.status &&
      statusOptions.includes(query.status)
    )
      request = request.eq("payment_status", query.status);
    const result = await request;
    const rows = checkedRows(result);
    const count = result.count || 0;
    const notice =
      section === "orders"
        ? "Payments, refunds, reconciliation and access-email delivery are Phase 4 features. Order records here are read-only."
        : section === "enquiries"
          ? "The public contact form does not submit messages to this database yet. Notification delivery is a later integration."
          : section === "subscribers"
            ? "Newsletter sign-up and double-opt-in delivery are later-phase features. Consent records cannot be fabricated here."
            : section === "customers"
              ? "Customer records are created by later commerce workflows. No customer accounts or sample buyers are generated."
              : "This append-only log records actor, operation and changed field names. It does not copy customer messages, secret keys or signed file URLs.";
    body = (
      <>
        <p className="admin-notice">{notice}</p>
        {section === "orders" && (
          <form method="get" className="admin-filter">
            <label htmlFor="payment-status">Payment status</label>
            <select
              id="payment-status"
              name="status"
              defaultValue={query.status || ""}
            >
              <option value="">All recorded orders</option>
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <button className="button" type="submit">
              Apply filter
            </button>
          </form>
        )}
        <section className="admin-panel admin-table-wrap">
          {!rows.length ? (
            <Empty>
              No {section === "audit" ? "activity entries" : section} are
              recorded for this view.
            </Empty>
          ) : section === "enquiries" ? (
            rows.map((row) => (
              <details className="admin-disclosure" key={field(row, "id")}>
                <summary>
                  {field(row, "subject")} · {field(row, "status")}
                </summary>
                <p>
                  {field(row, "name")} · {field(row, "email")} ·{" "}
                  {field(row, "category")}
                </p>
                <p className="admin-message">{field(row, "message")}</p>
                <ActionForm action={markEnquiry} label="Update enquiry">
                  <input name="id" type="hidden" value={field(row, "id")} />
                  <label>
                    Status
                    <select name="status" defaultValue={field(row, "status")}>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                </ActionForm>
              </details>
            ))
          ) : (
            <table>
              <caption className="sr-only">{labels[section]} records</caption>
              <thead>
                <tr>
                  {(section === "orders"
                    ? [
                        "Reference",
                        "Customer",
                        "Total",
                        "Payment",
                        "Delivery",
                        "Date",
                      ]
                    : section === "customers"
                      ? ["Name", "Email", "Created"]
                      : section === "subscribers"
                        ? ["Email", "Consent", "Confirmed", "Unsubscribed"]
                        : [
                            "Operation",
                            "Table",
                            "Record",
                            "Actor role",
                            "Changed fields",
                            "Time",
                          ]
                  ).map((title) => (
                    <th key={title}>{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={field(row, "id")}>
                    {section === "orders" ? (
                      <>
                        <td>
                          <Link
                            className="text-link"
                            href={`/admin/orders/${field(row, "id")}`}
                          >
                            {field(row, "public_reference")}
                          </Link>
                        </td>
                        <td>{field(row, "customer_email")}</td>
                        <td>
                          {new Intl.NumberFormat("en-GB", {
                            style: "currency",
                            currency: field(row, "currency"),
                          }).format(Number(row.total_minor) / 100)}
                        </td>
                        <td>{field(row, "payment_status")}</td>
                        <td>{field(row, "fulfillment_status")}</td>
                        <td>{dateLabel(row.created_at)}</td>
                      </>
                    ) : section === "customers" ? (
                      <>
                        <td>{field(row, "name") || "—"}</td>
                        <td>{field(row, "email")}</td>
                        <td>{dateLabel(row.created_at)}</td>
                      </>
                    ) : section === "subscribers" ? (
                      <>
                        <td>{field(row, "email")}</td>
                        <td>{field(row, "consent_status")}</td>
                        <td>{dateLabel(row.consent_timestamp)}</td>
                        <td>{dateLabel(row.unsubscribe_timestamp)}</td>
                      </>
                    ) : (
                      <>
                        <td>{field(row, "action")}</td>
                        <td>{field(row, "table_name")}</td>
                        <td className="admin-record-id">
                          {field(row, "record_id")}
                        </td>
                        <td>
                          {field(row, "actor_role") || "migration / system"}
                        </td>
                        <td>
                          {Array.isArray(row.changed_fields)
                            ? row.changed_fields.join(", ")
                            : "—"}
                        </td>
                        <td>{dateLabel(row.occurred_at)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <nav className="admin-pagination" aria-label="Record pages">
          <span>
            {count} matching records · page {page}
          </span>
          {page > 1 && (
            <Link
              className="text-link"
              href={`?page=${page - 1}${query.status ? `&status=${encodeURIComponent(query.status)}` : ""}`}
            >
              Previous
            </Link>
          )}
          {page * 50 < count && (
            <Link
              className="text-link"
              href={`?page=${page + 1}${query.status ? `&status=${encodeURIComponent(query.status)}` : ""}`}
            >
              Next
            </Link>
          )}
        </nav>
      </>
    );
  }
  return (
    <main id="main" className="admin-main">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Archive administration</p>
          <h1>{labels[section]}</h1>
        </div>
      </div>
      {body}
    </main>
  );
}
