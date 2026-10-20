"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminDatabase } from "@/lib/database/server";
import { databaseConfig } from "@/lib/database/config";
import { adminSession } from "@/lib/auth/session";
import { signInSchema } from "@/lib/admin/validation";
import type { ActionState } from "@/lib/admin/action-state";

export async function signIn(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!databaseConfig())
    return {
      message: "Supabase must be connected before sign-in is available.",
    };
  const input = signInSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!input.success)
    return {
      message:
        "Enter a valid email and a password of at least eight characters.",
    };
  const client = await adminDatabase();
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error)
    return {
      message:
        "Sign-in was not successful. Check your details or try again later.",
    };
  const session = await adminSession();
  if (!session) {
    await client.auth.signOut({ scope: "local" });
    return {
      message: "This account does not have active administrator access.",
    };
  }
  redirect(session.aal === "aal2" ? "/admin/dashboard" : "/admin/mfa");
}
export async function signOut() {
  if (databaseConfig()) {
    const client = await adminDatabase();
    await client.auth.signOut({ scope: "local" });
  }
  redirect("/admin/login");
}
export type EnrollmentState = ActionState & {
  factorId?: string;
  qr?: string;
  secret?: string;
};
export async function enrollMfa(
  _state: EnrollmentState,
): Promise<EnrollmentState> {
  void _state;
  const session = await adminSession();
  if (!session) redirect("/admin/login");
  const { data: factors, error: listError } =
    await session.client.auth.mfa.listFactors();
  if (listError)
    return { message: "Could not load authentication factors. Please retry." };
  if (factors.totp.some((factor) => factor.status === "verified"))
    return {
      message:
        "An authenticator is already enrolled. Reload this page to verify a code.",
    };
  for (const factor of factors.all.filter(
    (f) => f.factor_type === "totp" && f.status === "unverified",
  ))
    await session.client.auth.mfa.unenroll({ factorId: factor.id });
  const { data, error } = await session.client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Living Archive administration",
  });
  if (error)
    return {
      message: "Authenticator enrollment could not be started. Please retry.",
    };
  return {
    message: "Scan the QR code, then verify a code to finish enrollment.",
    factorId: data.id,
    qr: `data:image/svg+xml;base64,${Buffer.from(data.totp.qr_code).toString("base64")}`,
    secret: data.totp.secret,
  };
}
export async function verifyMfa(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await adminSession();
  if (!session) redirect("/admin/login");
  const parsed = z
    .object({ factorId: z.uuid(), code: z.string().regex(/^\d{6}$/) })
    .safeParse({ factorId: form.get("factorId"), code: form.get("code") });
  if (!parsed.success)
    return { message: "Enter the current six-digit authenticator code." };
  const { error } = await session.client.auth.mfa.challengeAndVerify(
    parsed.data,
  );
  if (error)
    return {
      message:
        "The code could not be verified. Use a fresh code and try again.",
    };
  redirect("/admin/dashboard");
}
