import Link from "next/link";
import { redirect } from "next/navigation";
import { adminSession } from "@/lib/auth/session";
import { MfaForm } from "@/components/admin/mfa-form";
import { signOut } from "../auth-actions";
export default async function MfaPage() {
  const session = await adminSession();
  if (!session) redirect("/admin/login");
  if (session.aal === "aal2") redirect("/admin/dashboard");
  const { data, error } = await session.client.auth.mfa.listFactors();
  if (error) throw new Error("Authenticator factors could not be loaded.");
  return (
    <main id="main" className="admin-auth">
      <div className="admin-auth-card">
        <p className="eyebrow">Account protection</p>
        <h1>One more step.</h1>
        <p>Verify your authenticator to open the archive administration.</p>
        <MfaForm
          factorId={data.totp.find((f) => f.status === "verified")?.id}
        />
        <form action={signOut}>
          <button className="text-link" type="submit">
            Sign out
          </button>
        </form>
        <Link href="/" className="text-link">
          Back to website
        </Link>
      </div>
    </main>
  );
}
