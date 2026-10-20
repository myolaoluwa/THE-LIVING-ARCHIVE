"use client";
import { useState } from "react";
import { Arrow } from "./icons";
export function ShareButton({ title }: { title: string }) {
  const [status, setStatus] = useState("");
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        setStatus("Share options opened.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setStatus("Book link copied.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setStatus(
          "Couldn’t share automatically. Copy this page’s address to share it.",
        );
    }
  }
  return (
    <div className="share-wrap">
      <button className="text-link" type="button" onClick={share}>
        Share this book
        <Arrow diagonal />
      </button>
      <span className="form-status" role="status">
        {status}
      </span>
    </div>
  );
}
