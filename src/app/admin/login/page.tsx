import Link from "next/link";
import { redirect } from "next/navigation";
import { ArchiveMark } from "@/components/icons";
import { databaseConfig } from "@/lib/database/config";
import { adminSession } from "@/lib/auth/session";
import { ActionForm } from "@/components/admin/action-form";
import { signIn } from "../auth-actions";
export default async function LoginPage() {
  const configured = !!databaseConfig();
  const session = configured ? await adminSession() : null;
  if (session)
    redirect(session.aal === "aal2" ? "/admin/dashboard" : "/admin/mfa");
  return (
    <main id="main" className="admin-auth">
      <Link href="/" className="brand">
        <ArchiveMark />
        <span>
          The Living Archive<small>AUTHOR ADMINISTRATION</small>
        </span>
      </Link>
      <div className="admin-auth-card">
        <p className="eyebrow">A space for your work</p>
        <h1>{configured ? "Welcome back." : "Connect your archive."}</h1>
        {configured ? (
          <>
            <p>
              Sign in to manage your books and website. An authenticator code is
              required after sign-in.
            </p>
            <ActionForm action={signIn} label="Sign in">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                required
                maxLength={254}
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={256}
              />
            </ActionForm>
          </>
        ) : (
          <div className="admin-setup">
            <p>
              Administration is not connected to Supabase yet. Sign-in, editing
              and uploads remain unavailable until setup is complete.
            </p>
            <ol>
              <li>
                Add the project URL and publishable key to{" "}
                <code>.env.local</code>.
              </li>
              <li>Apply the versioned migrations to your Supabase project.</li>
              <li>
                Create the first owner account and enroll an authenticator.
              </li>
            </ol>
            <p>
              No administrator data is displayed and no changes can be saved in
              this state. Setup instructions are in{" "}
              <code>docs/PHASE3_SETUP.md</code>.
            </p>
          </div>
        )}
        <Link className="text-link" href="/">
          Return to the website
        </Link>
      </div>
    </main>
  );
}
