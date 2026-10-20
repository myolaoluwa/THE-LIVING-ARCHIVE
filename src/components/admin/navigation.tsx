"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { permits, type StaffRole } from "@/lib/admin/validation";
const links = [
  ["dashboard", "Overview", "edit"],
  ["books", "Books & editions", "edit"],
  ["assets", "Files & covers", "edit"],
  ["content", "Website content", "edit"],
  ["orders", "Orders", "manage"],
  ["customers", "Customers", "manage"],
  ["enquiries", "Enquiries", "manage"],
  ["subscribers", "Subscribers", "manage"],
  ["analytics", "Analytics", "manage"],
  ["settings", "Site settings", "owner"],
  ["team", "Team & access", "owner"],
  ["audit", "Activity log", "owner"],
] as const;
export function AdminNavigation({ role }: { role: StaffRole }) {
  const path = usePathname();
  return (
    <nav aria-label="Administration navigation">
      {links
        .filter((link) => permits(role, link[2]))
        .map(([slug, label]) => (
          <Link
            key={slug}
            href={`/admin/${slug}`}
            aria-current={
              path.startsWith(`/admin/${slug}`) ? "page" : undefined
            }
          >
            {label}
          </Link>
        ))}
    </nav>
  );
}
