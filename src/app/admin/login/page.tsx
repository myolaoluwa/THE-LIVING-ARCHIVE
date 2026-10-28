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
  if (session) redirect("/admin/dashboard");
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
              Sign in with your email and password to manage your books and website.
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
              Administration is paused. Website content and images are managed
              in the project source and published through Vercel.
            </p>
            <ol>
              <li>
                Make website updates in the project and review them locally.
              </li>
              <li>Commit and push approved changes to GitHub.</li>
              <li>
                Check the resulting Vercel deployment before sharing updates.
              </li>
            </ol>
            <p>
              No administrator data is displayed and no changes can be saved in
              this state. The current workflow is in{" "}
              <code>docs/FRONTEND_LAUNCH.md</code>.
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
