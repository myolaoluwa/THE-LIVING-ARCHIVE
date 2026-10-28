"use server";
import { redirect } from "next/navigation";
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
  redirect("/admin/dashboard");
}
export async function signOut() {
  if (databaseConfig()) {
    const client = await adminDatabase();
    await client.auth.signOut({ scope: "local" });
  }
  redirect("/admin/login");
}
