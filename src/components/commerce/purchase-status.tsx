"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice, readCart, saveCart } from "./cart";
import { PurchaseSteps } from "./purchase-steps";
type Status = {
  id: string;
  reference: string;
  payment_status: string;
  access_revoked: boolean;
  purchased_slugs: string[];
  currency: string;
  total_minor: number;
  downloads: { id: string; title: string }[];
};
export function PurchaseStatus() {
  const params = useSearchParams();
  const session = params.get("session_id");
  const [order, setOrder] = useState<Status | null>(null);
  const [message, setMessage] = useState("Checking your payment confirmation…");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let checks = 0;
    async function check() {
      if (!session) {
        setMessage(
          "No purchase session was supplied. Please return to the books or contact the author.",
        );
        return;
      }
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(session)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            "This order could not be accessed in this browser. Use the purchase email recovery link or contact the author.",
          );
        const data: Status = await response.json();
        setOrder(data);
        if (data.access_revoked) {
          setMessage(
            "Download access is on hold for this order. Please contact the author for help.",
          );
          return;
        }
        if (data.payment_status === "paid") {
          setMessage("Payment confirmed. Your ebooks are ready.");
          saveCart(
            readCart().filter((slug) => !data.purchased_slugs?.includes(slug)),
          );
          return;
        }
        if (
          [
            "refunded",
            "partially_refunded",
            "canceled",
            "payment_failed",
          ].includes(data.payment_status)
        ) {
          setMessage(
            "This order has no active download access. Contact the author if you need help.",
          );
          return;
        }
        setMessage(
          "Your payment confirmation is still being processed. Downloads will appear after it has been verified.",
        );
        if (++checks < 10) timer = setTimeout(check, 3000);
      } catch (error) {
        if (!controller.signal.aborted)
          setMessage(
            error instanceof Error
              ? error.message
              : "Confirmation is temporarily unavailable.",
          );
      }
    }
    check();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [session, retry]);
  const confirmed = order?.payment_status === "paid" && !order.access_revoked;
  return (
    <>
    <PurchaseSteps current={3} />
    <section className="commerce-panel commerce-status-panel">
      <span className="commerce-kicker">{confirmed ? "Welcome to your reading shelf" : "Your purchase status"}</span>
      <h2>
        {order?.payment_status === "paid" && !order.access_revoked
          ? "Your books are ready."
          : "Purchase confirmation"}
      </h2>
      <p role="status" className={`commerce-message ${confirmed ? "commerce-success" : "commerce-warning"}`}><span aria-hidden="true">{confirmed ? "✓ " : "! "}</span>{message}</p>
      {order && (
        <>
          <dl className="commerce-order-details">
            <div><dt>Order reference</dt><dd>{order.reference}</dd></div>
            <div><dt>Order total</dt><dd>{formatPrice(order.total_minor, order.currency)} {order.currency}</dd></div>
          </dl>
        </>
      )}
      {order && order.downloads.length > 0 && (
        <ul className="commerce-downloads">
          {order.downloads.map((item) => (
            <li key={item.id}>
              <h3>{item.title}</h3>
              <form action="/api/download" method="post">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="entitlementId" value={item.id} />
                <button className="button" type="submit">
                  Download ebook ↓
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <div className="commerce-actions">
        <button
          className="text-link"
          type="button"
          onClick={() => setRetry((n) => n + 1)}
        >
          Check confirmation again
        </button>
        <Link className="text-link" href="/order/recover">
          Recover purchase access
        </Link>
        <Link className="text-link" href="/contact">
          Contact the author
        </Link>
      </div>
    </section>
    </>
  );
}
