import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";

// Preserve old bookmarks without requiring authenticator enrollment.
export default async function MfaPage() {
  await requireAdmin();
  redirect("/admin/dashboard");
}
