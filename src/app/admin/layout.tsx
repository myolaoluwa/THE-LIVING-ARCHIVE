import type { Metadata } from "next";
import "./admin.css";
export const metadata: Metadata = {
  title: {
    default: "Administration | The Living Archive",
    template: "%s | Archive Administration",
  },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
