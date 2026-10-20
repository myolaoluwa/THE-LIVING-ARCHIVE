import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { databaseConfig } from "@/lib/database/config";
import { publicDatabase } from "@/lib/database/server";
import { books as approvedBooks } from "@/lib/content";
export async function proxy(request: NextRequest) {
  const bookPath = request.nextUrl.pathname.match(/^\/books\/([^/]+)\/?$/);
  if (bookPath) {
    const slug = bookPath[1];
    const db = publicDatabase();
    let exists = approvedBooks.some((book) => book.slug === slug);
    if (db) {
      const result = await db
        .from("books")
        .select("id")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (result.error)
        throw new Error("The published book could not be checked.");
      exists = !!result.data;
    }
    // Check before streaming so unpublished/missing books receive a real 404.
    if (!exists) {
      const response = NextResponse.rewrite(
        new URL("/book-unavailable", request.url),
        { status: 404 },
      );
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("X-Robots-Tag", "noindex");
      return response;
    }
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const connection = databaseConfig();
  if (connection) {
    const client = createServerClient(connection.url, connection.key, {
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            }),
          );
        },
      },
    });
    await client.auth.getClaims();
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/books/:slug"],
};
