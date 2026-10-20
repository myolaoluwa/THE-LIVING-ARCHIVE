"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArchiveMark, Arrow } from "./icons";
const links = [
  { href: "/", label: "Home" },
  { href: "/books", label: "The Books" },
  { href: "/about", label: "The Author" },
  { href: "/contact", label: "Contact" },
];
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (open) {
      el?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      el?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link
            href="/"
            className="brand"
            aria-label="Edmund Spencer Katso — home"
          >
            <ArchiveMark />
            <span>
              Edmund Spencer Katso<small>THE LIVING ARCHIVE</small>
            </span>
          </Link>
          <nav aria-label="Primary navigation" className="desktop-nav">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link className="header-cta" href="/books">
            Explore the books
            <Arrow diagonal />
          </Link>
          <button
            ref={trigger}
            type="button"
            className="menu-trigger"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <dialog
        ref={dialog}
        id="mobile-navigation"
        className="mobile-dialog"
        aria-labelledby="navigation-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="mobile-dialog-top">
          <span id="navigation-title" className="eyebrow">
            The Living Archive
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="close-menu"
          >
            ×
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              aria-current={active(link.href) ? "page" : undefined}
            >
              <small>0{i + 1}</small>
              {link.label}
              <Arrow diagonal />
            </Link>
          ))}
        </nav>
        <p className="mobile-note">
          History remembered.
          <br />
          Stories preserved.
        </p>
      </dialog>
    </>
  );
}
