import Link from "next/link";
import { SubstackLink } from "./substack-link";
import { ArchiveMark, Arrow } from "./icons";
import { getPublicSettings } from "@/lib/database/catalog";
export async function Footer() {
  const settings = await getPublicSettings();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-masthead" aria-hidden="true">
          The Living <em>Archive.</em>
        </div>
        <div className="footer-main">
          <div>
            <Link href="/" className="brand footer-brand">
              <ArchiveMark />
              <span>
                Edmund Spencer Katso
                <small>
                  {(settings.site_name || "The Living Archive").toUpperCase()}
                </small>
              </span>
            </Link>
            <p>
              Histories, memories and stories
              <br />
              from Central and Southern Africa.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <span className="eyebrow">Explore</span>
            <Link href="/">
              Home
              <Arrow diagonal />
            </Link>
            <Link href="/books">
              The books
              <Arrow diagonal />
            </Link>
            <Link href="/about">
              The author
              <Arrow diagonal />
            </Link>
            <Link href="/contact">
              Get in touch
              <Arrow diagonal />
            </Link>
            <SubstackLink>Substack</SubstackLink>
          </nav>
          <div className="footer-note">
            <span className="eyebrow">A place for stories</span>
            <p>
              Rooted in history.
              <br />
              Written for generations.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Edmund Spencer Katso</span>
          <span>Author · Educator · Historian</span>
          <Link href="/privacy">Privacy & site information</Link>
          <a className="back-to-top" href="#top">
            Back to top <Arrow diagonal />
          </a>
        </div>
      </div>
    </footer>
  );
}
