"use client";
import { useEffect, useState, useRef } from "react";
export function RecoverPurchase() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const token = useRef("");
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const value = new URLSearchParams(location.hash.slice(1)).get("token");
      if (value) {
        token.current = value;
        setHasToken(true);
        history.replaceState(
          history.state,
          "",
          location.pathname + location.search,
        );
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      const r = await fetch(
        hasToken ? "/api/order/access" : "/api/order/recover",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            hasToken ? { token: token.current } : { email: email.trim() },
          ),
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Please try again later.");
      if (hasToken) {
        if (
          typeof data.url !== "string" ||
          !data.url.startsWith("/checkout/success?")
        )
          throw new Error("Invalid access destination.");
        location.assign(data.url);
      } else setMessage(data.message);
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error ? error.message : "Please try again later.",
      );
    }
    setBusy(false);
  }
  return (
    <section className="commerce-panel">
      <h2>
        {hasToken ? "Open your private reading shelf." : "Find your purchase."}
      </h2>
      <p>
        {hasToken
          ? "This link can be used once. Continue to restore access in this browser."
          : "Enter the email address used at checkout. If an eligible purchase exists, we’ll send a private access link."}
      </p>
      <form className="commerce-form" onSubmit={submit}>
        {!hasToken && (
          <>
            <label htmlFor="recovery-email">Purchase email address</label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </>
        )}
        <button className="button" disabled={busy} type="submit">
          {busy
            ? "Please wait…"
            : hasToken
              ? "Restore my ebook access"
              : "Send an access link"}
        </button>
      </form>
      {message && <p role="status" className={`commerce-message ${failed ? "commerce-warning" : "commerce-success"}`}>{message}</p>}
    </section>
  );
}
