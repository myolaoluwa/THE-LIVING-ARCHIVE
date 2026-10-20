import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { AdminNavigation } from "@/components/admin/navigation";
import { ArchiveMark } from "@/components/icons";
import { signOut } from "../auth-actions";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to administration content
      </a>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link href="/admin/dashboard" className="brand">
            <ArchiveMark />
            <span>
              The Living Archive<small>ADMINISTRATION</small>
            </span>
          </Link>
          <AdminNavigation role={profile.role} />
          <Link href="/" className="admin-public-link">
            View public website ↗
          </Link>
        </aside>
        <div className="admin-workspace">
          <header className="admin-topbar">
            <span>
              {profile.display_name}
              <small>{profile.role}</small>
            </span>
            <form action={signOut}>
              <button type="submit" className="text-link">
                Sign out
              </button>
            </form>
          </header>
          {children}
        </div>
      </div>
    </>
  );
}
