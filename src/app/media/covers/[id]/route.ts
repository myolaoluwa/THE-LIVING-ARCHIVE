import { z } from "zod";
import { publicDatabase } from "@/lib/database/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = publicDatabase();
  const id = z.uuid().safeParse((await params).id);
  if (!db || !id.success) return new Response("Not found", { status: 404 });
  const { data, error } = await db
    .from("media_assets")
    .select("storage_path,mime_type")
    .eq("id", id.data)
    .maybeSingle();
  // Anonymous RLS only permits a cover referenced by a published book.
  if (error || !data) return new Response("Not found", { status: 404 });
  const download = await db.storage
    .from("book-covers")
    .download(data.storage_path);
  if (download.error) return new Response("Not found", { status: 404 });
  return new Response(download.data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
