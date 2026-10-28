"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Arrow } from "@/components/icons";
export function DirectPurchaseButton({
  slug,
  noteId,
}: {
  slug: string;
  noteId: string;
}) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/checkout/catalog", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!controller.signal.aborted)
          setAvailable(
            data?.enabled === true &&
              Array.isArray(data.books) &&
              data.books.some((book: { slug: string }) => book.slug === slug),
          );
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slug]);
  return (
    <>
      {available ? (
        <Link className="button" href={`/cart?add=${encodeURIComponent(slug)}`}>
          Buy ebook directly <Arrow />
        </Link>
      ) : (
        <button
          type="button"
          className="button edition-unavailable"
          disabled
          aria-describedby={noteId}
        >
          Buy ebook directly <Arrow />
        </button>
      )}
      <p className="edition-note">
        {available
          ? "Add this ebook to your cart for secure checkout and private digital delivery."
          : "Direct checkout is unavailable until this edition is ready for sale."}
      </p>
    </>
  );
}
