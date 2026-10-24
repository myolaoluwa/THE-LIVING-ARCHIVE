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
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const show = (element: HTMLElement) => {
      element.dataset.revealed = "true";
    };
    const configure = () => {
      observer?.disconnect();
      targets.forEach(show);
      if (preference.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target as HTMLElement);
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
      );
      targets.forEach((target) => {
        if (target.getBoundingClientRect().top > window.innerHeight - 32) {
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
      targets.forEach(show);
      preference.removeEventListener("change", configure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("focusin", onFocus);
    };
  }, [pathname]);

  return <div className="reading-progress" aria-hidden="true" />;
}
