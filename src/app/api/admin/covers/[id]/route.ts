import { z } from "zod";
import { adminSession } from "@/lib/auth/session";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await adminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return new Response("Not found", { status: 404 });
  const { data, error } = await session.client
    .from("media_assets")
    .select("storage_path")
    .eq("id", id.data)
    .maybeSingle();
  if (error || !data) return new Response("Not found", { status: 404 });
  const download = await session.client.storage
    .from("book-covers")
    .download(data.storage_path);
  if (download.error) return new Response("Not found", { status: 404 });
  return new Response(download.data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
