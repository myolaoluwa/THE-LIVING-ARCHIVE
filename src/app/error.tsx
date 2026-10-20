"use client";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public page rendering failed", {
      digest: error.digest || "unavailable",
    });
  }, [error]);
  return (
    <main id="main" className="container empty-page">
      <p className="eyebrow">A brief interruption</p>
      <h1>
        Let’s turn
        <br />
        <em>the page again.</em>
      </h1>
      <p>This page could not be loaded. Please try again.</p>
      <button type="button" className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
