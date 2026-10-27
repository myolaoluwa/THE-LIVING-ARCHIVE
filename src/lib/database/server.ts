import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { databaseConfig } from "./config";

export function publicDatabase({ cachePublished = false } = {}) {
  const config = databaseConfig();
  if (!config) return null;
  // Always anonymous, even when an administrator visits the public website.
  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // Opt in only for anonymous, published editorial content. Storage access
      // and existence checks still consult current RLS policies on every call.
      fetch: (url, options) =>
        fetch(
          url,
          cachePublished
            ? {
                ...options,
                cache: "force-cache",
                next: { revalidate: 60, tags: ["public-content"] },
              }
            : { ...options, cache: "no-store" },
        ),
    },
  });
}
export async function adminDatabase() {
  const config = databaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) =>
            jar.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            }),
          );
        } catch {
          /* Proxy refreshes cookies for read-only Server Components. */
        }
      },
    },
  });
}
