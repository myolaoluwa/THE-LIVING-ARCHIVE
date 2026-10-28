"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Progressive enhancement: content stays visible without JavaScript or motion. */
export function ArchiveMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".public-site");
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const bookshelfCards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-bookshelf-entrance] > .book-card"),
    );
    const entrances = new Map<HTMLElement, Animation>();
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const show = (element: HTMLElement, animate = false) => {
      const wasPending = element.dataset.revealed === "pending";
      element.dataset.revealed = "true";
      entrances.get(element)?.cancel();
      if (animate && wasPending && bookshelfCards.includes(element) && !preference.matches) {
        const animation = element.animate(
          [
            { opacity: 0, transform: "perspective(1000px) translateY(56px) rotateX(7deg) scale(0.94)" },
            { opacity: 1, transform: "perspective(1000px) translateY(0) rotateX(0deg) scale(1)" },
          ],
          {
            duration: 1100,
            delay: Math.min(bookshelfCards.indexOf(element), 3) * 140,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "backwards",
          },
        );
        entrances.set(element, animation);
      }
    };
    const configure = () => {
      observer?.disconnect();
      targets.forEach((target) => show(target));
      if (preference.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target as HTMLElement, true);
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
      );
      targets.forEach((target) => {
        // Observe the bookshelf even when already visible after arrival or refresh.
        // IntersectionObserver also waits for horizontally scrolled mobile cards.
        if (bookshelfCards.includes(target) || target.getBoundingClientRect().top > window.innerHeight - 32) {
          target.dataset.revealed = "pending";
          observer?.observe(target);
        }
      });
    };
    const progress = () => {
      frame = 0;
      const distance =
        document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty(
        "--reading-progress",
        String(distance > 0 ? Math.min(1, window.scrollY / distance) : 0),
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(progress);
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) {
        const shelf = event.target.closest<HTMLElement>(".book-grid");
        const card = event.target.closest(".book-card");
        if (shelf && card && event.target.matches(":focus-visible")) {
          // Native focus scrolling can leave a partially visible link clipped
          // at a snap boundary. Adjust only horizontal keyboard scrolling;
          // pointer clicks must not move their target before pointerup.
          const bounds = shelf.getBoundingClientRect();
          const target = event.target.getBoundingClientRect();
          if (target.left < bounds.left || target.right > bounds.right) {
            shelf.scrollLeft += card.getBoundingClientRect().left - bounds.left - 4;
          }
        }
        const parent = event.target.closest<HTMLElement>(
          '[data-revealed="pending"]',
        );
        if (parent) {
          show(parent);
          observer?.unobserve(parent);
        }
      }
    };
    configure();
    progress();
    preference.addEventListener("change", configure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("focusin", onFocus);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      targets.forEach((target) => show(target));
      entrances.forEach((animation) => animation.cancel());
      preference.removeEventListener("change", configure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("focusin", onFocus);
    };
  }, [pathname]);

  return <div className="reading-progress" aria-hidden="true" />;
}
