"use client";
import { useEffect, useId, useRef, useState } from "react";

export function Bookshelf({ children, count, label, entrance = false, related = false }: {
  children: React.ReactNode;
  count: number;
  label: string;
  entrance?: boolean;
  related?: boolean;
}) {
  const id = useId();
  const row = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: count ? 1 : 0, previous: false, next: false });
  useEffect(() => {
    const element = row.current;
    if (!element) return;
    const update = () => {
      const cards = Array.from(element.children) as HTMLElement[];
      const left = element.getBoundingClientRect().left;
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 3;
      const index = cards.reduce((nearest, card, i) =>
        Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[nearest].getBoundingClientRect().left - left) ? i : nearest, 0);
      setPosition({ index: !count ? 0 : end && element.scrollWidth > element.clientWidth + 3 ? count : index + 1, previous: element.scrollLeft > 3, next: !end });
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [count]);
  function move(direction: number) {
    const element = row.current;
    if (!element) return;
    const card = element.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 24;
    element.scrollBy({ left: direction * ((card?.getBoundingClientRect().width || element.clientWidth) + gap), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return (
    <div className="bookshelf">
      <div className="bookshelf-navigation">
        <div><strong>{count} books to explore</strong><p>Swipe sideways or use the arrows <span aria-hidden="true">→</span></p></div>
        <div className="bookshelf-controls">
          <span className="bookshelf-position" aria-live="polite" aria-atomic="true">{position.index} / {count}</span>
          <button type="button" aria-label="Previous book" aria-controls={id} disabled={!position.previous} onClick={() => move(-1)}>←</button>
          <button type="button" aria-label="Next book" aria-controls={id} disabled={!position.next} onClick={() => move(1)}>→</button>
        </div>
      </div>
      <div ref={row} id={id} className={`book-grid${related ? " related-grid" : ""}`} data-bookshelf-entrance={entrance ? "" : undefined} role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}
