import "server-only";
import { z } from "zod";
export function databaseConfig() {
  // Backend is postponed. Existing credentials alone must not enable it.
  if (process.env.BACKEND_ENABLED !== "true") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url && !key) return null;
  const parsed = z
    .object({ url: z.url(), key: z.string().min(20) })
    .safeParse({ url, key });
  if (!parsed.success)
    throw new Error("Supabase configuration is incomplete or invalid.");
  if (!parsed.data.key.startsWith("sb_publishable_")) {
    let role = "";
    try {
      role = JSON.parse(
        Buffer.from(
          parsed.data.key.split(".")[1] || "",
          "base64url",
        ).toString(),
      ).role;
    } catch {}
    if (role !== "anon")
      throw new Error(
        "Use only a Supabase publishable key or legacy anonymous key. Secret and service-role keys are prohibited.",
      );
  }
  const hostname = new URL(parsed.data.url).hostname;
  if (
    !parsed.data.url.startsWith("https://") &&
    !["localhost", "127.0.0.1"].includes(hostname)
  )
    throw new Error("Supabase requires HTTPS outside localhost.");
  return parsed.data;
}
