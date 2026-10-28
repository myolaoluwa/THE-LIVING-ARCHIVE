import Image from "next/image";
import type { ReactNode } from "react";
import { authorSubstackNote } from "@/lib/author-links";
import { Arrow } from "./icons";
import styles from "./substack-link.module.css";

export function SubstackLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={authorSubstackNote} className={className}>
      <span className={styles.label}>
        {/* Original, unmodified asset from https://substack.com/brand. */}
        <Image
          src="/images/substack-logo.png"
          alt=""
          width={40}
          height={40}
          className={styles.logo}
          unoptimized
        />
        <span>{children}</span>
      </span>
      <Arrow diagonal />
    </a>
  );
}
